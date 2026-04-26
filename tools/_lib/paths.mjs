// tools/_lib/paths.mjs
// Centralized repo-relative path helpers.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "..", "..");

export const PATHS = {
  root: REPO_ROOT,
  agentState: resolve(REPO_ROOT, ".agent", "state"),
  setupState: resolve(REPO_ROOT, ".agent", "state", "setup-state.json"),
  envCheck: resolve(REPO_ROOT, ".agent", "env-check.json"),
  workspace: resolve(REPO_ROOT, "workspace"),
  vanillaIndex: resolve(REPO_ROOT, "vanilla-index"),
  vanillaIndexCache: resolve(REPO_ROOT, "vanilla-index", "cache"),
  vanillaIndexScreens: resolve(REPO_ROOT, "vanilla-index", "screens.json"),
  vanillaIndexTextures: resolve(REPO_ROOT, "vanilla-index", "textures.json"),
  ztechMirror: resolve(REPO_ROOT, "references", "upstreams", "MCBVanillaResourcePack"),
  bedrockSamplesUi: resolve(REPO_ROOT, "references", "official", "bedrock-samples-ui"),
  schemas: resolve(REPO_ROOT, "schemas"),
  irSchema: resolve(REPO_ROOT, "schemas", "ir.schema.json"),
  data: resolve(REPO_ROOT, "data"),
  jsonuiSpec: resolve(REPO_ROOT, "data", "jsonui-spec.json"),
  presetsCatalog: resolve(REPO_ROOT, "data", "presets-catalog.json"),
  packageJson: resolve(REPO_ROOT, "package.json"),
  nodeModules: resolve(REPO_ROOT, "node_modules"),
};
