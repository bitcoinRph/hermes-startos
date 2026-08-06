#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import WebSocket from '/opt/data/tmp/buzz-nip42-probe/node_modules/ws/index.js';
import { finalizeEvent } from '/opt/data/tmp/buzz-nip42-probe/node_modules/nostr-tools/lib/esm/index.js';
import { hexToBytes } from '/opt/data/tmp/buzz-startos-src/node_modules/@noble/hashes/utils.js';

const DEFAULT_CONFIG = {
  bridgeName: process.env.AGENT_BUZZ_BRIDGE_NAME || 'agent buzz bridge',
  actualUrl: process.env.AGENT_BUZZ_ACTUAL_URL || 'wss://192.168.0.104:55104',
  hostHeader: process.env.AGENT_BUZZ_HOST_HEADER || 'rusty-fingers.local:55104',
  authRelayUrl: process.env.AGENT_BUZZ_AUTH_RELAY_URL || 'wss://rusty-fingers.local:55104',
  keyPath: process.env.AGENT_BUZZ_KEY_PATH || '/opt/data/secrets/buzz-herman-agent-keypair.json',
  statePath: process.env.AGENT_BUZZ_STATE_PATH || '/opt/data/state/agent-buzz-bridge/herman/state.json',
  caPath: '/opt/data/profiles/herman/certs/combined-public-plus-homeassistant.pem',
  logPath: process.env.AGENT_BUZZ_LOG_PATH || '/opt/data/state/agent-buzz-bridge/herman/gateway.log',
  hermesCommand: process.env.AGENT_BUZZ_HERMES_COMMAND || '/opt/data/.local/bin/hermes',
  hermesProfile: process.env.AGENT_BUZZ_HERMES_PROFILE || 'herman',
  hermesToolsets: process.env.AGENT_BUZZ_HERMES_TOOLSETS || 'memory,skills,session_search,file,terminal,web,cronjob,delegation,todo,clarify',
  hermesTimeoutMs: 420_000,
  relayReplyMaxChars: 8000,
  postWorkingReceipts: process.env.AGENT_BUZZ_WORKING_RECEIPTS !== '0',
  queueMax: 8,
  allowedAuthorPubkeys: (process.env.AGENT_BUZZ_ALLOWED_PUBKEYS || process.env.BUZZ_HERMAN_ALLOWED_PUBKEYS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  peerAuthorPubkeys: (process.env.AGENT_BUZZ_PEER_PUBKEYS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  mentionAliases: (process.env.AGENT_BUZZ_MENTION_ALIASES || process.env.AGENT_BUZZ_NAME || 'herman')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  profile: {
    name: process.env.AGENT_BUZZ_NAME || 'herman',
    display_name: process.env.AGENT_BUZZ_DISPLAY_NAME || 'Herman',
    about: process.env.AGENT_BUZZ_ABOUT || 'Agent on the private Buzz relay. Mention this agent in Buzz to route work through Hermes.',
  },
  messageKinds: [9, 40002, 45001, 45003, 40008],
};

export function extractTag(tags, key) {
  for (const tag of tags || []) {
    if (Array.isArray(tag) && tag[0] === key && typeof tag[1] === 'string') return tag[1];
  }
  return null;
}

function extractTags(tags, key) {
  return (tags || [])
    .filter((tag) => Array.isArray(tag) && tag[0] === key && typeof tag[1] === 'string')
    .map((tag) => tag[1]);
}

export function eventChannelId(event) {
  return extractTag(event.tags, 'h');
}

export function displayAuthor(pubkey, profiles = new Map()) {
  const profile = profiles.get(pubkey);
  const name = profile?.display_name || profile?.name;
  if (name) return name;
  if (!pubkey || pubkey.length < 12) return pubkey || 'unknown';
  return `${pubkey.slice(0, 8)}…${pubkey.slice(-4)}`;
}

export function updateSeenState(state, events, { maxSeen = 1000 } = {}) {
  state.seen_ids ||= [];
  state.channel_since ||= {};
  const seen = new Set(state.seen_ids);
  const unseen = [];
  for (const event of events) {
    if (!event?.id) continue;
    const channel = eventChannelId(event) || '_global';
    const ts = Number(event.created_at || 0);
    if (!seen.has(event.id)) unseen.push(event);
    seen.add(event.id);
    state.channel_since[channel] = Math.max(Number(state.channel_since[channel] || 0), ts);
  }
  state.seen_ids = Array.from(seen).slice(-maxSeen);
  state.updated_at = Math.floor(Date.now() / 1000);
  return unseen;
}

function markStateList(state, key, id, max = 2000) {
  state[key] ||= [];
  if (!state[key].includes(id)) state[key].push(id);
  if (state[key].length > max) state[key] = state[key].slice(-max);
  state.updated_at = Math.floor(Date.now() / 1000);
}

export function markEventInFlight(state, eventId, { now = Math.floor(Date.now() / 1000), ttlSec = 900 } = {}) {
  if (state.responded_ids?.includes(eventId)) return 'already-responded';
  state.in_flight_ids ||= {};
  for (const [id, ts] of Object.entries(state.in_flight_ids)) {
    if (now - Number(ts || 0) > ttlSec) delete state.in_flight_ids[id];
  }
  const startedAt = Number(state.in_flight_ids[eventId] || 0);
  if (startedAt && now - startedAt <= ttlSec) return 'already-in-flight';
  state.in_flight_ids[eventId] = now;
  state.updated_at = now;
  return null;
}

export function clearEventInFlight(state, eventId) {
  if (state.in_flight_ids) delete state.in_flight_ids[eventId];
  state.updated_at = Math.floor(Date.now() / 1000);
}

export function channelFromMetadataEvent(event) {
  const id = extractTag(event.tags, 'd') || extractTag(event.tags, 'h');
  if (!id) return null;
  const name = extractTag(event.tags, 'name') || id;
  const about = extractTag(event.tags, 'about') || '';
  return { id, name, about, event_id: event.id };
}

function oneLine(text, max = 240) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

export function truncateForRelay(text, maxChars = DEFAULT_CONFIG.relayReplyMaxChars) {
  const clean = String(text || '').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1))}…`;
}

function stripAnsi(text) {
  return String(text || '').replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
}

export function extractHermesSessionId(text) {
  const match = String(text || '').match(/^session_id:\s*(\S+)\s*$/im);
  return match ? match[1] : null;
}

export function cleanHermesOutput(text) {
  return stripAnsi(text)
    .split('\n')
    .filter((line) => !/^Warning: Unknown toolsets:/i.test(line.trim()))
    .filter((line) => !/^↻\s*Resumed session\s+/i.test(line.trim()))
    .filter((line) => !/^session_id:\s*\S+/i.test(line.trim()))
    .join('\n')
    .trim();
}

export function renderDigest(events, channels = new Map(), profiles = new Map()) {
  if (!events.length) return '';
  const noun = events.length === 1 ? 'message' : 'messages';
  const lines = [`Buzz relay: ${events.length} new ${noun}`];
  for (const event of events.sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0))) {
    const channelId = eventChannelId(event) || '_global';
    const channelName = channels.get(channelId)?.name || channelId;
    const author = displayAuthor(event.pubkey, profiles);
    const content = oneLine(event.content);
    lines.push(`- #${channelName} · ${author}: ${content} (${event.id.slice(0, 10)})`);
  }
  return `${lines.join('\n')}\n`;
}

export function buildAgentProfileContent({ pubkey, channelIds = [], config = DEFAULT_CONFIG } = {}) {
  return {
    name: config.profile.name,
    display_name: config.profile.display_name,
    about: config.profile.about,
    agent_type: config.profile.name,
    runtime: 'hermes-agent',
    gateway: config.bridgeName,
    pubkey,
    respond_to: 'allowlist',
    respond_to_allowlist: config.allowedAuthorPubkeys || [],
    channel_ids: channelIds,
    capabilities: [
      'buzz_dm',
      'buzz_mentions',
      'hermes_tools',
      'chief_of_staff_routing',
      'file_terminal_web_when_available',
    ],
    status: 'online',
  };
}

export function hasReplyToEvent(event, trackedIds = new Set()) {
  if (!trackedIds?.size) return false;
  for (const tag of event.tags || []) {
    if (tag?.[0] === 'e' && tag?.[1] && trackedIds.has(tag[1])) return true;
  }
  return false;
}

export function shouldRespondToEvent(event, key, channels = new Map(), config = DEFAULT_CONFIG, hermanMessageIds = new Set()) {
  if (!event?.id || event.pubkey?.toLowerCase() === key.pubkey.toLowerCase()) {
    return { respond: false, reason: 'self-or-invalid' };
  }
  const author = (event.pubkey || '').toLowerCase();
  if (config.allowedAuthorPubkeys?.length && !config.allowedAuthorPubkeys.includes(author)) {
    return { respond: false, reason: 'author-not-allowed' };
  }
  const channelId = eventChannelId(event);
  const channelName = (channels.get(channelId)?.name || '').toLowerCase();
  const pTags = extractTags(event.tags, 'p').map((p) => p.toLowerCase());
  const aliases = new Set([
    ...(config.mentionAliases || []),
    config.profile?.name,
    config.profile?.display_name,
  ].filter(Boolean).map((s) => String(s).toLowerCase()));
  if (channelName === 'dm' || channelName.includes('direct')) return { respond: true, reason: 'dm-channel' };
  for (const alias of aliases) {
    if (alias && (channelName === alias || channelName.includes(alias))) return { respond: true, reason: 'agent-channel' };
  }
  if (pTags.includes(key.pubkey.toLowerCase())) return { respond: true, reason: 'p-mention' };
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (alias && new RegExp(`(^|\\s)@?${escaped}(?=\\b|\\s|[:,.!?]|$)`, 'i').test(event.content || '')) {
      return { respond: true, reason: 'text-mention' };
    }
  }
  if (!config.peerAuthorPubkeys?.includes(author) && hasReplyToEvent(event, hermanMessageIds)) return { respond: true, reason: 'direct-reply' };
  return { respond: false, reason: 'not-addressed' };
}

export function buildHermesPrompt({ event, channel, author, reason, config = DEFAULT_CONFIG }) {
  const channelLabel = channel?.name ? `#${channel.name}` : (channel?.id || '_global');
  const agentName = config.profile.display_name || config.profile.name || config.hermesProfile;
  return [
    `Incoming Buzz gateway message for ${agentName}.`,
    '',
    `Buzz channel: ${channelLabel}`,
    `Buzz event id: ${event.id}`,
    `Buzz author: ${author || event.pubkey}`,
    `Routing reason: ${reason}`,
    '',
    'User message:',
    event.content || '',
    '',
    `Respond as ${agentName}. Use that profile's normal voice and instructions. Coordinate with the other Buzz agent when the user asks both agents to work together, but do not fabricate actions taken by the other agent.`,
    'Verdict first. Be blunt, concise, and action-oriented. If tools are available and the user asks for work, do the work as you normally would in Hermes. If the action is irreversible, financial, credential-related, public, destructive, or needs third-party approval, ask for approval instead of doing it. Do not mention gateway internals unless directly relevant.',
  ].join('\n');
}

export function rootEventIdFromTags(tags = []) {
  const eTags = extractTags(tags, 'e');
  if (!eTags.length) return null;
  const markedRoot = (tags || []).find((tag) => tag?.[0] === 'e' && tag?.[3] === 'root')?.[1];
  if (markedRoot) return markedRoot;
  return eTags[0];
}

export function conversationSessionKey(event, channelId = eventChannelId(event)) {
  const rootId = rootEventIdFromTags(event?.tags || []);
  return rootId ? `${channelId || '_global'}:thread:${rootId}` : `${channelId || '_global'}:root`;
}

export function buildReplyTags(channelId, replyToEvent = null, { broadcast = false } = {}) {
  const tags = [['h', channelId]];
  if (replyToEvent) {
    const source = typeof replyToEvent === 'string' ? { id: replyToEvent, tags: [] } : replyToEvent;
    const rootId = rootEventIdFromTags(source.tags);
    if (rootId && rootId !== source.id) tags.push(['e', rootId, '', 'root']);
    tags.push(['e', source.id, '', 'reply']);
  }
  if (broadcast) tags.push(['broadcast', '1']);
  return tags;
}

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function saveJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file);
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function updateState(config, fallback, updater) {
  fs.mkdirSync(path.dirname(config.statePath), { recursive: true, mode: 0o700 });
  const lockPath = `${config.statePath}.lock`;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    let fd = null;
    try {
      fd = fs.openSync(lockPath, 'wx', 0o600);
      fs.writeFileSync(fd, `${process.pid}\n${Date.now()}\n`);
      const state = loadJson(config.statePath, fallback);
      const updated = updater(state) || state;
      saveJson(config.statePath, updated);
      return updated;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > 30_000) fs.unlinkSync(lockPath);
      } catch {}
      sleepSync(50);
    } finally {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
        try { fs.unlinkSync(lockPath); } catch {}
      }
    }
  }
  throw new Error(`state lock timeout for ${config.statePath}`);
}

function log(config, line) {
  fs.mkdirSync(path.dirname(config.logPath), { recursive: true, mode: 0o700 });
  fs.appendFileSync(config.logPath, `${new Date().toISOString()} ${line}\n`, { mode: 0o600 });
}

function loadKey(config) {
  const key = loadJson(config.keyPath, null);
  if (!key?.private_key_hex || !key?.pubkey) throw new Error(`missing Buzz key at ${config.keyPath}`);
  return key;
}

function signEvent(key, { kind, content = '', tags = [], created_at = Math.floor(Date.now() / 1000) }) {
  return finalizeEvent({ kind, content, tags, created_at }, hexToBytes(key.private_key_hex));
}

class BuzzRelay {
  constructor(config, key) {
    this.config = config;
    this.key = key;
    this.ws = null;
    this.authenticated = false;
    this.pendingOk = new Map();
    this.pendingReq = new Map();
    this.subscriptions = new Map();
  }

  async connect() {
    if (this.ws && this.authenticated) return;
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(this.config.actualUrl, {
        ca: fs.readFileSync(this.config.caPath),
        servername: this.config.hostHeader.split(':')[0],
        headers: { Host: this.config.hostHeader },
      });
      this.ws = ws;
      let settled = false;
      const failTimer = setTimeout(() => {
        if (!settled) reject(new Error('relay auth timeout'));
      }, 12000);
      ws.on('open', () => {});
      ws.on('message', (buf) => this.#handleMessage(buf.toString(), (v) => {
        settled = true;
        resolve(v);
      }, (e) => {
        settled = true;
        reject(e);
      }, failTimer));
      ws.on('error', (err) => {
        if (!settled) reject(err);
      });
      ws.on('close', () => {
        this.authenticated = false;
      });
    });
  }

  #handleMessage(text, authResolve, authReject, authTimer) {
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    const [type] = msg;
    if (type === 'AUTH') {
      const challenge = msg[1];
      const authEvent = signEvent(this.key, {
        kind: 22242,
        tags: [['relay', this.config.authRelayUrl], ['challenge', challenge]],
      });
      this.pendingOk.set(authEvent.id, { resolve: () => {
        clearTimeout(authTimer);
        this.authenticated = true;
        authResolve();
      }, reject: authReject });
      this.ws.send(JSON.stringify(['AUTH', authEvent]));
      return;
    }
    if (type === 'OK') {
      const [, eventId, ok, reason = ''] = msg;
      const pending = this.pendingOk.get(eventId);
      if (pending) {
        this.pendingOk.delete(eventId);
        ok ? pending.resolve({ eventId, ok, reason }) : pending.reject(new Error(`relay rejected event ${eventId}: ${reason}`));
      }
      return;
    }
    if (type === 'EVENT') {
      const [, subId, event] = msg;
      const pending = this.pendingReq.get(subId);
      if (pending) pending.events.push(event);
      const sub = this.subscriptions.get(subId);
      if (sub) sub.handler(event);
      return;
    }
    if (type === 'EOSE') {
      const [, subId] = msg;
      const pending = this.pendingReq.get(subId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingReq.delete(subId);
        pending.resolve(pending.events);
      }
      return;
    }
  }

  async publish(event) {
    await this.connect();
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingOk.delete(event.id);
        this.authenticated = false;
        try { this.ws?.terminate?.(); } catch {}
        try { this.ws?.close?.(); } catch {}
        reject(new Error(`publish timeout for ${event.id}`));
      }, 12000);
      this.pendingOk.set(event.id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify(['EVENT', event]));
    });
  }

  async req(filters, timeoutMs = 12000) {
    await this.connect();
    const subId = `herman-${crypto.randomBytes(4).toString('hex')}`;
    const filterList = Array.isArray(filters) ? filters : [filters];
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const pending = this.pendingReq.get(subId);
        this.pendingReq.delete(subId);
        this.authenticated = false;
        try { this.ws?.terminate?.(); } catch {}
        try { this.ws?.close?.(); } catch {}
        reject(new Error(`REQ ${subId} timeout after ${timeoutMs}ms with ${pending?.events?.length || 0} events`));
      }, timeoutMs);
      this.pendingReq.set(subId, { events: [], timer, resolve, reject });
      this.ws.send(JSON.stringify(['REQ', subId, ...filterList]));
    });
  }

  async subscribe(filters, handler) {
    await this.connect();
    const subId = `herman-live-${crypto.randomBytes(4).toString('hex')}`;
    const filterList = Array.isArray(filters) ? filters : [filters];
    this.subscriptions.set(subId, { handler });
    this.ws.send(JSON.stringify(['REQ', subId, ...filterList]));
    return () => {
      this.subscriptions.delete(subId);
      try { this.ws?.send(JSON.stringify(['CLOSE', subId])); } catch {}
    };
  }

  close() {
    try { this.ws?.close(); } catch {}
  }
}

async function withRelay(fn, config = DEFAULT_CONFIG) {
  const key = loadKey(config);
  const relay = new BuzzRelay(config, key);
  try { return await fn(relay, key, config); }
  finally { relay.close(); }
}

async function listChannels(relay) {
  const events = await relay.req({ kinds: [39000], limit: 500 }, 15000);
  const channels = new Map();
  for (const event of events) {
    const channel = channelFromMetadataEvent(event);
    if (channel) channels.set(channel.id, channel);
  }
  return channels;
}

async function fetchProfiles(relay, pubkeys) {
  const authors = Array.from(new Set(pubkeys.filter(Boolean)));
  const profiles = new Map();
  if (!authors.length) return profiles;
  const events = await relay.req({ kinds: [0], authors, limit: authors.length }, 12000);
  for (const event of events) {
    try { profiles.set(event.pubkey, JSON.parse(event.content || '{}')); }
    catch { profiles.set(event.pubkey, {}); }
  }
  return profiles;
}

async function poll({ baseline = false, limit = 50 } = {}) {
  return await withRelay(async (relay, key, config) => {
    const channels = await listChannels(relay);
    const state = loadJson(config.statePath, { seen_ids: [], channel_since: {} });
    let events = [];
    const targets = channels.size ? Array.from(channels.keys()) : ['_global'];
    for (const channelId of targets) {
      const filter = { kinds: config.messageKinds, limit };
      if (channelId !== '_global') filter['#h'] = [channelId];
      const since = Number(state.channel_since?.[channelId] || 0);
      if (since > 0) filter.since = since;
      const got = await relay.req(filter, 15000);
      events.push(...got);
    }
    events = events.filter((e, idx, arr) => arr.findIndex((x) => x.id === e.id) === idx);
    events.sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0));
    let unseen = [];
    updateState(config, { seen_ids: [], channel_since: {} }, (latestState) => {
      unseen = updateSeenState(latestState, events).filter((e) => e.pubkey !== key.pubkey);
      return latestState;
    });
    if (baseline) return '';
    const profiles = await fetchProfiles(relay, unseen.map((e) => e.pubkey));
    return renderDigest(unseen, channels, profiles);
  });
}

async function publishProfile() {
  return await withRelay(async (relay, key, config) => {
    const event = signEvent(key, { kind: 0, content: JSON.stringify(config.profile), tags: [] });
    await relay.publish(event);
    return { event_id: event.id, pubkey: key.pubkey, npub: key.npub, profile: config.profile };
  });
}

async function publishAgentProfile() {
  return await withRelay(async (relay, key, config) => {
    const channels = await listChannels(relay);
    const channelIds = Array.from(channels.keys());
    const content = buildAgentProfileContent({ pubkey: key.pubkey, channelIds, config });
    const event = signEvent(key, {
      kind: 10100,
      content: JSON.stringify(content),
      tags: [['d', config.profile.name], ['alt', `${config.profile.display_name} agent profile`]],
    });
    await relay.publish(event);
    return { event_id: event.id, pubkey: key.pubkey, npub: key.npub, profile: content };
  });
}

async function postMessage(channelId, message, { replyTo = null, replyToEvent = null, broadcast = false } = {}) {
  return await withRelay(async (relay, key, config) => {
    const tags = buildReplyTags(channelId, replyToEvent || replyTo, { broadcast });
    const event = signEvent(key, { kind: 9, content: truncateForRelay(message, config.relayReplyMaxChars), tags });
    await relay.publish(event);
    updateState(config, { seen_ids: [], channel_since: {}, responded_ids: [], herman_message_ids: [] }, (state) => {
      markStateList(state, 'herman_message_ids', event.id, 5000);
      return state;
    });
    return { event_id: event.id, pubkey: key.pubkey, channel_id: channelId };
  });
}

async function createChannel(name = 'herman', about = 'Work channel for Herman Hermes Agent collaboration') {
  return await withRelay(async (relay, key) => {
    const channelId = crypto.randomUUID();
    const event = signEvent(key, {
      kind: 9007,
      content: '',
      tags: [
        ['h', channelId],
        ['name', name],
        ['visibility', 'open'],
        ['channel_type', 'stream'],
        ['about', about],
      ],
    });
    await relay.publish(event);
    return { event_id: event.id, pubkey: key.pubkey, channel_id: channelId, name };
  });
}

async function postHandshake() {
  return await withRelay(async (relay, key) => {
    const channels = await listChannels(relay);
    const chosen = Array.from(channels.values()).find((c) => /dm|herman|general|main|home|random/i.test(c.name)) || Array.from(channels.values())[0];
    if (!chosen) throw new Error('no Buzz channels found; create a channel first or pass --channel to post');
    const content = `${DEFAULT_CONFIG.profile.display_name} is now wired through agent buzz bridge. DM or mention ${DEFAULT_CONFIG.profile.display_name} here and the configured Hermes profile will respond back in Buzz.`;
    const event = signEvent(key, { kind: 9, content, tags: [['h', chosen.id]] });
    await relay.publish(event);
    return { event_id: event.id, pubkey: key.pubkey, channel_id: chosen.id, channel_name: chosen.name };
  });
}

function runHermesPrompt(prompt, config = DEFAULT_CONFIG, sessionId = null) {
  return new Promise((resolve, reject) => {
    const args = [];
    if (sessionId) args.push('--resume', sessionId);
    args.push('-p', config.hermesProfile, 'chat', '-Q', '--source', 'buzz');
    if (config.hermesToolsets) args.push('-t', config.hermesToolsets);
    args.push('-q', prompt);
    const child = spawn(config.hermesCommand, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, HERMES_BUZZ_GATEWAY: '1' },
    });
    let stdout = '';
    let stderr = '';
    const cap = config.relayReplyMaxChars * 4;
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 3000);
      reject(new Error(`Hermes timed out after ${config.hermesTimeoutMs}ms`));
    }, config.hermesTimeoutMs);
    child.stdout.on('data', (buf) => { stdout += buf.toString(); if (stdout.length > cap) stdout = stdout.slice(-cap); });
    child.stderr.on('data', (buf) => { stderr += buf.toString(); if (stderr.length > cap) stderr = stderr.slice(-cap); });
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const cleanOut = cleanHermesOutput(stdout);
      const cleanErr = cleanHermesOutput(stderr);
      const newSessionId = extractHermesSessionId(stdout) || extractHermesSessionId(stderr) || sessionId;
      if (code === 0 && cleanOut) return resolve({ reply: truncateForRelay(cleanOut, config.relayReplyMaxChars), sessionId: newSessionId });
      reject(new Error(`Hermes exited ${code}: ${cleanErr || cleanOut || 'no output'}`));
    });
  });
}

async function handleTargetedEvent({ relay, key, config, event, channels, profiles }) {
  let state = loadJson(config.statePath, { seen_ids: [], channel_since: {}, responded_ids: [] });
  if (state.responded_ids?.includes(event.id)) return { skipped: true, reason: 'already-responded' };
  const channelId = eventChannelId(event);
  if (!channelId) return { skipped: true, reason: 'no-channel' };
  const channel = channels.get(channelId) || { id: channelId, name: channelId };
  const target = shouldRespondToEvent(event, key, channels, config, new Set(state.herman_message_ids || []));
  if (!target.respond) return { skipped: true, reason: target.reason };
  let inFlightSkip = null;
  state = updateState(config, { seen_ids: [], channel_since: {}, responded_ids: [], herman_message_ids: [], in_flight_ids: {} }, (latestState) => {
    inFlightSkip = markEventInFlight(latestState, event.id);
    return latestState;
  });
  if (inFlightSkip) return { skipped: true, reason: inFlightSkip };
  const author = displayAuthor(event.pubkey, profiles);
  const prompt = buildHermesPrompt({ event, channel, author, reason: target.reason, config });
  log(config, `handling event=${event.id} channel=${channel.name || channelId} author=${event.pubkey} reason=${target.reason}`);
  let reply;
  const sessionKey = conversationSessionKey(event, channelId);
  let hermesSessionId = state.conversation_sessions?.[sessionKey] || state.channel_sessions?.[channelId] || null;
  if (config.postWorkingReceipts) {
    try {
      await postMessage(channelId, `Working — routing this through ${config.profile.display_name || config.profile.name} now. I’ll reply here with a verified result or a blocker.`, { replyToEvent: event });
    } catch (error) {
      log(config, `working_receipt_error event=${event.id} error=${String(error.message || error)}`);
    }
  }
  try {
    const hermesResult = await runHermesPrompt(prompt, config, hermesSessionId);
    reply = hermesResult.reply;
    hermesSessionId = hermesResult.sessionId || hermesSessionId;
  } catch (error) {
    log(config, `hermes_error event=${event.id} error=${String(error.message || error)}`);
    reply = 'I hit a Hermes runtime error handling that Buzz message. The bridge logged it; try again or ask me from Telegram if it is urgent.';
  }
  let posted;
  try {
    posted = await postMessage(channelId, reply, { replyToEvent: event });
  } catch (error) {
    log(config, `post_error event=${event.id} error=${String(error.message || error)} fallback=root-channel-post`);
    try {
      posted = await postMessage(channelId, reply);
    } catch (fallbackError) {
      log(config, `post_fallback_error event=${event.id} error=${String(fallbackError.message || fallbackError)}`);
      updateState(config, { seen_ids: [], channel_since: {}, responded_ids: [], herman_message_ids: [] }, (failedState) => {
        markStateList(failedState, 'seen_ids', event.id);
        markStateList(failedState, 'failed_reply_ids', event.id);
        clearEventInFlight(failedState, event.id);
        return failedState;
      });
      throw fallbackError;
    }
  }
  updateState(config, { seen_ids: [], channel_since: {}, responded_ids: [], herman_message_ids: [] }, (latestState) => {
    if (hermesSessionId) {
      latestState.conversation_sessions = latestState.conversation_sessions || {};
      latestState.conversation_sessions[sessionKey] = hermesSessionId;
    }
    markStateList(latestState, 'herman_message_ids', posted.event_id, 5000);
    markStateList(latestState, 'responded_ids', event.id);
    markStateList(latestState, 'seen_ids', event.id);
    clearEventInFlight(latestState, event.id);
    return latestState;
  });
  log(config, `posted reply event=${posted.event_id} in_reply_to=${event.id}`);
  return { skipped: false, reply_event_id: posted.event_id, source_event_id: event.id, channel_id: channelId };
}

async function processTargetedOnce({ limit = 20 } = {}) {
  return await withRelay(async (relay, key, config) => {
    const channels = await listChannels(relay);
    let events = [];
    for (const channelId of Array.from(channels.keys())) {
      const got = await relay.req({ kinds: config.messageKinds, '#h': [channelId], limit }, 15000);
      events.push(...got);
    }
    events = events
      .filter((e, idx, arr) => arr.findIndex((x) => x.id === e.id) === idx)
      .sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0));
    const profiles = await fetchProfiles(relay, events.map((e) => e.pubkey));
    const results = [];
    updateState(config, { responded_ids: [], herman_message_ids: [] }, (backfillState) => {
      for (const event of events) {
        if (event.pubkey?.toLowerCase() === key.pubkey.toLowerCase()) markStateList(backfillState, 'herman_message_ids', event.id, 5000);
      }
      return backfillState;
    });
    for (const event of events) {
      const state = loadJson(config.statePath, { responded_ids: [], herman_message_ids: [] });
      if (state.responded_ids?.includes(event.id)) continue;
      const target = shouldRespondToEvent(event, key, channels, config, new Set(state.herman_message_ids || []));
      if (!target.respond) continue;
      results.push(await handleTargetedEvent({ relay, key, config, event, channels, profiles }));
    }
    return results;
  });
}

async function runGateway() {
  const config = DEFAULT_CONFIG;
  const key = loadKey(config);
  const pollIntervalMs = Number(process.env.AGENT_BUZZ_POLL_INTERVAL_MS || process.env.BUZZ_HERMAN_POLL_INTERVAL_MS || 5000);
  let channels = new Map();
  let lastDirectoryRefresh = 0;

  async function refreshDirectory(relay, force = false) {
    const now = Date.now();
    if (!force && now - lastDirectoryRefresh < 60_000 && channels.size) return;
    channels = await listChannels(relay);
    lastDirectoryRefresh = now;
    log(config, `directory channels=${channels.size}`);
  }

  async function pollOnce(relay) {
    await refreshDirectory(relay);
    let events = [];
    for (const channelId of Array.from(channels.keys())) {
      const got = await relay.req({ kinds: config.messageKinds, '#h': [channelId], limit: 20 }, 15000);
      events.push(...got);
    }
    events = events
      .filter((e, idx, arr) => arr.findIndex((x) => x.id === e.id) === idx)
      .sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0));
    if (!events.length) return;
    const profiles = await fetchProfiles(relay, events.map((e) => e.pubkey));
    updateState(config, { seen_ids: [], responded_ids: [], herman_message_ids: [] }, (state) => {
      for (const event of events) {
        if (event.pubkey?.toLowerCase() === key.pubkey.toLowerCase()) markStateList(state, 'herman_message_ids', event.id, 5000);
      }
      return state;
    });
    for (const event of events) {
      const state = loadJson(config.statePath, { seen_ids: [], responded_ids: [], herman_message_ids: [] });
      if (state.responded_ids?.includes(event.id) || state.seen_ids?.includes(event.id)) continue;
      const target = shouldRespondToEvent(event, key, channels, config, new Set(state.herman_message_ids || []));
      if (!target.respond) {
        updateState(config, { seen_ids: [], responded_ids: [], herman_message_ids: [] }, (skipState) => {
          markStateList(skipState, 'seen_ids', event.id);
          return skipState;
        });
        continue;
      }
      await handleTargetedEvent({ relay, key, config, event, channels, profiles });
    }
  }

  for (;;) {
    const relay = new BuzzRelay(config, key);
    try {
      await relay.connect();
      await refreshDirectory(relay, true);
      await publishAgentProfile();
      log(config, `gateway online poll_interval_ms=${pollIntervalMs}`);
      for (;;) {
        try {
          await pollOnce(relay);
        } catch (error) {
          log(config, `poll_error ${String(error.message || error)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    } catch (error) {
      log(config, `gateway_error ${String(error.message || error)}`);
      relay.close();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function health() {
  return await withRelay(async (relay, key) => {
    await relay.connect();
    const channels = await listChannels(relay);
    return { ok: true, pubkey: key.pubkey, npub: key.npub, channel_count: channels.size, channels: Array.from(channels.values()) };
  });
}

async function main(argv) {
  const [cmd, ...args] = argv;
  if (!cmd || cmd === '--help' || cmd === 'help') {
    console.log('Usage: node bridge.mjs <health|profile|agent-profile|channels|baseline|poll|post|create-channel|handshake|respond-once|gateway>');
    return 0;
  }
  if (cmd === 'health') { console.log(JSON.stringify(await health(), null, 2)); return 0; }
  if (cmd === 'profile') { console.log(JSON.stringify(await publishProfile(), null, 2)); return 0; }
  if (cmd === 'agent-profile') { console.log(JSON.stringify(await publishAgentProfile(), null, 2)); return 0; }
  if (cmd === 'channels') { console.log(JSON.stringify((await health()).channels, null, 2)); return 0; }
  if (cmd === 'baseline') { const out = await poll({ baseline: true }); if (out) process.stdout.write(out); return 0; }
  if (cmd === 'poll') { const out = await poll({ baseline: false }); if (out) process.stdout.write(out); return 0; }
  if (cmd === 'respond-once') { console.log(JSON.stringify(await processTargetedOnce(), null, 2)); return 0; }
  if (cmd === 'gateway') { await runGateway(); return 0; }
  if (cmd === 'create-channel') {
    const nameIdx = args.indexOf('--name');
    const aboutIdx = args.indexOf('--about');
    console.log(JSON.stringify(await createChannel(nameIdx === -1 ? 'herman' : args[nameIdx + 1], aboutIdx === -1 ? undefined : args[aboutIdx + 1]), null, 2));
    return 0;
  }
  if (cmd === 'handshake') { console.log(JSON.stringify(await postHandshake(), null, 2)); return 0; }
  if (cmd === 'post') {
    const channelIdx = args.indexOf('--channel');
    if (channelIdx === -1 || !args[channelIdx + 1]) throw new Error('post requires --channel <uuid>');
    const replyIdx = args.indexOf('--reply-to');
    const channel = args[channelIdx + 1];
    const replyTo = replyIdx === -1 ? null : args[replyIdx + 1];
    const message = fs.readFileSync(0, 'utf8').trimEnd();
    if (!message) throw new Error('post message must be provided on stdin');
    console.log(JSON.stringify(await postMessage(channel, message, { replyTo }), null, 2));
    return 0;
  }
  throw new Error(`unknown command: ${cmd}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => process.exit(code)).catch((err) => {
    console.error(err.stack || err.message || String(err));
    process.exit(1);
  });
}
