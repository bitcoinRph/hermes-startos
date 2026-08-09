import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_11 = VersionInfo.of({
  version: "0.20.0:11",
  releaseNotes: {
    en_US:
      "Fixes the Login to StartOS and Revoke StartOS Access actions by repairing the start-cli helper shell script and replacing stale start-cli binaries when the stored version is not 1.1.0.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
