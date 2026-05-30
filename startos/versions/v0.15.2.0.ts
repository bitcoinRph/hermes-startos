import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_15_2_0 = VersionInfo.of({
  version: '0.15.2:0',
  releaseNotes: {
    en_US:
      'Track upstream Hermes Agent v0.15.2 (tag v2026.5.29.2). Highlights: 76% reduction in core agent code ("The Velocity Release" v0.15.0); built-in learning loop with skill creation; 300+ LLM model support; 23 messaging platforms; MCP server support; FTS5 session search; multi-agent Kanban orchestration; dashboard fixes and auth hardening.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
