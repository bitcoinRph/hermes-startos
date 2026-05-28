import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_1_5_0 = VersionInfo.of({
  version: "0.1.5:0",
  releaseNotes: {
    en_US:
      "Fix startup crash: use entrypoint.sh directly instead of stage2-hook.sh. stage2-hook.sh is an s6-overlay internal script and calls s6-setuidgid which is not on the container PATH in StartOS sub-containers. entrypoint.sh handles UID remap, gosu drop, config seed, and dashboard start without any s6 dependency.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
