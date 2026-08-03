import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_0 = VersionInfo.of({
  version: "0.20.0:0",
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent v0.20.0 (tag v2026.8.3), "The Herald Release" (~3,650 commits since v0.19.0). Highlights: conversational voice with real-time streaming, on-device wake words, and barge-in interruption; research verification with grounded citations; Agent-to-Agent (A2A v1.0) protocol; desktop artifacts with live preview and plugin SDK; CLI !command and /diff; self-correcting tool error recovery. Wrapper unchanged: built on start-sdk 2.0.9 for StartOS 0.4.0, inline boot script, all state preserved on the data volume.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
