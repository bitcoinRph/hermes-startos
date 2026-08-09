import { sdk } from "./sdk";
import { getDashboardCredentials } from "./actions/getDashboardCredentials";
import { loginToOs } from "./actions/loginToOs";
import { revokeStartOsAccess } from "./actions/revokeStartOsAccess";
import { setOpenAiOAuth } from "./actions/setOpenAiOAuth";

export const actions = sdk.Actions.of()
  .addAction(getDashboardCredentials)
  .addAction(setOpenAiOAuth)
  .addAction(loginToOs)
  .addAction(revokeStartOsAccess);
