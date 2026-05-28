import { sdk } from "./sdk";
import type { T } from "@start9labs/start-sdk";
import { uiPort } from "./utils";

export const main = sdk.setupMain(
  async ({ effects }: { effects: T.Effects }) => {
    const hermesSub = await sdk.SubContainer.of(
      effects,
      { imageId: "main" },
      sdk.Mounts.of().mountVolume({
        volumeId: "main",
        subpath: null,
        mountpoint: "/opt/data",
        readonly: false,
      }),
      "hermes-agent",
    );

    return sdk.Daemons.of(effects).addDaemon("main", {
      subcontainer: hermesSub,
      exec: {
        command: sdk.useEntrypoint(["gateway", "run"]),
        env: {
          HERMES_HOME: "/opt/data",
          HERMES_DASHBOARD: "1",
          HERMES_DASHBOARD_HOST: "0.0.0.0",
          HERMES_DASHBOARD_PORT: String(uiPort),
        },
      },
      ready: {
        display: "Hermes Dashboard",
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: "Hermes dashboard is ready",
            errorMessage: "Hermes dashboard is not ready",
          }),
      },
      requires: [],
    });
  },
);
