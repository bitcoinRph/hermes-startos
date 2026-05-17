import { sdk } from "../sdk";
import type { T } from "@start9labs/start-sdk";

export const initializeService = sdk.setupOnInit(
  async (effects: T.Effects, kind: "install" | "update" | "restore" | null) => {
    // Hermes bootstraps its own config files via the container entrypoint.
    if (kind !== "install") return;
  },
);
