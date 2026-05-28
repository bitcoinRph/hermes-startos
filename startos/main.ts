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
        // Hermes v0.15.0 switched its Docker ENTRYPOINT to s6-overlay's /init,
        // which expects to be PID 1. StartOS daemons already supervise the
        // subcontainer process, so invoking the image entrypoint can fail in
        // this environment. Run the upstream boot hook directly, then exec the
        // gateway as the hermes user. This preserves the important first-boot
        // setup work (config/auth seeding, permissions, skill sync) without
        // depending on /init.
        command: [
          "sh",
          "-lc",
          "mkdir -p /run/s6/container_environment && /opt/hermes/docker/stage2-hook.sh && exec s6-setuidgid hermes /opt/hermes/.venv/bin/hermes gateway run",
        ],
        env: {
          HERMES_HOME: "/opt/data",
          HERMES_DASHBOARD: "1",
          HERMES_DASHBOARD_HOST: "0.0.0.0",
          HERMES_DASHBOARD_PORT: String(uiPort),
          // Python searches /opt/data/pylib before the Docker image modules,
          // allowing persistent patches to survive container restarts.
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
