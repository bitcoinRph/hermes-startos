import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_1_9_0 = VersionInfo.of({
  version: '0.1.9:0',
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent main (~190 commits past v2026.5.29.2). Highlights: Codex TTFB watchdog relaxed from 12 s to 120 s for more reliable OAuth streaming; credential-pool marks terminal OAuth failures STATUS_DEAD; MCP no longer reports false OAuth success; FTS5 session index with graceful degradation; dashboard chat tab works in gated OAuth mode; and many gateway, compression, and auth hardening fixes.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
