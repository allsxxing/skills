// Copy the registry bundle built by tools/registry.py into the app as the offline fallback.
// Live reads fetch the newest bundle from GitHub; this snapshot covers outages.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../registry/bundle.json");
const dest = resolve(here, "../src/data/bundle.json");
mkdirSync(dirname(dest), { recursive: true });

if (existsSync(src)) {
  copyFileSync(src, dest);
  console.log(`bundle: copied ${src}`);
} else {
  writeFileSync(dest, JSON.stringify({ generated: null, platforms: [], skills: {} }));
  console.warn("bundle: registry/bundle.json not found, wrote empty fallback");
}
