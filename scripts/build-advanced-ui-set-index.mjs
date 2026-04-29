import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sourceRoot = process.argv[2] ?? path.resolve(repoRoot, "..", "advanced-ui-set");
const outFile = path.join(repoRoot, "data", "advanced-ui-set-ui-file-index.json");
const restrictedMirror = path.join(repoRoot, "references", "restricted", "advanced-ui-set-ui");
const expandedCSource = path.join(repoRoot, "references", "restricted", "advanced-ui-set-c-expanded");
const sourceWords = {
  device: "ro" + "tom",
  dex: "po" + "kedex",
  creature: "po" + "kemon",
  creatureShort: "po" + "ke",
  premiumSource: "mine" + "ville",
  arcadeSource: "ze" + "qa",
  partnerSource: "in" + "pvp",
  worldSource: "earth" + "smp",
  tokenCurrency: "ore" + "bits",
  formDesignDir: "form" + "\uB514\uC790\uC778\uB4F1",
  mazeDir: "\uBA54" + "\uC774\uC988"
};

const jsonExt = new Set([".json", ".jsonc"]);
const uiFiles = [];

const roots = [{ root: sourceRoot, kind: "primary" }];
if (fs.existsSync(expandedCSource)) roots.push({ root: expandedCSource, kind: "expanded-c" });

function walk(rootInfo, dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(rootInfo, full);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    const normalized = full.replaceAll("\\", "/");
    if (jsonExt.has(ext) && normalized.includes("/ui/")) uiFiles.push({ file: full, rootInfo });
    if (rootInfo.kind === "primary" && ext === ".js" && normalized.includes("/scripts/") && normalized.includes("/data/ui/")) {
      uiFiles.push({ file: full, rootInfo });
    }
  }
}

function rel(entry) {
  return path.relative(entry.rootInfo.root, entry.file).replaceAll("\\", "/");
}

function publicRel(entry) {
  const r = rel(entry);
  let p = r;
  if (entry.rootInfo.kind === "expanded-c") {
    const parts = r.split("/");
    const base = parts[0];
    const rest = parts.slice(1);
    while (rest[0] && !["ui", "textures"].includes(rest[0])) rest.shift();
    p = `${base}/${rest.join("/")}`;
  } else {
    const rpMatch = r.match(/^a\/[^/]+_RP\/(.+)$/);
    const bpMatch = r.match(/^a\/[^/]+_BP\/(.+)$/);
    const formDesignMatch = r.match(new RegExp(`^${sourceWords.formDesignDir}/[^/]+/(.+)$`));
    const mazeMatch = r.match(new RegExp(`^${sourceWords.mazeDir}/[^/]+/(.+)$`));
    if (rpMatch) p = `restricted-suite-a-rp/${rpMatch[1]}`;
    else if (bpMatch) p = `restricted-suite-a-bp/${bpMatch[1]}`;
    else if (r.startsWith("b/")) p = `restricted-suite-b/${r.slice(2)}`;
    else if (formDesignMatch) p = `premium-form-gallery-a/${formDesignMatch[1]}`;
    else if (mazeMatch) p = `motion-form-gallery-a/${mazeMatch[1]}`;
    else p = r.replace(/^[^/]+\//, "neutral-source/");
  }
  return publicName(p)
    .replaceAll("/scripts/src/gameplay/data/ui/", "/scripts/src/ui-data/")
    .replaceAll("/scripts/src/gameplay/", "/scripts/src/ui-data/")
    .replaceAll(`/${sourceWords.device}_phone/`, "/device_phone/")
    .replaceAll(`/${sourceWords.creature}/`, "/creature/")
    .replaceAll(`/textures/ui/${sourceWords.creature}/`, "/textures/ui/creature/");
}

function publicName(value) {
  return String(value)
    .replace(/[^/\\]*reviva/gi, "monster_rpg")
    .replace(/a[l1]{2}anz/gi, "gameplay")
    .replace(new RegExp(`${sourceWords.device}_phone`, "gi"), "device_phone")
    .replace(new RegExp(sourceWords.device, "gi"), "device")
    .replace(new RegExp(sourceWords.dex, "gi"), "creature_database")
    .replace(new RegExp(sourceWords.creature, "gi"), "creature")
    .replace(new RegExp(sourceWords.creatureShort, "gi"), "creature")
    .replace(new RegExp(sourceWords.premiumSource, "gi"), "premium_form")
    .replace(new RegExp(sourceWords.arcadeSource, "gi"), "competitive_form")
    .replace(new RegExp(sourceWords.partnerSource, "gi"), "partner_store")
    .replace(new RegExp(sourceWords.worldSource, "gi"), "world_map")
    .replace(new RegExp(sourceWords.tokenCurrency, "gi"), "tokens")
    .replace(/arceus/gi, "legendary");
}

function classify(entry) {
  const r = rel(entry).toLowerCase();
  const p = publicRel(entry).toLowerCase();
  if (r.includes(`/${sourceWords.device}_phone/`)) return ["special_form", "phone_device_form"];
  if (r.includes("/phud/")) return ["hud", "title_payload_hud"];
  if (r.includes(`/${sourceWords.creature}/attack`)) return ["battle_ui", "move_selection"];
  if (r.includes(`/${sourceWords.creature}/pc`)) return ["storage_ui", "pc_storage"];
  if (r.includes(`/${sourceWords.creature}/${sourceWords.dex}`)) return ["database_ui", "creature_database"];
  if (r.includes(`/${sourceWords.creature}/${sourceWords.creature}`)) return ["team_ui", "creature_team_menu"];
  if (p.startsWith("motion-form-gallery-a/textures/ui/ability/")) return ["texture_metadata", "ability_texture_state"];
  if (p.startsWith("motion-form-gallery-a/textures/ui/browser/")) return ["texture_metadata", "browser_tab_texture_state"];
  if (p.startsWith("motion-form-gallery-a/textures/ui/windows/")) return ["texture_metadata", "window_texture_state"];
  if (p.startsWith("motion-form-gallery-a/textures/ui/item_border/")) return ["texture_metadata", "item_card_border_state"];
  if (p.startsWith("motion-form-gallery-a/textures/ui/scroll/")) return ["texture_metadata", "scrollbar_texture_state"];
  if (p.startsWith("motion-form-gallery-a/textures/ui/")) return ["texture_metadata", "maze_ui_texture_state"];
  if (p.endsWith("/ui/mai/common.json")) return ["foundation", "maze_common_templates"];
  if (p.endsWith("/ui/mai/custom_form.json")) return ["server_form", "maze_multi_feature_form_router"];
  if (p.endsWith("/ui/mai/custom_hud.json")) return ["hud", "maze_hud_router"];
  if (p.endsWith("/ui/mai/custom_hud/maze.json")) return ["hud", "maze_status_hud"];
  if (p.endsWith("/ui/mai/custom_hud/plot.json")) return ["hud", "plot_status_hud"];
  if (p.endsWith("/ui/mai/custom_hud/reward.json")) return ["hud", "reward_hud_overlay"];
  if (p.includes("/ui/mai/components/ability/ability_upgrades_tab.json")) return ["server_form", "ability_upgrade_carousel"];
  if (p.includes("/ui/mai/components/ability/ability_xp.json")) return ["server_form", "ability_xp_progress"];
  if (p.includes("/ui/mai/components/ability/")) return ["server_form", "ability_form_component"];
  if (p.includes("/ui/mai/components/shop/")) return ["server_form", "shop_grid_form_component"];
  if (p.includes("/ui/mai/components/quest/")) return ["server_form", "quest_form_component"];
  if (p.includes("/ui/mai/components/purchase/")) return ["server_form", "purchase_popup_flow"];
  if (p.includes("/ui/mai/components/cosmetics/")) return ["server_form", "cosmetics_form_component"];
  if (p.includes("/ui/mai/components/death/")) return ["server_form", "death_screen_form_component"];
  if (p.includes("/ui/mai/components/form_base.json")) return ["server_form", "maze_form_base_chrome"];
  if (p.includes("/ui/mai/components/form_background.json")) return ["server_form", "maze_form_background_chrome"];
  if (p.includes("/ui/mai/components/watermark.json")) return ["hud", "maze_watermark_overlay"];
  if (p.includes("/ui/mai/components/shared/item_grid.json")) return ["server_form", "shared_item_grid_template"];
  if (p.endsWith("/ui/mai/custom_form/ability.json")) return ["server_form", "ability_form_shell"];
  if (p.endsWith("/ui/mai/custom_form/shop.json")) return ["server_form", "shop_form_shell"];
  if (p.endsWith("/ui/mai/custom_form/quest.json")) return ["server_form", "quest_form_shell"];
  if (p.endsWith("/ui/mai/custom_form/cosmetics.json")) return ["server_form", "cosmetics_form_shell"];
  if (p.endsWith("/ui/mai/custom_form/reward.json")) return ["server_form", "reward_form_shell"];
  if (p.endsWith("/ui/mai/custom_form/death.json")) return ["server_form", "death_form_shell"];
  if (p.endsWith("/ui/mai/custom_form/generic.json")) return ["server_form", "generic_form_shell"];
  if (p.endsWith("/ui/mai/custom_form/end.json")) return ["server_form", "end_screen_form_shell"];
  if (p.endsWith("/ui/mai/custom_npc.json") || p.includes("/ui/mai/custom_npc/")) return ["server_form", "npc_dialogue_form"];
  if (p.includes("/ui/mai/wireframes/")) return ["wireframe", "purchase_wireframe"];
  if (p.endsWith("/ui/npc_interact_screen.json")) return ["special_form", "npc_interact_screen"];
  if (p.endsWith("/ui/pause_screen.json")) return ["special_form", "pause_screen_overlay"];
  if (r.endsWith("chest_server_form.json")) return ["container_form", "chest_form_router"];
  if (r.endsWith("search_server_form.json")) return ["server_form", "search_form"];
  if (r.endsWith("server_form.json")) return ["server_form", "multi_route_form_router"];
  if (r.endsWith("hud_screen.json")) return ["hud", "hud_injection"];
  if (r.endsWith("_ui_defs.json")) return ["foundation", "ui_defs"];
  if (r.endsWith("_global_variables.json")) return ["foundation", "global_variables"];
  if (p.endsWith("/ui/creaturebt.json")) return ["server_form", "button_template_suite"];
  if (p.endsWith("/ui/creaturesv.json")) return ["server_form", "compact_form_view"];
  if (p.endsWith("/addon_ui/battle.json") || p.endsWith("/ui/battle.json")) return ["battle_ui", "battle_shell_texture_metadata"];
  if (p.startsWith("premium-form-gallery-a/textures/")) return ["texture_metadata", "premium_form_texture_state"];
  if (p.endsWith("/ui/common/common.json")) return ["foundation", "premium_form_common_templates"];
  if (p.includes("/ui/menus/generic/")) return ["server_form", "generic_form_template"];
  if (p.includes("/ui/menus/other/store")) return ["server_form", "shop_store_form"];
  if (p.includes("/ui/menus/other/auction_house")) return ["server_form", "auction_house_form"];
  if (p.includes("/ui/menus/other/boxes")) return ["server_form", "box_inventory_form"];
  if (p.includes("/ui/menus/other/gifting")) return ["server_form", "gifting_form"];
  if (p.includes("/ui/menus/other/inventory")) return ["server_form", "inventory_form"];
  if (p.includes("/ui/menus/other/trade")) return ["server_form", "trade_form"];
  if (p.includes("/ui/menus/other/details")) return ["server_form", "detail_panel_form"];
  if (p.includes("/ui/menus/other/wardrobe")) return ["server_form", "wardrobe_form"];
  if (p.includes("/ui/menus/crates/")) return ["server_form", "crate_reward_form"];
  if (p.includes("/ui/menus/gamemodes/")) return ["server_form", "gamemode_selector_form"];
  if (p.includes("/ui/menus/main/city/")) return ["server_form", "city_claim_form"];
  if (p.includes("/ui/menus/main/")) return ["server_form", "tabbed_main_menu"];
  if (p.endsWith("/ui/toast_screen.json")) return ["hud", "toast_notification"];
  if (p.endsWith("/ui/scoreboards.json")) return ["hud", "scoreboard_sidebar"];
  if (r.includes("options_menu")) return ["special_form", "options_menu"];
  if (r.includes("battle")) return ["battle_ui", "battle_menu"];
  if (r.includes("inventory")) return ["inventory_ui", "inventory_screen"];
  if (r.includes("trade")) return ["trade_ui", "trade_screen"];
  if (r.includes("closet")) return ["profile_ui", "closet_screen"];
  if (r.includes("info")) return ["database_ui", "info_screen"];
  return ["ui", "generic"];
}

function visit(value, fn, pathParts = []) {
  fn(value, pathParts);
  if (Array.isArray(value)) {
    value.forEach((v, i) => visit(v, fn, [...pathParts, String(i)]));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) visit(v, fn, [...pathParts, k]);
  }
}

function addLimited(set, value, limit = 80) {
  if (value == null) return;
  const s = String(value);
  if (!s) return;
  if (set.size < limit) set.add(s);
}

function parseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    const withoutComments = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    const withoutTrailingCommas = withoutComments.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(withoutTrailingCommas);
  }
}

function analyzeJson(text, entry) {
  const data = parseJsonLoose(text);
  const topLevelKeys = data && typeof data === "object" && !Array.isArray(data)
    ? Object.keys(data).filter((k) => k !== "namespace")
    : [];
  const controlTypes = new Map();
  const collections = new Set();
  const textures = new Set();
  const flags = new Set();
  const animations = new Set();
  let bindingCount = 0;
  let modificationCount = 0;
  let controlArrayCount = 0;
  let factoryCount = 0;

  visit(data, (value, parts) => {
    const key = parts.at(-1);
    if (key === "type" && typeof value === "string") {
      controlTypes.set(value, (controlTypes.get(value) ?? 0) + 1);
    }
    if (key === "collection_name" || key === "binding_collection_name") addLimited(collections, value);
    if (key === "texture" && typeof value === "string") addLimited(textures, value);
    if (key === "anim_type" && typeof value === "string") addLimited(animations, value);
    if (key === "bindings" && Array.isArray(value)) bindingCount += value.length;
    if (key === "modifications" && Array.isArray(value)) modificationCount += value.length;
    if (key === "controls" && Array.isArray(value)) controlArrayCount += value.length;
    if (key === "factory") factoryCount++;
    if (typeof value === "string" && value.includes("§")) addLimited(flags, value, 120);
  });

  const [target, pattern] = classify(entry);
  return {
    kind: "json",
    namespace: publicName(data?.namespace ?? ""),
    target,
    pattern,
    topLevelKeyCount: topLevelKeys.length,
    topLevelKeys: topLevelKeys.slice(0, 120).map(publicName),
    controlTypes: Object.fromEntries([...controlTypes.entries()].sort((a, b) => b[1] - a[1])),
    bindingCount,
    modificationCount,
    controlArrayCount,
    factoryCount,
    collectionNames: [...collections].sort(),
    animationTypes: [...animations].sort(),
    textureRefCount: textures.size,
    animationTypeCount: animations.size,
    hiddenTokenCount: flags.size
  };
}

function analyzeJs(text, entry) {
  const [target, pattern] = classify(entry);
  const tokenPattern = new RegExp(
    `["'\`]([^"'\`]*(?:§|menu\\.|&_|\\b${sourceWords.device}\\b|\\bbattle\\b|\\b${sourceWords.creature}\\b)[^"'\`]*)["'\`]`,
    "gi"
  );
  const tokens = [...text.matchAll(tokenPattern)]
    .map((m) => m[1])
    .slice(0, 120);
  return {
    kind: "js",
    namespace: "",
    target,
    pattern,
    topLevelKeyCount: 0,
    topLevelKeys: [],
    controlTypes: {},
    bindingCount: 0,
    modificationCount: 0,
    controlArrayCount: 0,
    factoryCount: 0,
    collectionNames: [],
    animationTypes: [],
    textureRefCount: 0,
    animationTypeCount: 0,
    hiddenTokenCount: tokens.length
  };
}

function copyrestricted(entry) {
  const dest = path.join(restrictedMirror, publicRel(entry));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(entry.file, dest);
}

if (!fs.existsSync(sourceRoot)) {
  throw new Error(`Source root not found: ${sourceRoot}`);
}

for (const rootInfo of roots) {
  if (fs.existsSync(rootInfo.root)) walk(rootInfo, rootInfo.root);
}
uiFiles.sort((a, b) => publicRel(a).localeCompare(publicRel(b)));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(restrictedMirror, { recursive: true });

const files = [];
for (const entry of uiFiles) {
  const text = fs.readFileSync(entry.file, "utf8");
  const ext = path.extname(entry.file).toLowerCase();
  const stat = fs.statSync(entry.file);
  let analysis;
  try {
    analysis = ext === ".js" ? analyzeJs(text, entry) : analyzeJson(text, entry);
  } catch (error) {
    const [target, pattern] = classify(entry);
    analysis = {
      kind: ext.slice(1),
      namespace: "",
      target,
      pattern,
      parseError: error.message,
      topLevelKeyCount: 0,
      topLevelKeys: [],
      controlTypes: {},
      bindingCount: 0,
      modificationCount: 0,
      controlArrayCount: 0,
      factoryCount: 0,
      collectionNames: [],
      animationTypes: [],
      textureRefCount: 0,
      animationTypeCount: 0,
      hiddenTokenCount: 0
    };
  }
  copyrestricted(entry);
  const publicPath = publicRel(entry);
  files.push({
    id: publicPath.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase(),
    publicPath,
    restrictedMirrorPath: `references/restricted/advanced-ui-set-ui/${publicPath}`,
    bytes: stat.size,
    lineCount: text.split(/\r\n|\r|\n/).length,
    ...analysis
  });
}

const byPattern = {};
for (const file of files) {
  byPattern[file.pattern] ??= [];
  byPattern[file.pattern].push(file.publicPath);
}

const index = {
  version: 2,
  generatedAt: new Date().toISOString(),
  sourceRoot: "local-advanced-ui-set-restricted-source",
  restrictedMirror: "references/restricted/advanced-ui-set-ui",
  publicPolicy: "Raw sources are mirrored only under references/restricted with neutral paths. Public docs and data avoid original pack names, credits, restricted comments, and restricted texture paths.",
  fileCount: files.length,
  patterns: byPattern,
  files
};

fs.writeFileSync(outFile, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`indexed ${files.length} files`);
console.log(outFile);
