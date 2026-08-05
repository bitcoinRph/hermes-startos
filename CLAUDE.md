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
- the Buzz platform's `buzz` CLI (required for all outbound Buzz messages;
  not shipped by the upstream image) is built in CI from a pinned block/buzz
  commit into `assets/buzz` and mounted read-only at `/opt/package-assets`;
  the daemon env pins `BUZZ_CLI_PATH=/opt/package-assets/buzz`, which the
  adapter prefers over any `cli_path` in config.yaml — this also overrides
  the stale `/usr/local/bin/buzz` path the retired canary builds wrote into
  volume configs (the boot-script bootstrap also deletes that stale key).
  The boot script conditionally enables buzz-platform when relay credentials
  exist in `.env`, pins LAN relay hostnames into /etc/hosts
  (`BUZZ_RELAY_HOSTS_ENTRY` / `BUZZ_RELAY_HOST_IP`), and exports private-CA
  trust env vars when a combined CA bundle is present on the volume
- upstream is pinned via the `upstream-project` submodule (currently
  v0.20.0 / tag v2026.8.3, commit 3c27eb62)
- the package builds against start-sdk 2.0.9 (the native StartOS 0.4.0 SDK);
  StartOS 0.4.0 rejects s9pks built with pre-2.x SDKs at sideload, so never
  downgrade the SDK pin. The sdkVersion stamped in the packed s9pk comes from
  this npm dependency (the bundled TS library), NOT from the build Makefile —
  so bumping the SDK is the whole 0.4.0 fix
- build plumbing uses the VENDORED `s9pk.mk` (`include s9pk.mk` in the
  Makefile), not the SDK-shipped copy. The vendored file carries two
  repo-specific fixes that must be preserved: (1) `PACKAGE_ID` is extracted
  with a double-quote awk (`-F'"' '/id: "/'`) because this repo formats the
  manifest with double quotes — the SDK's copy uses a single-quote awk and
  yields an empty id (packs `_x86_64.s9pk`); (2) `start-cli` is invoked with
  `-H http://localhost` on `list-ingredients` and `s9pk pack` so packing does
  not try to resolve the default `dev-vm.local` host (fails in CI). Do not
  replace it with `include node_modules/@start9labs/start-sdk/s9pk.mk` without
  re-adding both fixes

Open questions:

- whether the wrapper should add setup/migration actions before packaging is published
- whether messaging gateway credentials should be bootstrapped from StartOS actions or left to Hermes setup
