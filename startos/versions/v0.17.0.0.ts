import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_17_0_0 = VersionInfo.of({
  version: "0.17.0:0",
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent v0.17.0 (tag v2026.6.19), "The Reach Release." Highlights: Photon iMessage, Raft gateway bridge, background subagents, image editing, secure dashboard login, full profile builder, Skills Hub rework, atomic memory operations, curator cost reduction, and an immutable /opt/hermes install tree with mutable state kept on the data volume.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
