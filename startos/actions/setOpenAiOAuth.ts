import { ISB } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { authJson } from '../fileModels/authJson'

const { InputSpec, Value } = ISB

// Input spec: access_token + refresh_token.
// The user obtains these by running `hermes auth add openai-codex` on any
// machine and copying the token fields from ~/.hermes/auth.json →
// providers["openai-codex"].tokens.
const inputSpec = InputSpec.of({
  accessToken: Value.text({
    name: 'Access Token',
    description:
      'OpenAI Codex OAuth access token. Run `hermes auth add openai-codex` on any machine and copy access_token from ~/.hermes/auth.json → providers["openai-codex"].tokens.',
    required: true,
    masked: true,
    placeholder: 'eyJhbGci...',
    default: null,
    patterns: [],
    inputmode: 'text',
    minLength: null,
    maxLength: null,
  }),
  refreshToken: Value.text({
    name: 'Refresh Token',
    description:
      'OpenAI Codex OAuth refresh token. Found alongside access_token in the same auth.json location.',
    required: true,
    masked: true,
    placeholder: 'v1:...',
    default: null,
    patterns: [],
    inputmode: 'text',
    minLength: null,
    maxLength: null,
  }),
})

export const setOpenAiOAuth = sdk.Action.withInput(
  'set-openai-oauth',

  async ({ effects }) => ({
    name: 'Set OpenAI OAuth Credentials',
    description:
      'Store OpenAI Codex OAuth tokens so Hermes can use ChatGPT Pro as a provider. Run this after installing, and again whenever tokens expire.',
    warning:
      'Tokens are stored in the Hermes data volume and rotated automatically on each API call. Re-run only if Hermes reports that Codex credentials are missing or invalid.',
    allowedStatuses: 'any' as const,
    group: null,
    visibility: 'enabled' as const,
  }),

  inputSpec,

  // Pre-fill with existing tokens if already stored
  async ({ effects }) => {
    const existing = await authJson
      .read((a) => a?.providers?.['openai-codex']?.tokens)
      .once()
    return {
      accessToken: existing?.access_token ?? '',
      refreshToken: existing?.refresh_token ?? '',
    }
  },

  async ({ effects, input }) => {
    const now = new Date().toISOString().replace('+00:00', 'Z')

    await authJson.write(effects, {
      version: 1,
      providers: {
        'openai-codex': {
          tokens: {
            access_token: input.accessToken,
            refresh_token: input.refreshToken,
          },
          last_refresh: now,
          auth_mode: 'chatgpt',
        },
      },
      active_provider: 'openai-codex',
    })

    return {
      version: '1' as const,
      title: 'OpenAI OAuth Credentials Saved',
      message:
        'Tokens written to auth.json. Restart Hermes for the change to take effect if it is currently running.',
      result: {
        type: 'single' as const,
        name: 'Status',
        description: null,
        value: 'Credentials stored successfully.',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)
