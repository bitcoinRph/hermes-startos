import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_19_1_2 = VersionInfo.of({
  version: "0.19.1:2",
  releaseNotes: {
    en_US:
      "Rebuild against start-sdk 2.0.9, the native StartOS 0.4.0 SDK. Earlier builds carried sdkVersion 1.5.2 in the package manifest, which StartOS 0.4.0 rejects at sideload. No Hermes application changes (upstream remains v0.19.1 / tag v2026.7.30) and no data-layout changes: all state on the main data volume (/opt/data — config, .env, auth, sessions, memories, skills, workspace) is preserved when installing this as an update over an existing install. Take a backup first as usual, and update in place rather than uninstalling (uninstall deletes service data).",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
