import { sdk } from "../sdk";
import { actions } from "../actions";
import { restoreInit } from "../backups";
import { initializeService } from "./initializeService";
import { setDependencies } from "../dependencies";
import { setInterfaces } from "../interfaces";
import { versionGraph } from "../versions";

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  setDependencies,
  actions,
  initializeService,
);

export const uninit = sdk.setupUninit(versionGraph);
