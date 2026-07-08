import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_18_2_0 = VersionInfo.of({
  version: "0.18.2:0",
  releaseNotes: {
    en_US:
      "Track upstream Hermes Agent v0.18.2 (tag v2026.7.7.2), a same-day patch on top of v0.18.1. This release uses the published @whiskeysockets/baileys 7.0.0-rc13 package for the WhatsApp bridge instead of a pinned git commit, restoring reliable tagged-release Docker builds. The StartOS boot script also mirrors upstream pairing-approval ownership repair and terminal Nous auth rebootstrap handling while preserving the existing StartOS s6-entrypoint bypass.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
