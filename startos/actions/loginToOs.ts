import { appendFile } from "fs/promises";
import { SubContainer, T } from "@start9labs/start-sdk";
import { startCliConfigYaml } from "../fileModels/startCliConfig.yaml";
import { sdk } from "../sdk";
import { dataDir, startCliMounts, START_CLI_VERSION } from "../utils";

const { InputSpec, Value } = sdk;

const inputSpec = InputSpec.of({
  masterPassword: Value.text({
    name: "StartOS Master Password",
    description: "Your StartOS server master password",
    required: true,
    default: null,
    placeholder: "Enter master password",
    masked: true,
  }),
});

export const loginToOs = sdk.Action.withInput(
  "login-to-os",

  async ({ effects }) => ({
    name: "Login to StartOS",
    description:
      "Authenticate start-cli so Hermes can administer this StartOS server",
    warning:
      "This grants Hermes root-equivalent control of your StartOS server through start-cli. Only do this on a server designated for development or experimentation.",
    allowedStatuses: "any" as const,
    group: null,
    visibility: "enabled" as const,
  }),

  inputSpec,

  async ({ effects }) => ({ masterPassword: "" }),

  async ({ effects, input }) => {
    const host = await startCliConfigYaml.read((c) => c?.host).once();
    if (!host) {
      throw new Error(
        "No host configured. The host URL is set automatically from the OS IP address.",
      );
    }

    const result = await sdk.SubContainer.withTemp(
      effects,
      { imageId: "main" },
      startCliMounts(),
      "start-cli-login",
      async (subc) => {
        await installRootCA(effects, subc);
        // This action is allowed while the daemon is stopped, so establish the
        // volume ownership that the startup script would otherwise repair.
        await subc.execFail(["mkdir", "-p", `${dataDir}/.startos`], {
          user: "root",
        });
        await ensureStartCli(subc);
        await subc.execFail(
          [
            "chown",
            "-R",
            "hermes:hermes",
            `${dataDir}/.startos`,
            `${dataDir}/.local`,
          ],
          {
            user: "root",
          },
        );
        return subc.exec([`${dataDir}/.local/bin/start-cli`, "auth", "login"], {
          user: "hermes",
          env: { HOME: dataDir, PASSWORD: input.masterPassword },
        });
      },
    );

    if (result.exitCode !== 0) {
      throw new Error(
        `Login failed: ${String(result.stderr || result.stdout || "Unknown error")}`,
      );
    }

    return {
      version: "1" as const,
      title: "Login Successful",
      message: "start-cli is now authenticated with your StartOS server.",
      result: null,
    };
  },
);

export async function ensureStartCli(
  subcontainer: SubContainer<typeof sdk.manifest>,
) {
  await subcontainer.execFail(["mkdir", "-p", `${dataDir}/.local/bin`], {
    user: "root",
  });
  await subcontainer.execFail(
    [
      "sh",
      "-c",
      [
        `target='${dataDir}/.local/bin/start-cli'`,
        'if [ ! -x "$target" ]; then',
        '  arch="$(uname -m)"',
        '  url="https://github.com/Start9Labs/start-technologies/releases/download/start-cli%2Fv${START_CLI_VERSION}/start-cli_${arch}-linux"',
        '  curl -fsSL --retry 3 --retry-all-errors --connect-timeout 15 --max-time 120 -o "$target" "$url"',
        '  chmod 0755 "$target"',
        "fi",
      ].join("; "),
    ],
    { user: "root", env: { START_CLI_VERSION } },
  );
}

export async function installRootCA(
  effects: T.Effects,
  subcontainer: SubContainer<typeof sdk.manifest>,
) {
  const hostnames = [`${sdk.manifest.id}.startos`];
  const certs = await sdk.getSslCertificate(effects, hostnames).const();
  const [rootCa] = certs.slice(-1);

  await subcontainer.writeFile(
    "/usr/share/ca-certificates/startos-root-ca.crt",
    rootCa,
  );
  const rootfs = await subcontainer.rootfs;
  await appendFile(
    `${rootfs}/etc/ca-certificates.conf`,
    "startos-root-ca.crt\n",
  );

  await subcontainer.execFail(["update-ca-certificates"], { user: "root" });
}
