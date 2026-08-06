import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_8 = VersionInfo.of({
  version: "0.20.0:8",
  releaseNotes: {
    en_US:
      "Adds the agent buzz bridge package asset and boot hook. The bridge runs separate Herman and Goku Buzz watchers with mention-gated replies, separate state/log files, and loop control for agent-to-agent coordination.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
