import { sdk } from "../sdk";
import { dashboardCredentials } from "../fileModels/dashboardCredentials";

export const getDashboardCredentials = sdk.Action.withoutInput(
  "get-dashboard-credentials",

  async ({ effects }) => ({
    name: "Get Dashboard Credentials",
    description:
      "Show the StartOS-generated Hermes dashboard username and one-time password. Use these to log in to the dashboard, then rotate credentials from inside Hermes when available.",
    warning:
      "This displays a sensitive dashboard password. Only run it from a trusted StartOS admin session.",
    allowedStatuses: "any" as const,
    group: null,
    visibility: "enabled" as const,
  }),

  async ({ effects }) => {
    const credentials = await dashboardCredentials.read().once();
    const value = credentials?.trim()
      ? credentials.trim()
      : "No generated dashboard credentials file exists yet. Start or restart the service after installing this version, or configure dashboard.basic_auth / Dashboard OAuth manually.";

    return {
      version: "1" as const,
      title: "Hermes Dashboard Credentials",
      message:
        "Use these credentials only for the StartOS dashboard login. Rotate them after first login if this is a shared environment.",
      result: {
        type: "single" as const,
        name: "Credentials",
        description: null,
        value,
        masked: true,
        copyable: true,
        qr: false,
      },
    };
  },
);
