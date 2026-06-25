import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_17_2_0 = VersionInfo.of({
  version: "0.17.2:0",
  releaseNotes: {
    en_US:
      "Fix a startup crash loop introduced in 0.17.1. The post-0.17.0 gateway is a strict singleton that refused to start when an orphaned gateway worker from a prior in-place restart still held /opt/data/gateway.pid, wedging the service into a permanent restart loop. The boot script now reaps any stale dashboard and starts the gateway with --replace so it cleanly takes over from a prior instance.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
