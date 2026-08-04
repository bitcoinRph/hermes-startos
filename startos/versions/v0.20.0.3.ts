import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_3 = VersionInfo.of({
  version: "0.20.0:3",
  releaseNotes: {
    en_US:
      "Adds the Buzz CLI binary to the StartOS runtime image so the native Buzz gateway can execute outbound Buzz commands after the 0.20.0 inline startup wrapper fix.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
