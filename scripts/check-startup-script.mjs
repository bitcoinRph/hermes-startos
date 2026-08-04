import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const source = await readFile("startos/main.ts", "utf8");
const match = source.match(
  /const startupScript = `([\s\S]*?)`;\n\nexport const main/,
);

if (!match) {
  console.error("Unable to locate startupScript template in startos/main.ts");
  process.exit(1);
}

const script = match[1]
  .replace(/\\\$\{/g, "${")
  .replace(/\$\{uiPort\}/g, "9119")
  .replace(/\\\\/g, "\\");

const dir = mkdtempSync(join(tmpdir(), "hermes-startos-"));
const path = join(dir, "startup.sh");
writeFileSync(path, script, { mode: 0o755 });

const result = spawnSync("/bin/sh", ["-n", path], {
  encoding: "utf8",
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

console.log("Generated StartOS startup script passes /bin/sh -n");
