import { sdk } from "./sdk";

export const uiPort = 9119;
export const dataDir = "/opt/data";
export const START_CLI_VERSION = "1.1.0";

export function startCliMounts() {
  return sdk.Mounts.of().mountVolume({
    volumeId: "main",
    subpath: null,
    mountpoint: dataDir,
    readonly: false,
  });
}
