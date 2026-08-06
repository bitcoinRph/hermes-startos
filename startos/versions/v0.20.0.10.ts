import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_10 = VersionInfo.of({
  version: "0.20.0:10",
  releaseNotes: {
    en_US:
      "Fixes agent buzz bridge multi-thread response handling. The bridge now watches all visible private Buzz channels as a fallback for repaired memberships, uses per-channel cursors with a larger poll window, allows the owner pubkey, and prevents missed mentions from being skipped after state updates.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
