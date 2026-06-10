# Hermes Agent StartOS Wrapper

This repository is a StartOS wrapper scaffold for Hermes Agent.

When Claude Code works here:

- Read the local Hermes upstream clone at `/data/.openclaw/workspace/_hermes-agent`
- Read the packaging guide clone at `/data/.openclaw/workspace/_ai-service-packaging`
- Treat this repo as the wrapper layer, not the upstream application

Current runtime model:

- Hermes upstream Dockerfile image is reused, but its s6-overlay entrypoint
  is bypassed (s6 needs PID 1, which StartOS sub-containers don't grant)
- a custom startup script written to the subcontainer rootfs replicates the
  essential stage2-hook setup (volume chown, dir seeding, config seeding and
  schema migration, auth bootstrap, skills sync, Chromium discovery), then
  starts the dashboard in background and `hermes gateway run` in foreground
- `HERMES_GATEWAY_NO_SUPERVISE=1` pins the pre-s6 foreground gateway behavior
- the Hermes dashboard is exposed on port `9119`
- the main StartOS volume is mounted at `/opt/data`
- upstream is pinned via the `upstream-project` submodule (currently v2026.6.5,
  Hermes Agent 0.16.0)

Open questions:

- whether the wrapper should add setup/migration actions before packaging is published
- whether messaging gateway credentials should be bootstrapped from StartOS actions or left to Hermes setup
