import { ensureStartCli, installRootCA } from "./loginToOs";
import { sdk } from "../sdk";
import { dataDir, startCliMounts } from "../utils";

const startCliAuthPaths = [
  `${dataDir}/.startos/id.key.pem`,
  `${dataDir}/.startos/developer.key.pem`,
  `${dataDir}/.startos/.cookies.json`,
  `${dataDir}/.startos/.cookies.json.tmp`,
];

export const revokeStartOsAccess = sdk.Action.withoutInput(
  "revoke-startos-access",

  async ({ effects }) => ({
    name: "Revoke StartOS Access",
    description:
      "Remove Hermes' stored start-cli authentication so it can no longer administer this StartOS server",
    warning:
      "Hermes will lose StartOS administrative access until you run Login to StartOS again.",
    allowedStatuses: "any" as const,
    group: null,
    visibility: "enabled" as const,
  }),

  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: "main" },
      startCliMounts(),
      "start-cli-revoke",
      async (subc) => {
        // Login enrolls the key in the server's key store. Deleting the file
        // alone strands that server-side entry, so try logout first. Local key
        // removal remains unconditional because it is the hard revocation step.
        try {
          await installRootCA(effects, subc);
          await ensureStartCli(subc);
          await subc.exec(
            [`${dataDir}/.local/bin/start-cli`, "auth", "logout"],
            {
              user: "hermes",
              env: { HOME: dataDir },
            },
          );
        } catch (e) {
          console.warn(
            "Server-side un-enrollment failed; removing local key anyway",
          );
          console.warn(String(e));
        }

        await subc.execFail(["rm", "-f", ...startCliAuthPaths], {
          user: "root",
        });
      },
    );

    return {
      version: "1" as const,
      title: "StartOS Access Revoked",
      message:
        "Hermes' stored start-cli authentication was removed. Run Login to StartOS to grant access again.",
      result: null,
    };
  },
);
