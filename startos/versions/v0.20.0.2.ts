import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_2 = VersionInfo.of({
  version: "0.20.0:2",
  releaseNotes: {
    en_US:
      "Ports the native Buzz gateway bootstrap onto the known-good 0.20.0 inline StartOS startup wrapper, preserving the /bin/sh -c launch path that avoids stale overlay scripts. Adds Buzz relay hostname pinning, CA bundle export, active-profile environment export, and conditional buzz-platform config bootstrap.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
