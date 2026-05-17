# Hermes Agent

Hermes Agent is running as a StartOS service.

## Documentation

- [Hermes upstream README](https://github.com/NousResearch/hermes-agent) - the upstream project documentation.
- [StartOS Packaging Guide](https://docs.start9.com/packaging) - reference for StartOS package behavior and packaging conventions.

## What you get on StartOS

- **The Hermes gateway daemon** starts automatically with the package.
- **The Hermes dashboard** is exposed in the StartOS UI on port `9119`.
- **Persistent service data** is stored in the package volume mounted at `/opt/data`.

## Getting set up

This package currently has no custom install wizard or first-run action.
If Hermes needs additional configuration, manage it the same way you would in the upstream project and restart the service after changes.

## Limitations

- This wrapper is a packaging scaffold, not a Hermes feature fork.
- Package build and image assembly still depend on the StartOS packaging toolchain on the host machine.
