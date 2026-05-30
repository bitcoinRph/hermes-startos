import { writeFile } from "node:fs/promises";
import { sdk } from "./sdk";
import type { T } from "@start9labs/start-sdk";
import { uiPort } from "./utils";

const startupScript = `#!/bin/sh
set -eu

HERMES_HOME="/opt/data"
INSTALL_DIR="/opt/hermes"
REAL="$INSTALL_DIR/.venv/bin/hermes"
S6_SUID=/command/s6-setuidgid

# --- Create essential directories as hermes user ---
$S6_SUID hermes mkdir -p \\
    "$HERMES_HOME/cron" \\
    "$HERMES_HOME/sessions" \\
    "$HERMES_HOME/logs" \\
    "$HERMES_HOME/hooks" \\
    "$HERMES_HOME/memories" \\
    "$HERMES_HOME/skills" \\
    "$HERMES_HOME/skins" \\
    "$HERMES_HOME/plans" \\
    "$HERMES_HOME/workspace" \\
    "$HERMES_HOME/home"

# --- Install method stamp ---
printf 'docker\\n' | $S6_SUID hermes tee "$HERMES_HOME/.install_method" >/dev/null || true

# --- Seed config files (first boot only) ---
for pair in ".env:.env.example" "config.yaml:cli-config.yaml.example" "SOUL.md:docker/SOUL.md"; do
    dest="\${pair%%:*}"
    src="\${pair#*:}"
    if [ ! -f "$HERMES_HOME/$dest" ] && [ -f "$INSTALL_DIR/$src" ]; then
        $S6_SUID hermes cp "$INSTALL_DIR/$src" "$HERMES_HOME/$dest"
    fi
done

# --- Fix .env permissions ---
if [ -f "$HERMES_HOME/.env" ]; then
    chown hermes:hermes "$HERMES_HOME/.env" 2>/dev/null || true
    chmod 600 "$HERMES_HOME/.env" 2>/dev/null || true
fi

# --- Bootstrap auth.json from env (first boot only) ---
if [ ! -f "$HERMES_HOME/auth.json" ] && [ -n "\${HERMES_AUTH_JSON_BOOTSTRAP:-}" ]; then
    printf '%s' "$HERMES_AUTH_JSON_BOOTSTRAP" > "$HERMES_HOME/auth.json"
    chown hermes:hermes "$HERMES_HOME/auth.json" 2>/dev/null || true
    chmod 600 "$HERMES_HOME/auth.json"
fi

# --- Sync bundled skills ---
if [ -d "$INSTALL_DIR/skills" ]; then
    $S6_SUID hermes "$INSTALL_DIR/.venv/bin/python" "$INSTALL_DIR/tools/skills_sync.py" || \\
        echo "[startos] Warning: skills_sync.py failed; continuing"
fi

echo "[startos] Setup complete"

export HOME=/opt/data
cd /opt/data

# --- Start dashboard (background) ---
echo "[startos] Starting dashboard on 0.0.0.0:${uiPort}"
$S6_SUID hermes "$REAL" dashboard --host 0.0.0.0 --port ${uiPort} --no-open --insecure &

# --- Start gateway (foreground) ---
echo "[startos] Starting gateway"
exec $S6_SUID hermes "$REAL" gateway run
`;

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

    await writeFile(
      `${hermesSub.rootfs}/opt/hermes/startos-start.sh`,
      startupScript,
      { mode: 0o755 },
    );

    return sdk.Daemons.of(effects).addDaemon("main", {
      subcontainer: hermesSub,
      exec: {
        command: ["/opt/hermes/startos-start.sh"],
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
