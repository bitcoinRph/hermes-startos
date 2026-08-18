import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_1_0 = VersionInfo.of({
  version: "0.20.1:0",
  releaseNotes: {
    en_US:
      "Track upstream Hermes Agent v0.20.1 (tag v2026.8.13), a broad stabilization-and-fixes rollup since v0.20.0. The StartOS wrapper keeps the existing runtime model; stale lifecycle-guard patching is removed because the fix is now bundled upstream.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
