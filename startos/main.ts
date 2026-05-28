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
        // The upstream image switched from tini to s6-overlay in 136cb05c.
        // s6-overlay's /init requires PID 1, which StartOS sub-containers
        // don't grant — so sdk.useEntrypoint() (which calls /init) crashes.
        // Instead: run stage2-hook.sh as root for container init (UID remap,
        // chown, config seed), then drop to hermes via gosu and start the
        // gateway directly, matching what /init + main-wrapper.sh would do.
        command: [
          "/bin/sh",
          "-c",
          "HERMES_HOME=/opt/data /opt/hermes/docker/stage2-hook.sh && cd /opt/data && . /opt/hermes/.venv/bin/activate && export HOME=/opt/data && exec gosu hermes hermes gateway run",
        ],
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
