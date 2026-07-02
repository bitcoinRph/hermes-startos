import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_18_0_0 = VersionInfo.of({
  version: "0.18.0:0",
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent v0.18.0 (tag v2026.7.1), "The Judgment Release". Highlights: all P0/P1 upstream issues closed; Mixture-of-Agents selectable as first-class models; verification evidence and /goal completion contracts; /learn and /journey self-improvement surfaces; background subagent fan-out; desktop Projects; gateway scale-to-zero and drain coordination; Vertex AI Gemini provider; and broad security hardening. The StartOS boot script also incorporates the upstream data-volume ownership hardening needed when state is touched from root attach shells.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
