import { VersionInfo } from "@start9labs/start-sdk";

export const v_0_20_4_0 = VersionInfo.of({
  version: "0.20.4:0",
  releaseNotes: {
    en_US:
      "Tracks upstream Hermes Agent v0.20.4 (tag v2026.8.18), a patch release rolling up the post-v0.20.2 stability window for downstream package consumers. Wrapper runtime remains unchanged; StartOS keeps the existing inline boot script, dashboard auth bootstrap, Buzz CLI asset mount, writable /opt/data, immutable /opt/hermes install tree, and CI guards for bundled lifecycle/Codex fixes.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
});
