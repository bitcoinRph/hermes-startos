import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_1_3_0 = VersionInfo.of({
  version: "0.1.3:0",
  releaseNotes: {
    en_US:
      "Fix Codex OAuth HTTP 400 on ChatGPT Pro: remove dead model slugs (gpt-5.2-codex, gpt-5.1-codex-max, gpt-5.1-codex-mini) that the Codex backend rejects on every Pro account. Backport of NousResearch/hermes-agent PR #33424.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
