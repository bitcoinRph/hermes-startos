# Hermes Agent StartOS Wrapper

This repository is a StartOS wrapper scaffold for Hermes Agent.

When Claude Code works here:

- Read the local Hermes upstream clone at `/data/.openclaw/workspace/_hermes-agent`
- Read the packaging guide clone at `/data/.openclaw/workspace/_ai-service-packaging`
- Treat this repo as the wrapper layer, not the upstream application

Current runtime model:

- Hermes upstream Dockerfile image is reused, but its s6-overlay entrypoint
  is bypassed (s6 needs PID 1, which StartOS sub-containers don't grant)
- a custom startup script replicates the essential stage2-hook setup (volume
  chown, dir seeding, config seeding and schema migration, auth bootstrap,
  skills sync, Chromium discovery), then starts the dashboard in background
  and `hermes gateway run` in foreground
- the startup script is passed INLINE to the daemon (`sh -c`), never written
  to disk. The old pattern (host-side writeFile into
  `${hermesSub.rootfs}/opt/hermes/startos-start.sh`) depended on StartOS
  materializing the write into the overlay the container mounts; the
  StartOS 0.4.0 LXC rewrite broke that, leaving the daemon executing a
  stale pre-migration script (syntax-error crash loop). Do not reintroduce
  rootfs writes.
- `HERMES_GATEWAY_NO_SUPERVISE=1` pins the pre-s6 foreground gateway behavior
- StartOS restarts a crashed daemon by re-running the boot script in the SAME
  subcontainer, so background processes survive as orphans. The post-0.17.0
  gateway is a strict singleton (refuses to start while a live PID is recorded
  in `/opt/data/gateway.pid`), so the boot script reaps stale dashboards
  (`dashboard --stop`) and runs `gateway run --replace` to take over from a
  prior worker — without this the service wedges into a permanent crash loop
- as of 0.17.0 the `/opt/hermes` install tree is immutable (root-owned,
  read-only); the daemon env pins `HERMES_DISABLE_LAZY_INSTALLS=1`,
  `PYTHONDONTWRITEBYTECODE=1`, and `HERMES_WRITE_SAFE_ROOT=/opt/data` so the
  runtime never tries to write into it — all mutable state lives on the volume
- the Hermes dashboard is exposed on port `9119`
- the main StartOS volume is mounted at `/opt/data`
- optional backend SDKs (Firecrawl, Exa, etc.) install to
  `HERMES_LAZY_INSTALL_TARGET=/opt/data/lazy-packages` on the writable volume,
  bypassing the sealed venv while preserving its integrity
- upstream is pinned via the `upstream-project` submodule (currently
  v0.19.1 / tag v2026.7.30, commit cc4cab2)
- the package still builds against start-sdk 1.5.2 and runs on StartOS 0.4.0
  through its compatibility layer; a port to start-sdk 2.x (the native
  StartOS 0.4.0 SDK) is the recommended follow-up before adding new features

Open questions:

- whether the wrapper should add setup/migration actions before packaging is published
- whether messaging gateway credentials should be bootstrapped from StartOS actions or left to Hermes setup
