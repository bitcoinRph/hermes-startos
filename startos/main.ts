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

path_has_symlink_component() {
    path="$1"
    while [ -n "$path" ] && [ "$path" != "/" ]; do
        if [ -L "$path" ]; then
            return 0
        fi
        if [ "$path" = "$HERMES_HOME" ]; then
            break
        fi
        parent="$(dirname "$path")"
        if [ "$parent" = "$path" ]; then
            break
        fi
        path="$parent"
    done
    return 1
}

safe_chown() {
    target="$1"
    if path_has_symlink_component "$target"; then
        echo "[startos] Warning: refusing chown through symlinked path $target — continuing"
        return 0
    fi
    chown hermes:hermes "$target" 2>/dev/null || true
}

safe_chown_tree() {
    target="$1"
    if path_has_symlink_component "$target"; then
        echo "[startos] Warning: refusing recursive chown through symlinked path $target — continuing"
        return 0
    fi
    chown -R hermes:hermes "$target" 2>/dev/null || true
}

if [ "$(stat -c %u "$HERMES_HOME" 2>/dev/null)" != "$actual_uid" ]; then
    echo "[startos] Fixing ownership of $HERMES_HOME to hermes ($actual_uid)"
    safe_chown "$HERMES_HOME"
fi

# Repair hermes-owned state that may have been touched from a root attach shell.
# Include pairing approvals: hermes pairing approve from root attach shells can
# leave 0600 root-owned approval files that the unprivileged gateway cannot read.
for sub in cron profiles pairing platforms/pairing; do
    [ -d "$HERMES_HOME/$sub" ] && safe_chown_tree "$HERMES_HOME/$sub"
done
for f in \
    auth.json auth.lock .env \
    state.db state.db-shm state.db-wal \
    hermes_state.db \
    response_store.db response_store.db-shm response_store.db-wal \
    gateway.pid gateway.lock gateway_state.json processes.json \
    active_profile; do
    [ -e "$HERMES_HOME/$f" ] && safe_chown "$HERMES_HOME/$f"
done

# --- Create essential directories as hermes user ---
$S6_SUID hermes mkdir -p \\
    "$HERMES_HOME/backups" \\
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

# --- Ensure dashboard auth for StartOS non-loopback bind ---
# Upstream hardening makes --insecure a no-op on 0.0.0.0 binds. StartOS exposes
# the dashboard through its service interface, so seed the bundled password
# provider when the user has not already configured any dashboard auth. The
# generated one-time password is stored in a hermes-owned 0600 file so the
# operator can retrieve it from the data volume and rotate it later.
cat > /tmp/startos-dashboard-auth.py <<'PY'
from pathlib import Path
import secrets
import sys

import yaml

home = Path('/opt/data')
config_path = home / 'config.yaml'
creds_path = home / 'dashboard-credentials.txt'

try:
    cfg = yaml.safe_load(config_path.read_text()) if config_path.exists() else {}
    if not isinstance(cfg, dict):
        cfg = {}
    dashboard = cfg.setdefault('dashboard', {})
    basic = dashboard.setdefault('basic_auth', {})
    has_basic = bool(str(basic.get('username') or '').strip()) and bool(
        str(basic.get('password_hash') or basic.get('password') or '').strip()
    )
    has_oauth = False
    env_path = home / '.env'
    if env_path.exists():
        env_text = env_path.read_text(errors='ignore')
        has_oauth = 'HERMES_DASHBOARD_OAUTH_CLIENT_ID=' in env_text

    if not has_basic and not has_oauth:
        from plugins.dashboard_auth.basic import hash_password
        username = str(basic.get('username') or '').strip() or 'admin'
        password = secrets.token_urlsafe(18)
        basic['username'] = username
        basic['password_hash'] = hash_password(password)
        basic['password'] = ''
        if not str(basic.get('secret') or '').strip():
            basic['secret'] = secrets.token_urlsafe(32)
        basic.setdefault('session_ttl_seconds', 604800)
        disabled = ((cfg.get('plugins') or {}).get('disabled') or [])
        if isinstance(disabled, list):
            cfg.setdefault('plugins', {})['disabled'] = [
                item for item in disabled if item not in ('basic', 'dashboard_auth/basic')
            ]
        config_path.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding='utf-8')
        creds_path.write_text(
            'Hermes dashboard credentials generated by the StartOS package.\\n'
            'Username: ' + username + '\\n'
            'Password: ' + password + '\\n'
            'Rotate these credentials after first login.\\n',
            encoding='utf-8',
        )
        creds_path.chmod(0o600)
        config_path.chmod(0o640)
        print('[startos] Seeded dashboard basic auth credentials')
    elif has_basic:
        print('[startos] Dashboard basic auth already configured')
    else:
        print('[startos] Dashboard OAuth auth already configured')
except Exception as exc:
    print(f'[startos] Warning: dashboard auth bootstrap failed: {exc}', file=sys.stderr)
    sys.exit(1)
PY
$S6_SUID hermes "$INSTALL_DIR/.venv/bin/python" /tmp/startos-dashboard-auth.py || \\
    echo "[startos] Warning: dashboard auth bootstrap failed; dashboard may fail closed"
rm -f /tmp/startos-dashboard-auth.py

# --- Bootstrap auth.json from env (first boot only) ---
if [ ! -f "$HERMES_HOME/auth.json" ] && [ -n "\${HERMES_AUTH_JSON_BOOTSTRAP:-}" ]; then
    printf '%s' "$HERMES_AUTH_JSON_BOOTSTRAP" > "$HERMES_HOME/auth.json"
    chown hermes:hermes "$HERMES_HOME/auth.json" 2>/dev/null || true
    chmod 600 "$HERMES_HOME/auth.json"
fi

# --- Re-seed a terminally dead Nous bootstrap session when explicitly provided ---
# Mirrors upstream docker/stage2-hook.sh for StartOS because this wrapper bypasses
# the s6 entrypoint. The helper swaps providers.nous when auth.json is
# provably terminal or when the orchestrator seed has a later obtained_at
# timestamp; healthy, newer, absent, rotating, or unparseable auth state is a no-op.
if [ -f "$HERMES_HOME/auth.json" ] && [ -n "\${HERMES_AUTH_JSON_REBOOTSTRAP:-}" ]; then
    if path_has_symlink_component "$HERMES_HOME/auth.json"; then
        echo "[startos] Warning: refusing auth.json reseed through symlinked path $HERMES_HOME/auth.json — continuing"
    else
        $S6_SUID hermes "$INSTALL_DIR/.venv/bin/python" \
            "$INSTALL_DIR/scripts/docker_rebootstrap_nous_session.py" \
            "$HERMES_HOME/auth.json" || \
            echo "[startos] Warning: docker_rebootstrap_nous_session.py failed; continuing"
    fi
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

# --- Reap orphaned processes from a prior in-place restart ---
# StartOS restarts a crashed daemon by re-running this script in the SAME
# subcontainer, so background processes from the previous boot (the dashboard,
# and the gateway worker whose PID is recorded in /opt/data/gateway.pid) can
# survive as orphans. The post-0.17.0 gateway is a strict singleton: it refuses
# to start (exit 1: "Another gateway instance is already running (PID N)") when
# it finds a live PID in gateway.pid, which would otherwise wedge every restart
# into a permanent crash loop. Clear any stale dashboard here; the gateway's own
# orphan is handled atomically by --replace below.
$S6_SUID hermes "$REAL" dashboard --stop 2>/dev/null || true

# --- Start dashboard (background) ---
echo "[startos] Starting dashboard on 0.0.0.0:${uiPort}"
$S6_SUID hermes "$REAL" dashboard --host 0.0.0.0 --port ${uiPort} --no-open --insecure &

# --- Start gateway (foreground) ---
# --replace makes the gateway take over from any orphaned instance left by a
# prior boot (it SIGTERM/SIGKILLs the recorded PID, clears the pid file, and
# releases stale locks) instead of refusing to start — the systemd/launchd
# pattern, which is exactly StartOS's supervisor role here. --no-supervise is
# explicit alongside HERMES_GATEWAY_NO_SUPERVISE=1 so the gateway stays the
# foreground process and its exit code propagates to StartOS.
echo "[startos] Starting gateway"
exec $S6_SUID hermes "$REAL" gateway run --replace --no-supervise
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
