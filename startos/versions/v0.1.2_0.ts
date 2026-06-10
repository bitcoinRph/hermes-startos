import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_1_2_0 = VersionInfo.of({
  version: "0.1.2:0",
  releaseNotes: {
    en_US:
      "Apply upstream OAuth credential-pool fixes for Codex re-auth: sync credential_pool on re-auth (#33164), extend to manual:device_code entries (#33198), and isolate pool on provider fallback (#33217). Prevents 401 token_invalidated loops and cross-provider contamination.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
