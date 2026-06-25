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

# --- Fix volume ownership (runs as root) ---
# StartOS mounts its own volume at /opt/data which may be root-owned.
# The hermes user (UID 10000) needs write access for subdirectory creation.
actual_uid=$(id -u hermes)
if [ "$(stat -c %u "$HERMES_HOME" 2>/dev/null)" != "$actual_uid" ]; then
    echo "[startos] Fixing ownership of $HERMES_HOME to hermes ($actual_uid)"
    chown hermes:hermes "$HERMES_HOME" 2>/dev/null || true
fi

# --- Create essential directories as hermes user ---
$S6_SUID hermes mkdir -p \\
    "$HERMES_HOME/cron" \\
    "$HERMES_HOME/sessions" \\
    "$HERMES_HOME/logs" \\
    "$HERMES_HOME/logs/gateways" \\
    "$HERMES_HOME/hooks" \\
    "$HERMES_HOME/memories" \\
    "$HERMES_HOME/skills" \\
    "$HERMES_HOME/skins" \\
    "$HERMES_HOME/plans" \\
    "$HERMES_HOME/workspace" \\
    "$HERMES_HOME/home" \\
    "$HERMES_HOME/profiles" \\
    "$HERMES_HOME/pairing" \\
    "$HERMES_HOME/platforms/pairing" \\
    "$HERMES_HOME/lazy-packages"

# --- Heal stale install-method stamp ---
# 0.17.0 bakes the 'docker' stamp into the immutable install tree
# (/opt/hermes/.install_method, read first by detect_install_method).
# Older wrapper versions wrote it into the volume; remove that stale copy
# so it can't shadow the baked stamp on a shared/bind-mounted data dir.
if [ -f "$HERMES_HOME/.install_method" ]; then
    stamped="$(tr -d '[:space:]' < "$HERMES_HOME/.install_method" 2>/dev/null || true)"
    [ "$stamped" = "docker" ] && rm -f "$HERMES_HOME/.install_method" 2>/dev/null || true
fi

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

# --- Fix config.yaml permissions ---
if [ -f "$HERMES_HOME/config.yaml" ]; then
    chown hermes:hermes "$HERMES_HOME/config.yaml" 2>/dev/null || true
    chmod 640 "$HERMES_HOME/config.yaml" 2>/dev/null || true
fi

# --- Migrate persisted config schema ---
# Image upgrades replace code under $INSTALL_DIR but preserve the volume;
# run the same non-interactive migrations the upstream stage2 hook runs.
if [ -f "$HERMES_HOME/config.yaml" ] && [ "\${HERMES_SKIP_CONFIG_MIGRATION:-}" != "1" ]; then
    $S6_SUID hermes "$INSTALL_DIR/.venv/bin/python" "$INSTALL_DIR/scripts/docker_config_migrate.py" || \\
        echo "[startos] Warning: docker_config_migrate.py failed; continuing"
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

# --- Discover Chromium for browser tool ---
PLAYWRIGHT_BROWSERS_PATH="\${PLAYWRIGHT_BROWSERS_PATH:-/opt/hermes/.playwright}"
if [ -z "\${AGENT_BROWSER_EXECUTABLE_PATH:-}" ] && [ -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
    browser_bin=$(find "$PLAYWRIGHT_BROWSERS_PATH" -type f -executable \\
        \\( -name 'chrome' -o -name 'chromium' \\
           -o -name 'chrome-headless-shell' -o -name 'chromium-browser' \\) \\
        2>/dev/null | head -n 1)
    if [ -n "$browser_bin" ]; then
        echo "[startos] Found Chromium: $browser_bin"
        export AGENT_BROWSER_EXECUTABLE_PATH="$browser_bin"
    fi
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
          // 0.16.0 redirects bare `gateway run` to s6 supervision when it
          // detects the s6 image; we bypass s6 entirely, so opt out.
          HERMES_GATEWAY_NO_SUPERVISE: "1",
          // Static image paths normally set by the Dockerfile ENV; pinned
          // here so the daemon doesn't depend on image env propagation.
          HERMES_TUI_DIR: "/opt/hermes/ui-tui",
          HERMES_WEB_DIST: "/opt/hermes/hermes_cli/web_dist",
          PLAYWRIGHT_BROWSERS_PATH: "/opt/hermes/.playwright",
          // 0.17.0 makes /opt/hermes immutable (root-owned, read-only).
          // Pin the Dockerfile ENV that keeps the runtime off that tree:
          // no lazy pip installs into the read-only .venv, no .pyc writes,
          // and all mutable state confined to the /opt/data volume.
          HERMES_DISABLE_LAZY_INSTALLS: "1",
          HERMES_LAZY_INSTALL_TARGET: "/opt/data/lazy-packages",
          PYTHONDONTWRITEBYTECODE: "1",
          HERMES_WRITE_SAFE_ROOT: "/opt/data",
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
