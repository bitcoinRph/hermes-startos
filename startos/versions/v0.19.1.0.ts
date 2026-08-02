import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_19_1_0 = VersionInfo.of({
  version: "0.19.1:0",
  releaseNotes: {
    en_US:
      "Track upstream Hermes Agent v0.19.1 (tag v2026.7.30), a patch release rolling up the post-v0.19.0 gateway, voice, desktop, installer, Buzz/Nostr, Telegram media, and FLUX3 stabilization work. StartOS keeps the existing dashboard-auth bootstrap, s6-entrypoint bypass, immutable /opt/hermes install tree, and foreground gateway handoff while adding the upstream warm-volume logs/gateways ownership repair needed after root attach or restart operations.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
