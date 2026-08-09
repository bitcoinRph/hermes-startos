import { mkdir } from "fs/promises";
import { sdk } from "../sdk";
import type { T } from "@start9labs/start-sdk";
import { setOpenAiOAuth } from "../actions/setOpenAiOAuth";
import { startCliConfigYaml } from "../fileModels/startCliConfig.yaml";

export const initializeService = sdk.setupOnInit(
  async (effects: T.Effects, kind: "install" | "update" | "restore" | null) => {
    // Seed start-cli's host from the OS IP. The Login to StartOS action fills
    // in the enrolled identity key and cookies later, after explicit approval.
    const osIp = await sdk.getOsIp(effects);
    await mkdir(sdk.volumes.main.subpath(".startos"), { recursive: true });
    await startCliConfigYaml.merge(effects, { host: `https://${osIp}` });

    // Hermes bootstraps its own config files via the container entrypoint.
    if (kind !== "install") return;

    // Prompt the user to set their OpenAI OAuth credentials immediately after install.
    await sdk.action.createOwnTask(effects, setOpenAiOAuth, "critical", {
      reason:
        "Set your OpenAI Codex OAuth tokens so Hermes can make model calls.",
    });
  },
);
