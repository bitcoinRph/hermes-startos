import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_1_9_0 = VersionInfo.of({
  version: '0.1.9:0',
  releaseNotes: {
    en_US:
      'Upgrade Hermes Agent upstream to NousResearch/hermes-agent v0.15.0 (v2026.5.28). This release keeps the OpenAI Codex OAuth model-slug fix and replaces the fragile Codex Responses stream path with raw event iteration, avoiding the prior output:null / NoneType stream crash. The StartOS wrapper bypasses the new s6-overlay /init entrypoint, runs the upstream boot hook directly, and then starts hermes gateway run as the hermes user so the dashboard remains usable on port 9119.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
