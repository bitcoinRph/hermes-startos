import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_19_0_1 = VersionInfo.of({
  version: "0.19.0:1",
  releaseNotes: {
    en_US:
      'Staging build: track upstream Hermes Agent main after v2026.7.20 at commit 738725d18 to verify the native Buzz platform plugin before replacing the custom StartOS Buzz bridge. Includes the post-release Buzz adapter, NIP-42 WebSocket auth, WebSocket inbound transport with poll fallback, DM discovery fixes, scoped identity locking, and relay/threading support. This is a dated canary wrapper build; do not retire the existing bridge until live Buzz relay parity is verified.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
