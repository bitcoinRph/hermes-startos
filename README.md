# Hermes Agent for StartOS

StartOS service package for [Hermes Agent](https://github.com/NousResearch/hermes-agent) v0.20.4 — a self-improving AI agent from Nous Research.

## What this package does

- Runs the Hermes gateway daemon from the upstream Docker image
- Exposes the Hermes web dashboard on port 9119 via StartOS UI
- Mounts persistent data at `/opt/data` (matching Hermes's `HERMES_HOME`)
- Provides StartOS actions for configuring OpenAI Codex OAuth credentials and optional `start-cli` server access

## What is included

- StartOS manifest, daemon, interface, and init configuration
- A Codex OAuth action for entering ChatGPT tokens on the StartOS node
- Login/Revoke StartOS Access actions that enroll or remove a volume-stored `start-cli` identity key after explicit admin approval
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

## Optional StartOS administration access

Run **Login to StartOS** only if you want Hermes to administer this StartOS server through `start-cli`. The action asks for the StartOS master password, installs the official `start-cli` binary into `/opt/data/.local/bin` if it is missing, stores the enrolled identity under `/opt/data/.startos/`, and grants root-equivalent server control to the agent. Run **Revoke StartOS Access** to best-effort logout and remove the stored identity files. The package does not bake or store the master password.
