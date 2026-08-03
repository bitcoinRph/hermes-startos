import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_19_1_1 = VersionInfo.of({
  version: "0.19.1:1",
  releaseNotes: {
    en_US:
      "Restore compatibility with StartOS 0.4.0 (the LXC container-runtime rewrite). The wrapper previously wrote its boot script into the subcontainer rootfs at startup; under the 0.4.0 runtime that write no longer reaches the mounted container tree, so the daemon executed a stale pre-migration script and crash-looped with a shell syntax error. The boot script is now passed inline to the daemon (sh -c), eliminating the on-disk script entirely so no stale copy can ever be executed. No Hermes application changes; upstream remains v0.19.1 (tag v2026.7.30).",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
