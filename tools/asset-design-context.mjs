import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const HELP = `Usage: node tools/asset-design-context.mjs <role> [--state <state>] [--catalog <path>] [--json]

Build a compact, source-redacted texture-generation brief from the local semantic catalog.`;
function argsOf(args) {
  const out = { role: null, state: null, catalog: "workspace/corpus-local/assets.semantic.json", json: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help") return { help: true };
    if (arg === "--json") out.json = true;
    else if (["--state", "--catalog"].includes(arg)) { const value = args[++i]; if (!value) return null; out[arg.slice(2)] = value; }
    else if (!out.role) out.role = arg.toLowerCase(); else return null;
  }
  return out.role ? out : null;
}
function top(entries, count = 8) { return [...entries.entries()].sort((a, b) => b[1] - a[1]).slice(0, count).map(([value, uses]) => ({ value, uses })); }
const add = (map, key) => key != null && map.set(key, (map.get(key) || 0) + 1);
async function main() {
  const options = argsOf(process.argv.slice(2));
  if (!options || options.help) { console.log(HELP); process.exitCode = options ? 0 : 64; return; }
  const catalogPath = resolve(REPO, options.catalog), rel = relative(REPO, catalogPath);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("catalog must stay inside repository");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const matched = catalog.assets.filter((asset) => asset.semantic.roles.includes(options.role) && (!options.state || asset.semantic.state === options.state));
  const assets = [...new Map(matched.map((asset) => [asset.sha256, asset])).values()];
  const sizes = new Map(), colors = new Map(), states = new Map();
  let observed = 0, nineSlice = 0, alpha = 0;
  for (const asset of assets) {
    const weight = asset.confidence === "observed" ? 3 : 1;
    sizes.set(`${asset.dimensions.width}x${asset.dimensions.height}`, (sizes.get(`${asset.dimensions.width}x${asset.dimensions.height}`) || 0) + weight);
    states.set(asset.semantic.state, (states.get(asset.semantic.state) || 0) + weight);
    for (const color of asset.visual?.palette || []) colors.set(color.hex, (colors.get(color.hex) || 0) + weight * Math.max(0.1, color.ratio || 0));
    if (asset.confidence === "observed") observed++; if (asset.nineSlice.present) nineSlice++; if (asset.hasAlpha) alpha++;
  }
  const sourceDiversity = new Set(assets.map((asset) => asset.sourceId)).size;
  const sufficient = assets.length >= 3 && (sourceDiversity >= 2 || observed >= 2);
  const generationPrompt = sufficient ? `Create an original Minecraft Bedrock JSON UI ${options.role} texture${options.state ? ` in ${options.state} state` : ""}. Use the measured size and palette distributions as constraints, preserve crisp pixel edges, transparent padding, and symmetric borders. ${nineSlice ? "Design stretch-safe corners and edges and provide same-stem nine-slice metadata." : "Do not assume nine-slice unless the target layout needs scaling."} Produce original artwork; do not reproduce a catalog source.` : null;
  const report = {
    schema: "mcbe-jsonui-ai-kit/asset-design-context@1", ok: sufficient, role: options.role, state: options.state,
    evidence: { rawMatches: matched.length, uniqueShaMatches: assets.length, sourceDiversity, observedUsage: observed, inferredOnly: assets.length - observed, weighting: "observed=3,inferred=1" },
    patterns: { commonSizes: top(sizes), commonColors: top(colors), states: top(states), alphaRatio: assets.length ? alpha / assets.length : 0, nineSliceRatio: assets.length ? nineSlice / assets.length : 0 },
    generationPrompt,
    unresolved: sufficient ? [] : [{ kind: "insufficient-evidence", required: "at least 3 unique SHA and either 2 sources or 2 observed uses", actual: { uniqueSha: assets.length, sourceDiversity, observed } }],
    policy: { sourcePathsExposed: false, sourceNamesExposed: false, originalArtworkRequired: true, catalogAssetsRedistributed: false }
  };
  console.log(options.json ? JSON.stringify(report, null, 2) : sufficient ? `${report.generationPrompt}\nEvidence: ${assets.length} unique matches, ${observed} observed uses; sizes ${report.patterns.commonSizes.map((item) => item.value).join(", ")}` : `UNRESOLVED: insufficient evidence for role=${options.role}${options.state ? ` state=${options.state}` : ""}; prompt generation blocked.`);
  if (!sufficient) process.exitCode = 2;
}
main().catch((error) => { console.error(JSON.stringify({ ok: false, error: error.message })); process.exit(1); });
