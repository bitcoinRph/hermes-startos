import { sdk } from "./sdk";

export const setDependencies = sdk.setupDependencies(async () => ({
  // No StartOS service dependencies in the first-pass scaffold.
}));
