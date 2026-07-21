import { FileHelper } from "@start9labs/start-sdk";
import { sdk } from "../sdk";

export const dashboardCredentials = FileHelper.string({
  base: sdk.volumes.main,
  subpath: "dashboard-credentials.txt",
});
