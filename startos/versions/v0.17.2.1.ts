import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_17_2_1 = VersionInfo.of({
  version: "0.17.2:1",
  releaseNotes: {
    en_US:
      "Rebuild the 0.17.2 gateway singleton restart fix with a new StartOS package build number so sideload/update paths cannot reuse a cached 0.17.2:0 artifact. This build keeps the boot-script fix that stops stale dashboards and starts the gateway with --replace --no-supervise.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
