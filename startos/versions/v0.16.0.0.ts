import { IMPOSSIBLE, VersionInfo } from "@start9labs/start-sdk";

export const v_0_16_0_0 = VersionInfo.of({
  version: "0.16.0:0",
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent v0.16.0 (tag v2026.6.5), "The Surface Release". Highlights: native desktop app; browser admin panel; remote-gateway connect; Simplified Chinese desktop UI; leaner default skill set; NVIDIA/skills trusted tap; fuzzy model picker; /undo command; hindsight memory provider baked into the image; PUID/PGID support; persisted config schema migrations on upgrade.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
});
