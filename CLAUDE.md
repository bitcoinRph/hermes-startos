# Hermes Agent StartOS Wrapper

This repository is a StartOS wrapper scaffold for Hermes Agent.

When Claude Code works here:

- Read the local Hermes upstream clone at `/data/.openclaw/workspace/_hermes-agent`
- Read the packaging guide clone at `/data/.openclaw/workspace/_ai-service-packaging`
- Treat this repo as the wrapper layer, not the upstream application

Current runtime model:

- Hermes upstream Dockerfile and entrypoint are reused
- the main StartOS daemon starts `hermes gateway run`
- the Hermes dashboard is exposed on port `9119`
- the main StartOS volume is mounted at `/opt/data`

Open questions:

- whether the wrapper should add setup/migration actions before packaging is published
- whether messaging gateway credentials should be bootstrapped from StartOS actions or left to Hermes setup
