import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_0_10 = VersionInfo.of({
  version: "0.20.0:10",
  releaseNotes: {
    en_US:
      "Adds optional StartOS administration access through start-cli. The new Login to StartOS action asks for the server master password, installs the official start-cli binary into the Hermes data volume when missing, enrolls a start-cli identity on the Hermes data volume, and warns that the resulting access is root-equivalent. The new Revoke StartOS Access action best-effort logs out and removes the stored start-cli identity files. No StartOS master password or static credential is baked into the image.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
