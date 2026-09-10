// Regenerates binary assets (fonts, favicon) from the base64-encoded copies
// checked into scripts/binary-assets/. The GitHub push path available in
// this project's environment carries file content as JSON/text and cannot
// transport raw binary losslessly, so these assets travel as base64 text
// and are decoded back here, mirrored onto the same path under the repo
// root, after every install.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(scriptDir, "binary-assets");
const repoRoot = path.join(scriptDir, "..");

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.endsWith(".base64")) continue;
    const relative = path.relative(assetsDir, full).replace(/\.base64$/, "");
    const outPath = path.join(repoRoot, relative);
    mkdirSync(path.dirname(outPath), { recursive: true });
    const base64 = readFileSync(full, "utf8");
    writeFileSync(outPath, Buffer.from(base64, "base64"));
  }
}

walk(assetsDir);
