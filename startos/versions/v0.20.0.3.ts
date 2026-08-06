import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_3 = VersionInfo.of({
  version: "0.20.0:3",
  releaseNotes: {
    en_US:
      "Intermediate local recovery build that fixed the 0.20.0 Buzz startup wrapper crash and bundled the buzz CLI binary for StartOS.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
