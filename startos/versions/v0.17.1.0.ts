import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_17_1_0 = VersionInfo.of({
  version: "0.17.1:0",
  releaseNotes: {
    en_US:
      "Track upstream Hermes Agent post-0.17.0 (main@d6269da). Highlights: /learn command teaches full CONTRIBUTING.md skill standards; lazy-packages support for optional backend SDKs (Firecrawl, Exa, etc.) via writable volume dir; Z.AI endpoint picker; scale-to-zero dormancy guards; Nous OAuth base-URL override; improved config migration rollback; rich Telegram command menus; coding verification evidence ledger; continuable cron delivery.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
