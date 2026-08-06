#!/bin/sh
set -eu

BASE_DIR="${AGENT_BUZZ_BASE_DIR:-/opt/data/agent-buzz-bridge}"
STATE_DIR="${AGENT_BUZZ_STATE_DIR:-/opt/data/state/agent-buzz-bridge}"
NODE_BIN="${NODE_BIN:-/usr/local/bin/node}"
BRIDGE_JS="$BASE_DIR/bridge.mjs"
ALLOWED_PUBKEYS="${AGENT_BUZZ_ALLOWED_PUBKEYS:-fba5b0b9a2b444c8b22a49b422275672ed9ee61e77b5f5faa6ad967d6042d48b,8d12f0b838b0304392b80943819a78d29744a0f9852045cb56cf92211b6bac46,d1c4e7709a89df583c5c0536759efba6c6d97b4f86781df650002d3de6f91af0,9917b37e885ab4efe7a96c50c8c686410784875902b6654808683e8408efe2a3,a60251c26264743a52888fcdf99cc625a9044baaa1ea275af61158365495506d}"
ACTUAL_URL="${AGENT_BUZZ_ACTUAL_URL:-wss://192.168.0.104:55104}"
HOST_HEADER="${AGENT_BUZZ_HOST_HEADER:-rusty-fingers.local:55104}"
AUTH_RELAY_URL="${AGENT_BUZZ_AUTH_RELAY_URL:-wss://rusty-fingers.local:55104}"

run_as_hermes() {
  if [ "$(id -u)" = "0" ] && [ -x /command/s6-setuidgid ]; then
    /command/s6-setuidgid hermes "$@"
  else
    "$@"
  fi
}

ensure_goku_key() {
  run_as_hermes "$NODE_BIN" --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';

const envPath = '/opt/data/profiles/goku/.env';
const keyPath = '/opt/data/secrets/buzz-goku-agent-keypair.json';
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) continue;
  env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
if (!env.BUZZ_PRIVATE_KEY || !env.BUZZ_PUBKEY) {
  throw new Error('Goku Buzz identity is missing from /opt/data/profiles/goku/.env');
}
fs.mkdirSync(path.dirname(keyPath), { recursive: true, mode: 0o700 });
fs.writeFileSync(
  keyPath,
  `${JSON.stringify({ private_key_hex: env.BUZZ_PRIVATE_KEY, pubkey: env.BUZZ_PUBKEY }, null, 2)}\n`,
  { mode: 0o600 },
);
NODE
}

agent_pid_file() {
  printf '%s/%s.pid' "$STATE_DIR" "$1"
}

agent_log_file() {
  printf '%s/%s/supervisor.log' "$STATE_DIR" "$1"
}

is_running() {
  pid_file="$(agent_pid_file "$1")"
  [ -f "$pid_file" ] || return 1
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

start_agent() {
  slug="$1"
  profile="$2"
  display="$3"
  aliases="$4"
  key_path="$5"
  about="$6"
  peer_pubkeys="${7:-}"
  if is_running "$slug"; then
    echo "$slug already running"
    return 0
  fi
  mkdir -p "$STATE_DIR/$slug"
  chown -R hermes:hermes "$STATE_DIR/$slug" 2>/dev/null || true
  log_file="$(agent_log_file "$slug")"
  pid_file="$(agent_pid_file "$slug")"
  if [ "$(id -u)" = "0" ] && [ -x /command/s6-setuidgid ]; then
    run_prefix="/command/s6-setuidgid hermes"
  else
    run_prefix=""
  fi
  $run_prefix env \
    HOME="/opt/data/profiles/$profile" \
    HERMES_HOME="/opt/data/profiles/$profile" \
    PATH="/opt/data/.local/bin:/opt/package-assets:/usr/local/bin:/usr/bin:/bin" \
    AGENT_BUZZ_BRIDGE_NAME="agent buzz bridge" \
    AGENT_BUZZ_NAME="$profile" \
    AGENT_BUZZ_DISPLAY_NAME="$display" \
    AGENT_BUZZ_MENTION_ALIASES="$aliases" \
    AGENT_BUZZ_ABOUT="$about" \
    AGENT_BUZZ_KEY_PATH="$key_path" \
    AGENT_BUZZ_STATE_PATH="$STATE_DIR/$slug/state.json" \
    AGENT_BUZZ_LOG_PATH="$STATE_DIR/$slug/gateway.log" \
    AGENT_BUZZ_HERMES_PROFILE="$profile" \
    AGENT_BUZZ_ALLOWED_PUBKEYS="$ALLOWED_PUBKEYS" \
    AGENT_BUZZ_PEER_PUBKEYS="$peer_pubkeys" \
    AGENT_BUZZ_ACTUAL_URL="$ACTUAL_URL" \
    AGENT_BUZZ_HOST_HEADER="$HOST_HEADER" \
    AGENT_BUZZ_AUTH_RELAY_URL="$AUTH_RELAY_URL" \
    AGENT_BUZZ_WORKING_RECEIPTS="${AGENT_BUZZ_WORKING_RECEIPTS:-0}" \
    AGENT_BUZZ_POLL_INTERVAL_MS="${AGENT_BUZZ_POLL_INTERVAL_MS:-5000}" \
    "$NODE_BIN" "$BRIDGE_JS" baseline >/dev/null 2>>"$log_file" || true
  $run_prefix env \
    HOME="/opt/data/profiles/$profile" \
    HERMES_HOME="/opt/data/profiles/$profile" \
    PATH="/opt/data/.local/bin:/opt/package-assets:/usr/local/bin:/usr/bin:/bin" \
    AGENT_BUZZ_BRIDGE_NAME="agent buzz bridge" \
    AGENT_BUZZ_NAME="$profile" \
    AGENT_BUZZ_DISPLAY_NAME="$display" \
    AGENT_BUZZ_MENTION_ALIASES="$aliases" \
    AGENT_BUZZ_ABOUT="$about" \
    AGENT_BUZZ_KEY_PATH="$key_path" \
    AGENT_BUZZ_STATE_PATH="$STATE_DIR/$slug/state.json" \
    AGENT_BUZZ_LOG_PATH="$STATE_DIR/$slug/gateway.log" \
    AGENT_BUZZ_HERMES_PROFILE="$profile" \
    AGENT_BUZZ_ALLOWED_PUBKEYS="$ALLOWED_PUBKEYS" \
    AGENT_BUZZ_PEER_PUBKEYS="$peer_pubkeys" \
    AGENT_BUZZ_ACTUAL_URL="$ACTUAL_URL" \
    AGENT_BUZZ_HOST_HEADER="$HOST_HEADER" \
    AGENT_BUZZ_AUTH_RELAY_URL="$AUTH_RELAY_URL" \
    AGENT_BUZZ_WORKING_RECEIPTS="${AGENT_BUZZ_WORKING_RECEIPTS:-0}" \
    AGENT_BUZZ_POLL_INTERVAL_MS="${AGENT_BUZZ_POLL_INTERVAL_MS:-5000}" \
    "$NODE_BIN" "$BRIDGE_JS" gateway </dev/null >>"$log_file" 2>&1 &
  echo "$!" > "$pid_file"
  chown hermes:hermes "$pid_file" "$log_file" 2>/dev/null || true
  echo "$slug started pid $(cat "$pid_file")"
}

stop_agent() {
  slug="$1"
  pid_file="$(agent_pid_file "$slug")"
  if ! is_running "$slug"; then
    rm -f "$pid_file"
    echo "$slug stopped"
    return 0
  fi
  pid="$(cat "$pid_file")"
  kill "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done
  kill -9 "$pid" 2>/dev/null || true
  rm -f "$pid_file"
  echo "$slug stopped"
}

start_all() {
  ensure_goku_key
  start_agent herman herman Herman "herman" \
    /opt/data/secrets/buzz-herman-agent-keypair.json \
    "Herman, the Hermes agent in the Freehold Agents Buzz thread." \
    "a60251c26264743a52888fcdf99cc625a9044baaa1ea275af61158365495506d"
  start_agent goku goku Goku "goku,openclaw,open claw" \
    /opt/data/secrets/buzz-goku-agent-keypair.json \
    "Goku, the OpenClaw agent in the Freehold Agents Buzz thread." \
    "9917b37e885ab4efe7a96c50c8c686410784875902b6654808683e8408efe2a3"
}

stop_all() {
  stop_agent herman
  stop_agent goku
}

status_all() {
  for slug in herman goku; do
    if is_running "$slug"; then
      echo "$slug running pid $(cat "$(agent_pid_file "$slug")")"
    else
      echo "$slug stopped"
    fi
  done
}

case "${1:-start}" in
  start) start_all ;;
  stop) stop_all ;;
  restart) stop_all; start_all ;;
  status) status_all ;;
  *) echo "Usage: $0 {start|stop|restart|status}" >&2; exit 2 ;;
esac
