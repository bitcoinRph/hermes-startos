# Hermes Agent StartOS Wrapper

This is the StartOS wrapper for [Hermes Agent](https://github.com/NousResearch/hermes-agent).

What this wrapper assumes:

- Hermes runs from its upstream Dockerfile and entrypoint
- the main StartOS daemon starts the Hermes gateway
- the Hermes dashboard is exposed as the StartOS UI on port 9119
- the persistent StartOS volume is mounted at `/opt/data`, matching Hermes's container expectations

What is included:

- StartOS manifest, daemon, interface, and init scaffolding
- a minimal project layout that follows the StartOS packaging guide
- upstream repo references for Hermes and the packaging guide
- a Codex OAuth action for entering ChatGPT tokens on the StartOS node
- GitHub Actions packaging support with Codex model / stream guard validation

What remains outside the wrapper scope:

- platform-specific packaging polish beyond the wrapper layer
- future migration/setup flows if upstream Hermes changes its requirements
- release publishing automation for GitHub-hosted `.s9pk` artifacts

Next step:

- build the `.s9pk` on GitHub Actions or a compatible packaging host
