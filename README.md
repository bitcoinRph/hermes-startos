# Hermes Agent StartOS Wrapper

This is an initial StartOS wrapper scaffold for [Hermes Agent](https://github.com/NousResearch/hermes-agent).

What this prototype assumes:

- Hermes runs from its upstream Dockerfile and entrypoint
- the main StartOS daemon starts the Hermes gateway
- the Hermes dashboard is exposed as the StartOS UI on port 9119
- the persistent StartOS volume is mounted at `/opt/data`, matching Hermes's container expectations

What is included:

- StartOS manifest, daemon, interface, and init scaffolding
- a minimal project layout that follows the StartOS packaging guide
- upstream repo references for Hermes and the packaging guide

What is not finished yet:

- final StartOS SDK wiring and build validation
- platform-specific packaging polish
- migration, setup, and action flows

Next step:

- wire this scaffold into a real StartOS build and confirm the Hermes gateway/dashboard start cleanly inside StartOS
