import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_2_0 = VersionInfo.of({
  version: "0.20.2:0",
  releaseNotes: {
    en_US:
      "Tracks upstream Hermes Agent v0.20.2 (tag v2026.8.16), a patch release rolling up the v2026.8.13..v2026.8.16 stability window. Wrapper runtime remains unchanged; the previous terminal lifecycle NUL guard patch is now included upstream, so CI only verifies the bundled fix instead of applying a local patch.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
