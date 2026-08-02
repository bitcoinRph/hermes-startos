import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_19_0_4 = VersionInfo.of({
  version: "0.19.0:4",
  releaseNotes: {
    en_US:
      "Fixes the StartOS startup wrapper syntax regression in the native Buzz gateway canary. The wrapper now parses Buzz .env values without unsafe shell quoting, corrects the Python env regex, and preserves relay hostname pinning, private CA export, active-profile Buzz env export, and native buzz-platform bootstrap behavior.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
