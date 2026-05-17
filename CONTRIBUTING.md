# Contributing

This repo packages [Hermes Agent](https://github.com/NousResearch/hermes-agent) for StartOS.

## Documentation

- `README.md` documents what differs from upstream and how the wrapper is built.
- `instructions.md` is the user-facing StartOS instructions file.
- `CLAUDE.md` contains the repo-specific working rules for Claude Code.

## Building locally

The local build flow is:

```bash
npm ci --include=dev
npm run build
make
```

`npm run build` generates the JavaScript bundle under `javascript/`.
`make` assembles the final `.s9pk`.

## GitHub builds

The repo now ships a GitHub Actions packaging workflow:

- `.github/workflows/package.yml` builds the x86_64 package artifact
- the workflow uploads the resulting `.s9pk` as a GitHub Actions artifact

If you want to publish releases from GitHub, you can add a release workflow later using the same packaging job.

## Updating Hermes packaging

When the upstream Hermes image, entrypoint, or StartOS-facing behavior changes:

1. update the wrapper manifest or runtime wiring
2. re-run `npm run check` and `npm run build`
3. rebuild the package with `make` or the GitHub Actions workflow
4. update `README.md` and `instructions.md` if user-visible behavior changed
