import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_1_4_0 = VersionInfo.of({
  version: "0.1.4:0",
  releaseNotes: {
    en_US:
      "Fix startup crash: bypass s6-overlay /init (requires PID 1) by calling stage2-hook.sh + gosu directly. Restores compatibility with StartOS sub-container process model after upstream switched from tini to s6-overlay in 136cb05c.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
