import { VersionGraph } from "@start9labs/start-sdk";
import { v_0_1_0_0 } from "./v0.1.0_0";
import { v_0_1_1_0 } from "./v0.1.1_0";
import { v_0_1_2_0 } from "./v0.1.2_0";
import { v_0_1_3_0 } from "./v0.1.3_0";
import { v_0_1_4_0 } from "./v0.1.4_0";
import { v_0_1_5_0 } from "./v0.1.5_0";

export const versionGraph = VersionGraph.of({
  current: v_0_1_5_0,
  other: [v_0_1_0_0, v_0_1_1_0, v_0_1_2_0, v_0_1_3_0, v_0_1_4_0],
});