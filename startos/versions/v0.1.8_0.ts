import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_1_8_0 = VersionInfo.of({
  version: '0.1.8:0',
  releaseNotes: {
    en_US:
      'Fix TypeError crash on every Codex model call. The ChatGPT Codex backend returns output:null in its terminal SSE event; the openai SDK propagates this as TypeError inside stream.__iter__ before the response can be inspected. This adds a TypeError handler in run_codex_stream that recovers from collected stream items or text deltas, matching the existing empty-output backfill logic.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
