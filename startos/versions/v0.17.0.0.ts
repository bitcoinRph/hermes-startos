import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_17_0_0 = VersionInfo.of({
  version: "0.17.0:0",
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent v0.17.0 (tag v2026.6.19), "The Reach Release". Highlights: iMessage via Photon; Raft channel; async subagents; image editing; Cursor Composer via xAI Grok; dashboard profile builder; memory tool upgrade; WhatsApp Business Cloud; rich Telegram; curator cost optimization. The install tree is now immutable (read-only /opt/hermes) with all mutable state under the data volume.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
