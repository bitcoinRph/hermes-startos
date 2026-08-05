import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_5 = VersionInfo.of({
  version: "0.20.0:5",
  releaseNotes: {
    en_US:
      "Heals stale BUZZ_CLI_PATH entries in persisted profile .env files so the Buzz adapter uses the packaged /opt/package-assets/buzz CLI asset.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
