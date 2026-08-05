import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_7 = VersionInfo.of({
  version: "0.20.0:7",
  releaseNotes: {
    en_US:
      "Adds start-cli as a packaged Hermes tool with manual authentication only. The package seeds a non-secret StartOS CLI config pointing at the local StartOS bridge address and places package assets on PATH, but embeds no credentials; run start-cli auth login from inside Hermes before using privileged StartOS commands.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
