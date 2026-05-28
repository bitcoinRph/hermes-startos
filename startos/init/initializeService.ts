import { sdk } from '../sdk'
import type { T } from '@start9labs/start-sdk'
import { setOpenAiOAuth } from '../actions/setOpenAiOAuth'

export const initializeService = sdk.setupOnInit(
  async (effects: T.Effects, kind: 'install' | 'update' | 'restore' | null) => {
    // Hermes bootstraps its own config files via the container entrypoint.
    if (kind !== 'install') return

    // Prompt the user to set their OpenAI OAuth credentials immediately after install.
    await sdk.action.createOwnTask(effects, setOpenAiOAuth, 'critical', {
      reason: 'Set your OpenAI Codex OAuth tokens so Hermes can make model calls.',
    })
  },
)
