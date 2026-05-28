import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_1_7_0 = VersionInfo.of({
  version: '0.1.7:0',
  releaseNotes: {
    en_US:
      'Add "Set OpenAI OAuth Credentials" action. The previous patch fixed HTTP 400 dead model slugs but left no mechanism to inject OAuth tokens into the container. This version adds a Start9 action that writes the correct auth.json structure directly to the persistent volume so Hermes can authenticate against the ChatGPT Codex backend.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
