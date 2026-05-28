import { z, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Mirrors the auth store shape that hermes_cli/auth.py reads via _load_provider_state().
const shape = z.object({
  version: z.number().optional(),
  providers: z
    .object({
      'openai-codex': z
        .object({
          tokens: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
          }),
          last_refresh: z.string().optional(),
          auth_mode: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  active_provider: z.string().optional(),
})

export const authJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'auth.json' },
  shape,
)
