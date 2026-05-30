# Hermes Agent for StartOS

StartOS service package for [Hermes Agent](https://github.com/NousResearch/hermes-agent) v0.15.2 — a self-improving AI agent from Nous Research.

## What this package does

- Runs the Hermes gateway daemon from the upstream Docker image
- Exposes the Hermes web dashboard on port 9119 via StartOS UI
- Mounts persistent data at `/opt/data` (matching Hermes's `HERMES_HOME`)
- Provides a StartOS action for configuring OpenAI Codex OAuth credentials

## What is included

- StartOS manifest, daemon, interface, and init configuration
- A Codex OAuth action for entering ChatGPT tokens on the StartOS node
- GitHub Actions CI that builds `.s9pk` packages and publishes releases
- Codex model and stream guard validation in CI

## Building

```bash
npm ci --include=dev
npm run check
npm run build
make x86_64        # or make aarch64
```

## Installing

Download the `.s9pk` from the [Releases](https://github.com/bitcoinRph/hermes-startos/releases) page and sideload via your Start9 server UI under **System > Sideload Service**.
