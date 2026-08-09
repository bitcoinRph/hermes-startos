# Hermes Agent

Hermes Agent is a self-improving AI agent from Nous Research running as a StartOS service.

## Documentation

- [Hermes Agent README](https://github.com/NousResearch/hermes-agent) — upstream project documentation
- [StartOS Packaging Guide](https://docs.start9.com/packaging) — reference for StartOS package behavior and packaging conventions

## What you get on StartOS

- **The Hermes gateway daemon** starts automatically with the package.
- **The Hermes web dashboard** is exposed in the StartOS UI on port `9119`.
- **Persistent service data** is stored in the package volume mounted at `/opt/data`.
- **OpenAI Codex OAuth action** lets you configure ChatGPT Pro credentials from the StartOS UI.
- **Login to StartOS** optionally enrolls a `start-cli` identity on the service volume so Hermes can administer the server after explicit approval.
- **Revoke StartOS Access** removes the stored `start-cli` identity when you want to cut that access off.

## Getting set up

1. Install the package on your Start9 server.
2. After install, run the **Set OpenAI OAuth Credentials** action to configure your model provider tokens.
3. Optional: run **Login to StartOS** if you want Hermes to use `start-cli` for StartOS administration. This grants root-equivalent server control; use only on a server where that is acceptable.
4. Access the Hermes dashboard through the StartOS UI to configure messaging platforms and additional settings.

## Features

- 300+ LLM model support via OpenRouter, OpenAI, Anthropic, NVIDIA NIM, and more
- 23 messaging platforms including Telegram, Discord, Slack, and WhatsApp
- Built-in learning loop with autonomous skill creation
- MCP server support with 40+ integrated tools
- Multi-agent Kanban orchestration
