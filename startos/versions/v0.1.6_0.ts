import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_1_6_0 = VersionInfo.of({
  version: "0.1.6:0",
  releaseNotes: {
    en_US:
      "Fix startup: pin upstream-project submodule to 519657aa9 (tini-based image, not s6-overlay). s6-overlay /init requires PID 1 which StartOS sub-containers don't grant; tini works correctly in sub-container PID namespaces. Reverts main.ts to sdk.useEntrypoint().",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
