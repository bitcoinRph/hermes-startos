import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_1 = VersionInfo.of({
  version: "0.20.0:1",
  releaseNotes: {
    en_US:
      "Enable the Buzz messaging platform end to end: the buzz CLI (built from block/buzz) now ships as a packaged asset and the adapter is pointed at it via BUZZ_CLI_PATH, stale canary cli_path entries in existing configs are healed automatically, LAN relay hostname pinning (BUZZ_RELAY_HOSTS_ENTRY / BUZZ_RELAY_HOST_IP) and private-CA trust exports are restored, and Buzz auto-enables when relay credentials are present in .env. Also fixes the Set OpenAI OAuth action to merge into auth.json instead of overwriting it (previously it destroyed other provider credentials, including the Nous session), pins PYTHONUNBUFFERED and the image PATH in the daemon environment, and binds the dashboard interface to the shared port constant. Upstream remains v0.20.0 (tag v2026.8.3).",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
