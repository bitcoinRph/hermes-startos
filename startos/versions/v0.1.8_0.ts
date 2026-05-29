import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_1_8_0 = VersionInfo.of({
  version: '0.1.8:0',
  releaseNotes: {
    en_US:
      'Track the latest Hermes Agent release from Nous Research while preserving the Codex OAuth model list and streaming guardrails that prevent the ChatGPT Codex backend from breaking on null terminal output.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
