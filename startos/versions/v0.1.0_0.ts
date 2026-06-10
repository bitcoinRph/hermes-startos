import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_1_0_0 = VersionInfo.of({
  version: "0.1.0:1",
  releaseNotes: {
    en_US:
      "Initial Hermes Agent StartOS packaging scaffold with gateway run daemon command.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
