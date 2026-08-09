import { FileHelper, z } from "@start9labs/start-sdk";
import { sdk } from "../sdk";

// start-cli config: <data>/.startos/config.yaml. The wrapper seeds only the
// host from the OS IP. `start-cli auth login` stores its enrolled identity key
// and cookies alongside this file on the durable volume.
const shape = z.object({
  host: z.string().optional(),
});

export const startCliConfigYaml = FileHelper.yaml(
  { base: sdk.volumes.main, subpath: ".startos/config.yaml" },
  shape,
);
