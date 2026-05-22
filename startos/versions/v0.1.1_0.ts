import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_1_1_0 = VersionInfo.of({
  version: "0.1.1:1",
  releaseNotes: {
    en_US:
      "Refresh the StartOS wrapper scaffold to track Hermes upstream release v2026.5.16 and keep the packaging guide references current.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
