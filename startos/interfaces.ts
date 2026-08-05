import { sdk } from "./sdk";
import type { T } from "@start9labs/start-sdk";
import { uiPort } from "./utils";

export const setInterfaces = sdk.setupInterfaces(
  async ({ effects }: { effects: T.Effects }) => {
    const uiMulti = sdk.MultiHost.of(effects, "ui-multi");
    const uiMultiOrigin = await uiMulti.bindPort(uiPort, {
      protocol: "http",
    });

    const ui = sdk.createInterface(effects, {
      name: "Hermes Dashboard",
      id: "ui",
      description: "Hermes web dashboard",
      type: "ui",
      masked: false,
      schemeOverride: null,
      username: null,
      path: "/",
      query: {},
    });

    const uiReceipt = await uiMultiOrigin.export([ui]);
    return [uiReceipt];
  },
);
