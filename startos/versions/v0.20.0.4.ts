import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_4 = VersionInfo.of({
  version: "0.20.0:4",
  releaseNotes: {
    en_US:
      "Forward revision of the newly published 0.20.0:1 release so servers already recovered to 0.20.0:3 can update without downgrading. Includes end-to-end Buzz platform packaging, stale Buzz cli_path healing, private-CA/LAN relay support, daemon environment pins, and the OpenAI OAuth auth.json merge fix.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
