import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_12 = VersionInfo.of({
  version: "0.20.0:12",
  releaseNotes: {
    en_US:
      "Fixes a Hermes terminal-tool lifecycle guard crash where malformed or binary-derived script path tokens containing NUL bytes could raise ValueError instead of being treated as unreadable.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
