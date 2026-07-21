import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_19_0_0 = VersionInfo.of({
  version: "0.19.0:0",
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent v0.19.0 (tag v2026.7.20), "The Quicksilver Release". Highlights: faster first-token latency, live reasoning streams, durable gateway delivery ledger, durable background delegation, profile-based gateway routing, smart approvals, password-manager secret sources, new providers/models, and expanded session export. The StartOS boot script keeps the s6-entrypoint bypass, mirrors the updated Nous auth rebootstrap semantics, repairs the reseed symlink guard, and seeds dashboard password auth for the required non-loopback dashboard bind.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
