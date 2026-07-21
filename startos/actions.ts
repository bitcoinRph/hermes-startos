import { sdk } from "./sdk";
import { getDashboardCredentials } from "./actions/getDashboardCredentials";
import { setOpenAiOAuth } from "./actions/setOpenAiOAuth";

export const actions = sdk.Actions.of()
  .addAction(getDashboardCredentials)
  .addAction(setOpenAiOAuth);
