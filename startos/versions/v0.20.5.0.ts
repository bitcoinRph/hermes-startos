import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_5_0 = VersionInfo.of({
  version: "0.20.5:0",
  releaseNotes: {
    en_US:
      "Tracks upstream Hermes Agent v0.20.5 (tag v2026.8.19), a patch release rolling up the v0.20.4 stability window for downstream Docker/package consumers. Wrapper runtime preserves the existing StartOS model and ports the upstream API_SERVER_KEY bootstrap into the inline boot script so the loopback gateway api_server used by cron/API paths is initialized even when .env did not previously exist.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
