import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_6 = VersionInfo.of({
  version: "0.20.0:6",
  releaseNotes: {
    en_US:
      "Fixes the StartOS Buzz .env healing bootstrap so stale BUZZ_CLI_PATH entries are actually repointed to the packaged CLI asset.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
