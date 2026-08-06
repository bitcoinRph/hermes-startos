import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_9 = VersionInfo.of({
  version: "0.20.0:9",
  releaseNotes: {
    en_US:
      "Upgrades agent buzz bridge channel discovery. Goku and Herman now watch every Buzz channel where their own pubkey appears in the channel membership snapshot, refresh that directory while running, keep per-channel/thread Hermes sessions, and continue mention-gated coordination across multiple Buzz threads.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
