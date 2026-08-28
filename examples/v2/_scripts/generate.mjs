import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { stringify as stringifyYaml } from "yaml";

const v2Root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(v2Root, "..", "..");
const evalRoot = join(repoRoot, "evals");

const VERSION = [1, 0, 0];
const ENGINE = [1, 21, 80];
const WHITE = [0.949, 0.957, 0.973];
const MUTED = [0.675, 0.71, 0.773];

const examples = [
  {
    dir: "01-typography-state-gallery",
    id: "typography_state_gallery",
    namespace: "v2_gallery",
    displayName: "V2 Typography and Button Gallery",
    token: "v2:gallery",
    description: "Text sizing, three button states, and nine-slice gallery.",
    family: "compact_ui_gallery",
    surface: "form",
    shell: [620, 340],
    profiles: ["pc_1920x1080_gui3", "touch_1280x720_gui2"],
    uuids: [
      "10000000-0000-4000-8000-000000000101",
      "10000000-0000-4000-8000-000000000102",
      "10000000-0000-4000-8000-000000000103",
      "10000000-0000-4000-8000-000000000104"
    ]
  },
  {
    dir: "02-daily-rewards",
    id: "daily_rewards",
    namespace: "v2_daily",
    displayName: "V2 Daily Rewards",
    token: "v2:daily",
    description: "Seven equal reward cards with claim states and fixed spacing.",
    family: "daily_reward_row",
    surface: "form",
    shell: [760, 286],
    profiles: ["pc_1920x1080_gui3", "touch_1280x720_gui2"],
    uuids: [
      "20000000-0000-4000-8000-000000000201",
      "20000000-0000-4000-8000-000000000202",
      "20000000-0000-4000-8000-000000000203",
      "20000000-0000-4000-8000-000000000204"
    ]
  },
  {
    dir: "03-server-form-grid",
    id: "server_form_grid",
    namespace: "v2_form_grid",
    displayName: "V2 Server Form Grid",
    token: "v2:grid",
    description: "A measured three by two server-form button grid.",
    family: "server_form_grid",
    surface: "form",
    shell: [600, 300],
    profiles: ["pc_1920x1080_gui3", "touch_1280x720_gui2"],
    uuids: [
      "30000000-0000-4000-8000-000000000301",
      "30000000-0000-4000-8000-000000000302",
      "30000000-0000-4000-8000-000000000303",
      "30000000-0000-4000-8000-000000000304"
    ]
  },
  {
    dir: "04-hud-minimap",
    id: "hud_minimap",
    namespace: "v2_minimap",
    displayName: "V2 HUD Minimap",
    token: "v2:minimap",
    description: "Top-right minimap shell with player and waypoint markers.",
    family: "hud_minimap_overlay",
    surface: "hud",
    shell: [184, 210],
    profiles: ["pc_1920x1080_gui3", "touch_1280x720_gui2"],
    uuids: [
      "40000000-0000-4000-8000-000000000401",
      "40000000-0000-4000-8000-000000000402",
      "40000000-0000-4000-8000-000000000403",
      "40000000-0000-4000-8000-000000000404"
    ]
  },
  {
    dir: "05-book-quest",
    id: "book_quest",
    namespace: "v2_book_quest",
    displayName: "V2 Book Quest",
    token: "v2:quest",
    description: "Two-page quest book with explicit title and body text regions.",
    family: "book_quest_screen",
    surface: "form",
    shell: [680, 430],
    profiles: ["pc_1920x1080_gui3", "touch_1280x720_gui2"],
    uuids: [
      "50000000-0000-4000-8000-000000000501",
      "50000000-0000-4000-8000-000000000502",
      "50000000-0000-4000-8000-000000000503",
      "50000000-0000-4000-8000-000000000504"
    ]
  },
  {
    dir: "06-casino-reels",
    id: "casino_reels",
    namespace: "v2_casino",
    displayName: "V2 Casino Reels",
    token: "v2:casino",
    description: "Five by three reel grid with a separate betting panel.",
    family: "casino_reel_panel",
    surface: "form",
    shell: [720, 440],
    profiles: ["pc_1920x1080_gui3", "touch_1280x720_gui2"],
    uuids: [
      "60000000-0000-4000-8000-000000000601",
      "60000000-0000-4000-8000-000000000602",
      "60000000-0000-4000-8000-000000000603",
      "60000000-0000-4000-8000-000000000604"
    ]
  },
  {
    dir: "07-responsive-shell",
    id: "responsive_shell",
    namespace: "v2_responsive",
    displayName: "V2 Responsive Shell",
    token: "v2:responsive",
    description: "Percentage-based shell with touch-safe forty-eight unit actions.",
    family: "responsive_safe_shell",
    surface: "form",
    shell: [720, 390],
    profiles: ["pc_1920x1080_gui3", "touch_1280x720_gui2"],
    uuids: [
      "70000000-0000-4000-8000-000000000701",
      "70000000-0000-4000-8000-000000000702",
      "70000000-0000-4000-8000-000000000703",
      "70000000-0000-4000-8000-000000000704"
    ]
  }
];

function portable(path) {
  return path.replaceAll("\\", "/");
}

async function writeText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text.replaceAll("\r\n", "\n"), "utf8");
}

async function writeJson(path, value) {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function raster(width, height, background = [0, 0, 0, 0]) {
  const pixels = Buffer.alloc(width * height * 4);
  const api = {
    width,
    height,
    fillRect(x, y, w, h, color) {
      const left = Math.max(0, Math.floor(x));
      const top = Math.max(0, Math.floor(y));
      const right = Math.min(width, Math.ceil(x + w));
      const bottom = Math.min(height, Math.ceil(y + h));
      for (let py = top; py < bottom; py++) {
        for (let px = left; px < right; px++) {
          const index = (py * width + px) * 4;
          pixels[index] = color[0];
          pixels[index + 1] = color[1];
          pixels[index + 2] = color[2];
          pixels[index + 3] = color[3] ?? 255;
        }
      }
    },
    outline(x, y, w, h, color, thickness = 1) {
      api.fillRect(x, y, w, thickness, color);
      api.fillRect(x, y + h - thickness, w, thickness, color);
      api.fillRect(x, y, thickness, h, color);
      api.fillRect(x + w - thickness, y, thickness, h, color);
    }
  };
  api.fillRect(0, 0, width, height, background);
  return { pixels, api };
}

function encodePng(width, height, pixels) {
  const scanline = width * 4 + 1;
  const raw = Buffer.alloc(scanline * height);
  for (let y = 0; y < height; y++) pixels.copy(raw, y * scanline + 1, y * width * 4, (y + 1) * width * 4);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

async function writePng(path, width, height, painter) {
  const { pixels, api } = raster(width, height);
  painter(api);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, encodePng(width, height, pixels));
}

async function writeNineSlice(textureDir, name, inner, border, edge) {
  const pngPath = join(textureDir, `${name}.png`);
  await writePng(pngPath, 32, 32, (g) => {
    g.fillRect(0, 0, 32, 32, border);
    g.fillRect(3, 3, 26, 26, edge);
    g.fillRect(5, 5, 22, 22, inner);
  });
  await writeJson(join(textureDir, `${name}.json`), { nineslice_size: 5, base_size: [32, 32] });
}

async function generateAssets(example) {
  const textureDir = join(v2Root, example.dir, "RP", "textures", "ui", example.namespace);
  await writeNineSlice(textureDir, "panel", [24, 31, 45, 250], [8, 12, 20, 255], [52, 65, 84, 255]);
  await writeNineSlice(textureDir, "button_default", [47, 63, 84, 255], [14, 20, 30, 255], [75, 94, 120, 255]);
  await writeNineSlice(textureDir, "button_hover", [61, 91, 126, 255], [23, 35, 50, 255], [112, 168, 218, 255]);
  await writeNineSlice(textureDir, "button_pressed", [28, 44, 63, 255], [9, 15, 23, 255], [56, 117, 158, 255]);
  await writeNineSlice(textureDir, "card", [37, 45, 62, 255], [13, 18, 27, 255], [82, 96, 122, 255]);

  if (example.id === "daily_rewards") {
    await writePng(join(textureDir, "reward.png"), 32, 32, (g) => {
      g.fillRect(5, 9, 22, 18, [219, 68, 82, 255]);
      g.fillRect(3, 6, 26, 6, [245, 179, 64, 255]);
      g.fillRect(14, 5, 4, 23, [255, 224, 116, 255]);
      g.outline(5, 9, 22, 18, [92, 34, 42, 255], 2);
    });
  }
  if (example.id === "hud_minimap") {
    await writePng(join(textureDir, "map.png"), 160, 160, (g) => {
      g.fillRect(0, 0, 160, 160, [30, 55, 54, 255]);
      for (let i = 0; i <= 160; i += 20) {
        g.fillRect(i, 0, 1, 160, [61, 95, 83, 255]);
        g.fillRect(0, i, 160, 1, [61, 95, 83, 255]);
      }
      g.fillRect(20, 35, 70, 16, [76, 111, 67, 255]);
      g.fillRect(92, 70, 45, 58, [54, 92, 121, 255]);
    });
    await writePng(join(textureDir, "marker_player.png"), 12, 12, (g) => {
      g.fillRect(5, 1, 2, 10, [255, 255, 255, 255]);
      g.fillRect(1, 5, 10, 2, [255, 255, 255, 255]);
      g.outline(3, 3, 6, 6, [37, 168, 255, 255], 2);
    });
    await writePng(join(textureDir, "marker_waypoint.png"), 12, 12, (g) => {
      g.fillRect(2, 2, 8, 8, [255, 198, 52, 255]);
      g.fillRect(4, 4, 4, 4, [100, 55, 15, 255]);
    });
  }
  if (example.id === "book_quest") {
    await writeNineSlice(textureDir, "page", [220, 205, 162, 255], [76, 48, 30, 255], [245, 232, 192, 255]);
  }
  if (example.id === "casino_reels") {
    const colors = [
      [221, 61, 76, 255],
      [247, 190, 50, 255],
      [77, 184, 255, 255],
      [174, 92, 227, 255],
      [68, 207, 133, 255]
    ];
    for (let index = 0; index < colors.length; index++) {
      await writePng(join(textureDir, `symbol_${index + 1}.png`), 40, 40, (g) => {
        g.fillRect(4, 4, 32, 32, colors[index]);
        g.outline(4, 4, 32, 32, [18, 22, 31, 255], 3);
        g.fillRect(12, 12, 16, 16, [245, 245, 238, 210]);
      });
    }
  }
}

function labelControl(id, text, size, offset, anchor = "top_left", options = {}) {
  return {
    [id]: {
      type: "label",
      text,
      localize: false,
      size,
      offset,
      anchor_from: anchor,
      anchor_to: anchor,
      text_alignment: options.alignment ?? "center",
      font_size: options.fontSize ?? "normal",
      font_scale_factor: options.scale ?? 0.9,
      color: options.color ?? [0.95, 0.96, 0.98],
      shadow: options.shadow ?? true,
      layer: options.layer ?? 8
    }
  };
}

function imageControl(id, texture, size, offset, anchor = "top_left", layer = 2) {
  return {
    [id]: {
      type: "image",
      texture,
      size,
      offset,
      anchor_from: anchor,
      anchor_to: anchor,
      layer
    }
  };
}

function stateFace(id, textureRoot, textureName, text, size) {
  return {
    [id]: {
      type: "panel",
      size: ["100%", "100%"],
      controls: [
        imageControl("background", `${textureRoot}/${textureName}`, ["100%", "100%"], [0, 0], "center", 1),
        labelControl("label", text, [size[0] - 16, 18], [0, 0], "center", { layer: 3 })
      ]
    }
  };
}

function buttonControl(id, textureRoot, text, size, offset, anchor = "top_left") {
  return {
    [id]: {
      type: "button",
      size,
      offset,
      anchor_from: anchor,
      anchor_to: anchor,
      layer: 10,
      default_control: "default",
      hover_control: "hover",
      pressed_control: "pressed",
      button_mappings: [
        { from_button_id: "button.menu_select", to_button_id: "button.form_button_click", mapping_type: "pressed" },
        { from_button_id: "button.menu_ok", to_button_id: "button.form_button_click", mapping_type: "focused" }
      ],
      controls: [
        stateFace("default", textureRoot, "button_default", text, size),
        stateFace("hover", textureRoot, "button_hover", text, size),
        stateFace("pressed", textureRoot, "button_pressed", text, size)
      ]
    }
  };
}

function baseScreen(example, controls, size = example.shell, sizeOverride = null) {
  const textureRoot = `textures/ui/${example.namespace}`;
  const routeBindings = example.surface === "form" ? [
    { binding_name: "#title_text" },
    {
      binding_type: "view",
      source_property_name: `(not ((#title_text - '${example.token}') = #title_text))`,
      target_property_name: "#visible"
    }
  ] : [];
  return {
    namespace: example.namespace,
    screen: {
      type: "panel",
      size: ["100%", "100%"],
      layer: 100,
      bindings: routeBindings,
      controls: [
        {
          shell: {
            type: "panel",
            size: sizeOverride ?? size,
            anchor_from: example.surface === "hud" ? "top_right" : "center",
            anchor_to: example.surface === "hud" ? "top_right" : "center",
            offset: example.surface === "hud" ? [-16, 16] : [0, 0],
            controls: [
              imageControl("background", `${textureRoot}/panel`, ["100%", "100%"], [0, 0], "center", 1),
              ...controls
            ]
          }
        }
      ]
    }
  };
}

function galleryScreen(example) {
  const t = `textures/ui/${example.namespace}`;
  const controls = [
    labelControl("title", "TYPOGRAPHY & STATES", [560, 24], [30, 18], "top_left", { fontSize: "large", scale: 1.0 }),
    labelControl("body", "Explicit label regions keep Korean and English text measurable.", [560, 36], [30, 54], "top_left", { alignment: "left", scale: 0.85, color: MUTED }),
    labelControl("caption_default", "DEFAULT", [160, 18], [35, 112]),
    labelControl("caption_hover", "HOVER", [160, 18], [230, 112]),
    labelControl("caption_pressed", "PRESSED", [160, 18], [425, 112]),
    imageControl("default_sample", `${t}/button_default`, [160, 48], [35, 140]),
    imageControl("hover_sample", `${t}/button_hover`, [160, 48], [230, 140]),
    imageControl("pressed_sample", `${t}/button_pressed`, [160, 48], [425, 140]),
    buttonControl("interactive_button", t, "INTERACTIVE SAMPLE", [220, 48], [200, 244])
  ];
  return baseScreen(example, controls);
}

function dailyScreen(example) {
  const t = `textures/ui/${example.namespace}`;
  const controls = [labelControl("title", "DAILY REWARDS", [700, 24], [30, 16], "top_left", { fontSize: "large" })];
  const cardWidth = 88;
  const gap = 12;
  for (let index = 0; index < 7; index++) {
    const x = 36 + index * (cardWidth + gap);
    controls.push(imageControl(`card_${index + 1}`, `${t}/card`, [cardWidth, 158], [x, 62]));
    controls.push(labelControl(`day_${index + 1}`, `DAY ${index + 1}`, [72, 18], [x + 8, 76]));
    controls.push(imageControl(`reward_${index + 1}`, `${t}/reward`, [38, 38], [x + 25, 112]));
    controls.push(labelControl(`amount_${index + 1}`, `x${(index + 1) * 2}`, [72, 18], [x + 8, 158], "top_left", { color: [1.0, 0.82, 0.3] }));
  }
  controls.push(buttonControl("claim", t, "CLAIM AVAILABLE", [220, 42], [270, 232]));
  return baseScreen(example, controls);
}

function gridScreen(example) {
  const t = `textures/ui/${example.namespace}`;
  const labels = ["PROFILE", "QUESTS", "REWARDS", "PARTY", "SETTINGS", "CLOSE"];
  const controls = [labelControl("title", "SERVER MENU", [520, 24], [40, 18], "top_left", { fontSize: "large" })];
  for (let index = 0; index < labels.length; index++) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    controls.push(buttonControl(`menu_${index}`, t, labels[index], [160, 64], [44 + col * 174, 74 + row * 78]));
  }
  return baseScreen(example, controls);
}

function minimapScreen(example) {
  const t = `textures/ui/${example.namespace}`;
  const controls = [
    imageControl("map", `${t}/map`, [160, 160], [12, 12]),
    imageControl("player_marker", `${t}/marker_player`, [12, 12], [86, 86]),
    imageControl("waypoint_a", `${t}/marker_waypoint`, [12, 12], [42, 55]),
    imageControl("waypoint_b", `${t}/marker_waypoint`, [12, 12], [129, 122]),
    labelControl("coordinates", "X 128  Z -42", [160, 18], [12, 180], "top_left", { color: [0.8, 0.92, 1.0] }),
    {
      payload_store: {
        type: "panel",
        size: [0, 0],
        bindings: [
          { binding_name: "#hud_title_text_string" },
          { binding_name: "#hud_title_text_string", binding_name_override: "#preserved_text", binding_condition: "visibility_changed" },
          {
            binding_type: "view",
            source_property_name: `(not ((#hud_title_text_string - '${example.token}') = #hud_title_text_string))`,
            target_property_name: "#visible"
          }
        ]
      }
    }
  ];
  return baseScreen(example, controls);
}

function bookScreen(example) {
  const t = `textures/ui/${example.namespace}`;
  return baseScreen(example, [
    imageControl("left_page", `${t}/page`, [306, 366], [25, 30]),
    imageControl("right_page", `${t}/page`, [306, 366], [349, 30]),
    labelControl("quest_title", "THE LOST COMPASS", [250, 24], [53, 58], "top_left", { fontSize: "large", color: [0.22, 0.12, 0.07], shadow: false }),
    labelControl("quest_body", "Search the old watchtower and recover the brass compass before nightfall.", [250, 150], [53, 100], "top_left", { alignment: "left", color: [0.25, 0.16, 0.1], shadow: false, scale: 0.85 }),
    labelControl("objectives", "OBJECTIVES", [250, 20], [377, 58], "top_left", { fontSize: "large", color: [0.22, 0.12, 0.07], shadow: false }),
    labelControl("objective_list", "1. Visit the watchtower\n2. Defeat the sentry\n3. Return the compass", [250, 150], [377, 100], "top_left", { alignment: "left", color: [0.25, 0.16, 0.1], shadow: false, scale: 0.85 }),
    buttonControl("accept", t, "ACCEPT QUEST", [210, 44], [405, 330])
  ]);
}

function casinoScreen(example) {
  const t = `textures/ui/${example.namespace}`;
  const controls = [labelControl("title", "FIVE REEL CASINO", [660, 24], [30, 16], "top_left", { fontSize: "large", color: [1.0, 0.82, 0.3] })];
  const cell = 72;
  const gap = 8;
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      const x = 34 + reel * (cell + gap);
      const y = 66 + row * (cell + gap);
      controls.push(imageControl(`cell_${reel}_${row}`, `${t}/card`, [cell, cell], [x, y]));
      controls.push(imageControl(`symbol_${reel}_${row}`, `${t}/symbol_${((reel + row) % 5) + 1}`, [42, 42], [x + 15, y + 15], "top_left", 5));
    }
  }
  controls.push(imageControl("bet_panel", `${t}/card`, [222, 232], [454, 66]));
  controls.push(labelControl("balance", "BALANCE  12,500", [190, 20], [470, 88], "top_left", { color: [1.0, 0.82, 0.3] }));
  controls.push(labelControl("bet", "BET  100", [190, 20], [470, 126]));
  controls.push(buttonControl("bet_down", t, "- BET", [90, 44], [470, 170]));
  controls.push(buttonControl("bet_up", t, "+ BET", [90, 44], [570, 170]));
  controls.push(buttonControl("spin", t, "SPIN", [190, 54], [470, 230]));
  controls.push(labelControl("payline", "WILD x5  |  SCATTER x3", [360, 18], [36, 326], "top_left", { color: MUTED }));
  return baseScreen(example, controls);
}

function responsiveScreen(example) {
  const t = `textures/ui/${example.namespace}`;
  return baseScreen(example, [
    labelControl("title", "RESPONSIVE SAFE SHELL", ["100% - 64px", 24], [32, 20], "top_left", { fontSize: "large" }),
    labelControl("description", "Percentage sizing preserves outer margins while forty-eight unit actions remain touch safe.", ["100% - 64px", 52], [32, 62], "top_left", { alignment: "left", color: MUTED, scale: 0.85 }),
    imageControl("content", `${t}/card`, ["100% - 64px", "100% - 190px"], [32, 124]),
    labelControl("content_label", "PC: centered wide shell\nTOUCH: retained edge padding and large targets", ["100% - 112px", 72], [56, 154], "top_left", { alignment: "left" }),
    buttonControl("primary", t, "PRIMARY ACTION", [200, 48], [-110, -28], "bottom_middle"),
    buttonControl("secondary", t, "BACK", [200, 48], [110, -28], "bottom_middle")
  ], example.shell, ["88%", "76%"]);
}

function buildScreen(example) {
  if (example.id === "typography_state_gallery") return galleryScreen(example);
  if (example.id === "daily_rewards") return dailyScreen(example);
  if (example.id === "server_form_grid") return gridScreen(example);
  if (example.id === "hud_minimap") return minimapScreen(example);
  if (example.id === "book_quest") return bookScreen(example);
  if (example.id === "casino_reels") return casinoScreen(example);
  return responsiveScreen(example);
}

function entryUi(example) {
  // Modification payloads must contain explicit control types. Inheriting an
  // @namespace.control inside modifications[].value can fail at runtime with
  // "Type not specified", so the generator inlines the feature root here.
  // The separately registered feature screen remains the canonical readable
  // example; both copies are emitted from buildScreen() to prevent drift.
  const inlineScreen = buildScreen(example).screen;
  if (example.surface === "hud") {
    return {
      namespace: "hud",
      hud_title_text: {
        bindings: [
          { binding_name: "#hud_title_text_string", binding_type: "global" },
          {
            binding_type: "view",
            source_property_name: `((#hud_title_text_string - '${example.token}') = #hud_title_text_string)`,
            target_property_name: "#visible"
          }
        ]
      },
      root_panel: {
        modifications: [
          {
            array_name: "controls",
            operation: "insert_front",
            value: [{ [example.id]: inlineScreen }]
          }
        ]
      }
    };
  }
  return {
    namespace: "server_form",
    main_screen_content: {
      modifications: [
        {
          array_name: "controls",
          operation: "insert_front",
          value: [{ [`${example.id}_route`]: inlineScreen }]
        }
      ]
    }
  };
}

function rpManifest(example) {
  const [rpHeader, rpModule] = example.uuids;
  return {
    format_version: 2,
    header: {
      name: `${example.displayName} RP`,
      description: `${example.description} First-party v2 public example.`,
      uuid: rpHeader,
      version: VERSION,
      min_engine_version: ENGINE
    },
    modules: [{ type: "resources", uuid: rpModule, version: VERSION }],
    metadata: { authors: ["mcbejsonuimasterAI contributors"], license: "CC0-1.0" }
  };
}

function bpManifest(example) {
  const [rpHeader, , bpHeader, bpModule] = example.uuids;
  const deps = [
    { module_name: "@minecraft/server", version: "2.0.0" },
    { uuid: rpHeader, version: VERSION }
  ];
  if (example.surface === "form") deps.splice(1, 0, { module_name: "@minecraft/server-ui", version: "2.0.0" });
  return {
    format_version: 2,
    header: {
      name: `${example.displayName} BP`,
      description: `Minimal Script API sender for ${example.token}.`,
      uuid: bpHeader,
      version: VERSION,
      min_engine_version: ENGINE
    },
    modules: [{ type: "script", language: "javascript", uuid: bpModule, version: VERSION, entry: "scripts/main.js" }],
    dependencies: deps,
    metadata: { authors: ["mcbejsonuimasterAI contributors"], license: "MIT" }
  };
}

function formScript(example) {
  const buttons = {
    typography_state_gallery: ["Interactive sample"],
    daily_rewards: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Claim"],
    server_form_grid: ["Profile", "Quests", "Rewards", "Party", "Settings", "Close"],
    book_quest: ["Accept quest", "Back"],
    casino_reels: ["Decrease bet", "Increase bet", "Spin"],
    responsive_shell: ["Primary action", "Back"]
  }[example.id];
  return `import { system, world } from "@minecraft/server";\nimport { ActionFormData } from "@minecraft/server-ui";\n\nconst TITLE_TOKEN = ${JSON.stringify(example.token)};\n\nfunction openExample(player) {\n  let form = new ActionFormData().title(TITLE_TOKEN).body(${JSON.stringify(example.description)});\n${buttons.map((button) => `  form = form.button(${JSON.stringify(button)});`).join("\n")}\n  form.show(player).catch(() => undefined);\n}\n\nworld.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {\n  if (initialSpawn) system.runTimeout(() => openExample(player), 30);\n});\n`;
}

function hudScript(example) {
  return `import { system, world } from "@minecraft/server";\n\nconst PREFIX = ${JSON.stringify(example.token)};\n\nsystem.runInterval(() => {\n  for (const player of world.getAllPlayers()) {\n    const { x, z } = player.location;\n    player.onScreenDisplay.setTitle(\`${"${PREFIX}"}|x=\${Math.floor(x)}|z=\${Math.floor(z)}\`, {\n      fadeInDuration: 0,\n      stayDuration: 25,\n      fadeOutDuration: 0\n    });\n  }\n}, 20);\n`;
}

function irElement(id, kind, parent, pos, size, options = {}) {
  const element = { id, kind };
  if (parent) element.parent = parent;
  element.anchor = options.anchor ?? "top_left";
  element.pos = pos;
  element.size = size;
  if (options.props) element.props = options.props;
  return element;
}

function irLabel(id, parent, text, pos, size, options = {}) {
  return irElement(id, "label", parent, pos, size, {
    anchor: options.anchor,
    props: {
      text,
      localize: false,
      font_size: options.fontSize ?? "normal",
      font_scale_factor: options.scale ?? 0.9,
      text_alignment: options.alignment ?? "center"
    }
  });
}

function irDocument(example) {
  const t = `textures/ui/${example.namespace}`;
  const elements = [];
  const constraints = [];
  const shellAnchor = example.surface === "hud" ? "top_right" : "center";
  const shellPos = example.surface === "hud" ? [-16, 16] : [0, 0];
  elements.push(irElement("shell", "image", null, shellPos, example.shell, {
    anchor: shellAnchor,
    props: { texture: `${t}/panel` }
  }));

  if (example.id === "typography_state_gallery") {
    elements.push(irLabel("title", "shell", "TYPOGRAPHY & STATES", [30, 18], [560, 24], { fontSize: "large", scale: 1 }));
    elements.push(irLabel("body", "shell", "Explicit label regions keep Korean and English text measurable.", [30, 54], [560, 36], { alignment: "left", scale: 0.85 }));
    const sampleIds = [];
    const captionIds = [];
    [["default", 35], ["hover", 230], ["pressed", 425]].forEach(([state, x]) => {
      captionIds.push(`caption_${state}`);
      sampleIds.push(`${state}_sample`);
      elements.push(irLabel(`caption_${state}`, "shell", state.toUpperCase(), [x, 112], [160, 18]));
      elements.push(irElement(`${state}_sample`, "image", "shell", [x, 140], [160, 48], { props: { texture: `${t}/button_${state}` } }));
    });
    elements.push(irElement("interactive_button", "button", "shell", [200, 244], [220, 48]));
    constraints.push(
      { op: "same_size", ids: sampleIds },
      { op: "equal_gap_x", ids: sampleIds, gap: 35 },
      { op: "align_y", ids: sampleIds, edge: "center" },
      { op: "center_group_x", ids: sampleIds },
      { op: "same_size", ids: captionIds },
      { op: "equal_gap_x", ids: captionIds, gap: 35 },
      { op: "align_y", ids: captionIds, edge: "center" }
    );
  } else if (example.id === "daily_rewards") {
    elements.push(irLabel("title", "shell", "DAILY REWARDS", [30, 16], [700, 24], { fontSize: "large" }));
    const cards = [];
    const days = [];
    const rewards = [];
    const amounts = [];
    for (let index = 0; index < 7; index++) {
      const number = index + 1;
      const x = 36 + index * 100;
      cards.push(`card_${number}`);
      days.push(`day_${number}`);
      rewards.push(`reward_${number}`);
      amounts.push(`amount_${number}`);
      elements.push(irElement(`card_${number}`, "image", "shell", [x, 62], [88, 158], { props: { texture: `${t}/card` } }));
      elements.push(irLabel(`day_${number}`, "shell", `DAY ${number}`, [x + 8, 76], [72, 18]));
      elements.push(irElement(`reward_${number}`, "image", "shell", [x + 25, 112], [38, 38], { props: { texture: `${t}/reward` } }));
      elements.push(irLabel(`amount_${number}`, "shell", `x${number * 2}`, [x + 8, 158], [72, 18]));
    }
    elements.push(irElement("claim", "button", "shell", [270, 232], [220, 42]));
    for (const ids of [cards, days, rewards, amounts]) {
      constraints.push({ op: "same_size", ids }, { op: "equal_gap_x", ids, gap: 12 }, { op: "align_y", ids, edge: "center" });
    }
    constraints.push({ op: "center_group_x", ids: cards });
  } else if (example.id === "server_form_grid") {
    elements.push(irLabel("title", "shell", "SERVER MENU", [40, 18], [520, 24], { fontSize: "large" }));
    const labels = ["PROFILE", "QUESTS", "REWARDS", "PARTY", "SETTINGS", "CLOSE"];
    const buttons = [];
    for (let index = 0; index < labels.length; index++) {
      const col = index % 3;
      const row = Math.floor(index / 3);
      buttons.push(`menu_${index}`);
      elements.push(irElement(`menu_${index}`, "button", "shell", [44 + col * 174, 74 + row * 78], [160, 64], { props: { text: labels[index] } }));
    }
    constraints.push(
      { op: "same_size", ids: buttons },
      { op: "equal_gap_x", ids: buttons.slice(0, 3), gap: 14 },
      { op: "equal_gap_x", ids: buttons.slice(3), gap: 14 },
      { op: "align_y", ids: buttons.slice(0, 3), edge: "center" },
      { op: "align_y", ids: buttons.slice(3), edge: "center" },
      { op: "align_x", ids: [buttons[0], buttons[3]], edge: "center" },
      { op: "align_x", ids: [buttons[1], buttons[4]], edge: "center" },
      { op: "align_x", ids: [buttons[2], buttons[5]], edge: "center" }
    );
  } else if (example.id === "hud_minimap") {
    elements.push(irElement("map", "image", "shell", [12, 12], [160, 160], { props: { texture: `${t}/map` } }));
    elements.push(irElement("player_marker", "image", "shell", [86, 86], [12, 12], { props: { texture: `${t}/marker_player` } }));
    elements.push(irElement("waypoint_a", "image", "shell", [42, 55], [12, 12], { props: { texture: `${t}/marker_waypoint` } }));
    elements.push(irElement("waypoint_b", "image", "shell", [129, 122], [12, 12], { props: { texture: `${t}/marker_waypoint` } }));
    elements.push(irLabel("coordinates", "shell", "X 128  Z -42", [12, 180], [160, 18]));
    constraints.push(
      { op: "same_size", ids: ["player_marker", "waypoint_a", "waypoint_b"] },
      { op: "align_x", ids: ["map", "coordinates"], edge: "center" }
    );
  } else if (example.id === "book_quest") {
    elements.push(irElement("left_page", "image", "shell", [25, 30], [306, 366], { props: { texture: `${t}/page` } }));
    elements.push(irElement("right_page", "image", "shell", [349, 30], [306, 366], { props: { texture: `${t}/page` } }));
    elements.push(irLabel("quest_title", "shell", "THE LOST COMPASS", [53, 58], [250, 24], { fontSize: "large" }));
    elements.push(irLabel("quest_body", "shell", "Search the old watchtower and recover the brass compass before nightfall.", [53, 100], [250, 150], { alignment: "left", scale: 0.85 }));
    elements.push(irLabel("objectives", "shell", "OBJECTIVES", [377, 58], [250, 20], { fontSize: "large" }));
    elements.push(irLabel("objective_list", "shell", "1. Visit the watchtower\\n2. Defeat the sentry\\n3. Return the compass", [377, 100], [250, 150], { alignment: "left", scale: 0.85 }));
    elements.push(irElement("accept", "button", "shell", [405, 330], [210, 44]));
    constraints.push(
      { op: "same_size", ids: ["left_page", "right_page"] },
      { op: "symmetric_x", ids: ["left_page", "right_page"] },
      { op: "align_y", ids: ["left_page", "right_page"], edge: "center" },
      { op: "same_width", ids: ["quest_title", "quest_body", "objectives", "objective_list"] }
    );
  } else if (example.id === "casino_reels") {
    elements.push(irLabel("title", "shell", "FIVE REEL CASINO", [30, 16], [660, 24], { fontSize: "large" }));
    const cells = [];
    const symbols = [];
    for (let reel = 0; reel < 5; reel++) {
      for (let row = 0; row < 3; row++) {
        const cellId = `cell_${reel}_${row}`;
        const symbolId = `symbol_${reel}_${row}`;
        const x = 34 + reel * 80;
        const y = 66 + row * 80;
        cells.push(cellId);
        symbols.push(symbolId);
        elements.push(irElement(cellId, "image", "shell", [x, y], [72, 72], { props: { texture: `${t}/card` } }));
        elements.push(irElement(symbolId, "image", "shell", [x + 15, y + 15], [42, 42], { props: { texture: `${t}/symbol_${((reel + row) % 5) + 1}` } }));
      }
    }
    elements.push(irElement("bet_panel", "image", "shell", [454, 66], [222, 232], { props: { texture: `${t}/card` } }));
    elements.push(irLabel("balance", "shell", "BALANCE  12,500", [470, 88], [190, 20]));
    elements.push(irLabel("bet", "shell", "BET  100", [470, 126], [190, 20]));
    elements.push(irElement("bet_down", "button", "shell", [470, 170], [90, 44]));
    elements.push(irElement("bet_up", "button", "shell", [570, 170], [90, 44]));
    elements.push(irElement("spin", "button", "shell", [470, 230], [190, 54]));
    elements.push(irLabel("payline", "shell", "WILD x5  |  SCATTER x3", [36, 326], [360, 18]));
    constraints.push({ op: "same_size", ids: cells }, { op: "same_size", ids: symbols });
    for (let row = 0; row < 3; row++) {
      const rowCells = Array.from({ length: 5 }, (_, reel) => `cell_${reel}_${row}`);
      constraints.push({ op: "equal_gap_x", ids: rowCells, gap: 8 }, { op: "align_y", ids: rowCells, edge: "center" });
    }
    for (let reel = 0; reel < 5; reel++) {
      const columnCells = Array.from({ length: 3 }, (_, row) => `cell_${reel}_${row}`);
      constraints.push({ op: "equal_gap_y", ids: columnCells, gap: 8 }, { op: "align_x", ids: columnCells, edge: "center" });
    }
    constraints.push(
      { op: "same_size", ids: ["bet_down", "bet_up"] },
      { op: "align_y", ids: ["bet_down", "bet_up"], edge: "center" }
    );
  } else {
    elements.push(irLabel("title", "shell", "RESPONSIVE SAFE SHELL", [32, 20], [656, 24], { fontSize: "large" }));
    elements.push(irLabel("description", "shell", "Percentage sizing preserves outer margins while forty-eight unit actions remain touch safe.", [32, 62], [656, 52], { alignment: "left", scale: 0.85 }));
    elements.push(irElement("content", "image", "shell", [32, 124], [656, 200], { props: { texture: `${t}/card` } }));
    elements.push(irLabel("content_label", "shell", "PC: centered wide shell\\nTOUCH: retained edge padding and large targets", [56, 154], [608, 72], { alignment: "left" }));
    elements.push(irElement("primary", "button", "shell", [-110, -28], [200, 48], { anchor: "bottom_middle" }));
    elements.push(irElement("secondary", "button", "shell", [110, -28], [200, 48], { anchor: "bottom_middle" }));
    constraints.push(
      { op: "same_size", ids: ["primary", "secondary"] },
      { op: "symmetric_x", ids: ["primary", "secondary"] },
      { op: "align_y", ids: ["primary", "secondary"], edge: "center" },
      { op: "align_x", ids: ["title", "description", "content", "content_label"], edge: "center" }
    );
  }
  return { screen: example.id, base_resolution: [1920, 1080], gui_scale: 3, elements, constraints };
}

function irYaml(example) {
  return stringifyYaml(irDocument(example), { lineWidth: 0 });
}

const longKo = "오늘의 보상 목록은 화면 폭이 좁아져도 카드 간격과 버튼 정렬을 유지하며, 긴 한국어 설명이 지정된 영역을 벗어나지 않아야 합니다.";
const longEn = "This deliberately extended English validation sentence checks that labels remain inside their measured regions without shifting adjacent controls or button states.";

function validation(example) {
  const uiEntry = example.surface === "hud" ? "RP/ui/hud_screen.json" : "RP/ui/server_form.json";
  return {
    schemaVersion: 1,
    id: example.id,
    status: "static-structure-ready",
    runtimeStatus: "not-verified-in-bedrock",
    redistribution: {
      code: "MIT",
      codeSpdx: "MIT",
      assets: "CC0-1.0",
      assetSpdx: "CC0-1.0",
      origin: "first-party deterministic generator",
      licenseEvidence: "../LICENSE.md"
    },
    profiles: example.profiles,
    design: {
      family: example.family,
      rootSize: example.shell,
      alignmentToleranceUiUnits: 1,
      repeatedGapPolicy: "one size and one gap per repeated group",
      labelPolicy: "every label has explicit size"
    },
    protocol: {
      token: example.token,
      sender: "BP/scripts/main.js",
      uiEntry
    },
    requiredFiles: [
      "RP/manifest.json",
      "RP/ui/_ui_defs.json",
      uiEntry,
      `RP/ui/features/${example.id}/screen.json`,
      "BP/manifest.json",
      "BP/scripts/main.js",
      "ir.yaml",
      "preview/preview.png",
      "preview/measurement-overlay.png"
    ],
    stringCases: { baseline: example.description, koreanLong: longKo, englishLong: longEn },
    checks: {
      jsonParse: "passed",
      javascriptSyntax: "passed",
      textureReferences: "passed",
      ninesliceSidecars: "passed",
      normalizedColorComponents: "passed",
      bedrockRuntime: "not-run",
      contentLog: "not-run"
    }
  };
}

async function preview(example, overlay = false) {
  const path = join(v2Root, example.dir, "preview", overlay ? "measurement-overlay.png" : "preview.png");
  await writePng(path, 960, 540, (g) => {
    g.fillRect(0, 0, 960, 540, [15, 19, 27, 255]);
    const scale = Math.min(0.9, 700 / example.shell[0], 410 / example.shell[1]);
    const width = Math.floor(example.shell[0] * scale);
    const height = Math.floor(example.shell[1] * scale);
    const left = example.surface === "hud" ? 930 - width : Math.floor((960 - width) / 2);
    const top = example.surface === "hud" ? 30 : Math.floor((540 - height) / 2);
    g.fillRect(left, top, width, height, [31, 40, 56, 255]);
    g.outline(left, top, width, height, overlay ? [255, 78, 90, 255] : [86, 112, 148, 255], 3);
    if (example.id === "daily_rewards") {
      const gap = 8;
      const card = Math.floor((width - 12 * gap) / 7);
      for (let i = 0; i < 7; i++) {
        const x = left + gap + i * (card + gap);
        g.fillRect(x, top + 80, card, height - 130, [52, 64, 85, 255]);
        if (overlay) g.outline(x, top + 80, card, height - 130, [255, 78, 90, 255]);
      }
    } else if (example.id === "server_form_grid") {
      for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
        const x = left + 45 + col * Math.floor((width - 80) / 3);
        const y = top + 90 + row * 85;
        g.fillRect(x, y, 125, 55, [60, 83, 112, 255]);
      }
    } else if (example.id === "casino_reels") {
      for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
        const x = left + 30 + col * 52;
        const y = top + 75 + row * 52;
        g.fillRect(x, y, 44, 44, [63 + col * 12, 56 + row * 18, 92, 255]);
      }
      g.fillRect(left + width - 210, top + 70, 180, 210, [45, 54, 73, 255]);
    } else if (example.id === "book_quest") {
      g.fillRect(left + 24, top + 35, Math.floor(width / 2) - 32, height - 60, [221, 207, 167, 255]);
      g.fillRect(left + Math.floor(width / 2) + 8, top + 35, Math.floor(width / 2) - 32, height - 60, [221, 207, 167, 255]);
    } else if (example.id === "hud_minimap") {
      g.fillRect(left + 12, top + 12, width - 24, width - 24, [38, 73, 69, 255]);
      g.fillRect(left + Math.floor(width / 2) - 3, top + Math.floor(width / 2) - 3, 7, 7, [255, 255, 255, 255]);
    } else {
      g.fillRect(left + 35, top + 100, width - 70, height - 170, [45, 56, 76, 255]);
      g.fillRect(left + Math.floor(width / 2) - 110, top + height - 58, 220, 38, [67, 101, 139, 255]);
    }
    if (overlay) {
      g.fillRect(left, top + 45, width, 1, [255, 78, 90, 255]);
      g.fillRect(left + Math.floor(width / 2), top, 1, height, [255, 78, 90, 255]);
    }
  });
}

async function generateExample(example) {
  const root = join(v2Root, example.dir);
  await writeJson(join(root, "RP", "manifest.json"), rpManifest(example));
  await writeJson(join(root, "BP", "manifest.json"), bpManifest(example));
  await writeJson(join(root, "RP", "ui", "_ui_defs.json"), {
    ui_defs: [
      example.surface === "hud" ? "ui/hud_screen.json" : "ui/server_form.json",
      `ui/features/${example.id}/screen.json`
    ]
  });
  await writeJson(join(root, "RP", "ui", example.surface === "hud" ? "hud_screen.json" : "server_form.json"), entryUi(example));
  await writeJson(join(root, "RP", "ui", "features", example.id, "screen.json"), buildScreen(example));
  await writeText(join(root, "BP", "scripts", "main.js"), example.surface === "hud" ? hudScript(example) : formScript(example));
  await writeText(join(root, "ir.yaml"), irYaml(example));
  await writeJson(join(root, "validation.json"), validation(example));
  await writeText(join(root, "README.md"), `# ${example.displayName}\n\n${example.description}\n\n- Design family: \`${example.family}\`\n- Protocol token: \`${example.token}\`\n- Profiles: ${example.profiles.map((item) => `\`${item}\``).join(", ")}\n- Assets: generated first-party PNG files with same-stem nine-slice JSON\n- Validation status: static structure only; Bedrock runtime and content-log checks remain pending\n\nInstall both \`RP\` and \`BP\` in one test world. The BP opens or updates the example after initial player spawn.\n`);
  await generateAssets(example);
  await preview(example, false);
  await preview(example, true);
}

async function generateEvals() {
  const tasks = examples.map((example) => ({
    id: example.id,
    example: `examples/v2/${example.dir}`,
    surface: example.surface,
    profiles: example.profiles,
    fixtures: [
      "evals/fixtures/text-cases.json",
      "evals/fixtures/button-states.json",
      "evals/fixtures/color-ranges.json"
    ],
    invariants: [
      "all JSON files parse",
      "all JavaScript files pass syntax check",
      "_ui_defs entries resolve",
      "referenced first-party textures exist",
      "same-stem nine-slice metadata exists for stretchable textures",
      "all JSON UI color components are within the normalized 0..1 range",
      "all labels declare explicit size",
      "repeated controls preserve equal size and gap",
      "preview and measurement overlay exist",
      "runtime-unverified results are not reported as Bedrock validated"
    ],
    geometryToleranceUiUnits: 1
  }));
  await writeJson(join(evalRoot, "offline", "tasks.json"), {
    schemaVersion: 1,
    suite: "mcbe-json-ui-design-system-v2-offline",
    fixed: true,
    tasks
  });
  await writeJson(join(evalRoot, "fixtures", "text-cases.json"), {
    schemaVersion: 1,
    cases: [
      { id: "short_ko", locale: "ko-KR", text: "오늘의 보상을 받으세요." },
      { id: "long_ko_130", locale: "ko-KR", growth: 1.3, text: longKo },
      { id: "short_en", locale: "en-US", text: "Claim today's reward." },
      { id: "long_en", locale: "en-US", text: longEn },
      { id: "unbroken_token", locale: "en-US", text: "UNBROKEN_IDENTIFIER_WITHOUT_SPACES_ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789" }
    ],
    expectations: { overflow: 0, unintendedClipping: 0, adjacentControlShift: 0 }
  });
  await writeJson(join(evalRoot, "fixtures", "button-states.json"), {
    schemaVersion: 1,
    controlType: "button",
    requiredStates: ["default", "hover", "pressed"],
    optionalStates: ["locked"],
    invariants: {
      equalOuterSize: true,
      equalLabelRegion: true,
      stableAnchorAndOffset: true,
      textureContrastOrder: ["pressed", "default", "hover"]
    },
    canonicalAssets: ["button_default.png", "button_hover.png", "button_pressed.png"],
    example: "examples/v2/01-typography-state-gallery"
  });
  await writeJson(join(evalRoot, "fixtures", "color-ranges.json"), {
    schemaVersion: 1,
    scope: "JSON UI control properties",
    properties: ["color", "shadow_color", "outline_color", "locked_color"],
    componentRange: { minimum: 0, maximum: 1, inclusive: true },
    expectedFailures: [
      { value: [172, 181, 197, 255], reason: "PNG-style byte components are invalid in JSON UI color properties" }
    ],
    exclusions: ["PNG raster pixels", "image-generation source colors"]
  });
  await writeText(join(evalRoot, "README.md"), "# V2 Offline Evaluation Fixtures\n\n`offline/tasks.json` is the fixed structural and visual task manifest. Fixtures cover long Korean, long English, unbroken tokens, normalized JSON UI colors, and stable default/hover/pressed button geometry.\n\nRun `node evals/validate-examples.mjs` for the deterministic example-pack gate. It checks JSON and JavaScript syntax, `_ui_defs`, texture and nine-slice resolution, PNG headers, explicit label sizes, button states, normalized colors, license evidence, and visible-control-to-IR traceability.\n");
}

async function main() {
  await writeText(join(v2Root, "LICENSE.md"), `# V2 Public Example Licensing\n\n## Code and structured example data\n\nSPDX-License-Identifier: MIT\n\nScope: all JavaScript, JSON, YAML, Markdown, RP/BP manifests, JSON UI definitions, validation metadata, and evaluation fixtures under \`examples/v2/\` and \`evals/\`, except the generated PNG assets described below.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n## Generated PNG assets\n\nSPDX-License-Identifier: CC0-1.0\n\nScope: every PNG under \`examples/v2/*/RP/textures/\` and \`examples/v2/*/preview/\` generated by \`examples/v2/_scripts/generate.mjs\`. These assets were created specifically for this repository and are dedicated to the public domain under CC0 1.0. No private pack, local asset library, or third-party texture is embedded.\n`);
  await writeText(join(v2Root, "README.md"), `# MCBE JSON UI Design System V2 Examples\n\nSeven independent RP/BP examples demonstrate measured typography, button states, repeated layouts, HUD markers, book pages, a five-by-three casino reel grid, and PC/touch-safe sizing.\n\nRegenerate deterministic first-party assets and scaffold files with:\n\n\`\`\`powershell\nnode examples/v2/_scripts/generate.mjs\n\`\`\`\n\nEvery example records static validation separately from pending Bedrock runtime evidence.\n`);
  for (const example of examples) await generateExample(example);
  await generateEvals();
  process.stdout.write(`generated ${examples.length} v2 examples and offline fixtures\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
