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
        command: [
          "/bin/sh",
          "-c",
          "/opt/hermes/docker/stage2-hook.sh && " +
            "cd /opt/data && " +
            "hermes dashboard --host 0.0.0.0 --port " +
            uiPort +
            " --no-open --insecure & " +
            "exec hermes gateway run",
        ],
        env: {
          HERMES_HOME: "/opt/data",
          PYTHONPATH: "/opt/data/pylib",
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
