import { setupManifest } from "@start9labs/start-sdk";
import { alertInstall, long, short } from "./i18n";

export const manifest = setupManifest({
  id: "hermes-agent-startos",
  title: "Hermes Agent",
  license: "MIT",
  packageRepo: "https://github.com/bitcoinRph/hermes-startos",
  upstreamRepo: "https://github.com/NousResearch/hermes-agent",
  marketingUrl: "https://hermes-agent.nousresearch.com/",
  donationUrl: null,
  description: { short, long },
  volumes: ["main"],
  images: {
    main: {
      source: {
        dockerTag: "nousresearch/hermes-agent:latest",
      },
      arch: ["x86_64", "aarch64"],
    },
  },
  alerts: {
    install: alertInstall,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
});
