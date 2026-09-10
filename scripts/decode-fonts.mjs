// Regenerates the PP Neue Montreal .otf binaries from the base64-encoded
// copies checked into scripts/font-assets/. The GitHub API path used to
// push this repository cannot transport raw binary content losslessly, so
// the fonts travel as base64 text and are decoded back here after install.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(scriptDir, "font-assets");
const outDir = path.join(scriptDir, "..", "src", "fonts");

mkdirSync(outDir, { recursive: true });

for (const file of readdirSync(srcDir)) {
  if (!file.endsWith(".base64")) continue;
  const outName = file.replace(/\.base64$/, "");
  const base64 = readFileSync(path.join(srcDir, file), "utf8");
  writeFileSync(path.join(outDir, outName), Buffer.from(base64, "base64"));
}
