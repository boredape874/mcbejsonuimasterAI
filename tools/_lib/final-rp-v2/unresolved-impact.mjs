const BLOCKING_PROPERTIES = new Set(["visible","ignored","size","offset","anchor_from","anchor_to","alpha","enabled","default_control","hover_control","pressed_control","locked_control","focus_control","focused_control","selected_control","texture","text"]);
const BLOCKING_KINDS = /^(unresolved_(control|dimension|state|texture|glyph|binding|collection|animation)|invalid_ui_property|rejected_texture_path|FONT_UNAVAILABLE|GLYPH_RUN_UNAVAILABLE)/i;

export function classifyUnresolved(items = []) {
  const classified = items.map(item => {
    const property = String(item.property || pointerProperty(item.pointer) || "").replace(/^#/, "");
    const impact = item.impact || (BLOCKING_KINDS.test(item.kind || "") || BLOCKING_PROPERTIES.has(property) ? "blocking" : "decorative");
    return { ...item, impact, severity: impact === "blocking" ? "error" : "warning", stage: item.stage || inferStage(item.kind) };
  });
  const blocking = classified.filter(item => item.impact === "blocking"), warnings = classified.filter(item => item.impact !== "blocking");
  return { ok: blocking.length === 0, items: classified, blocking, warnings, counts: { blocking: blocking.length, warning: warnings.length } };
}
function pointerProperty(pointer) { const parts=String(pointer||"").split("/").filter(Boolean); return parts.at(-1); }
function inferStage(kind="") { return /binding|collection|expression/.test(kind)?"data":/state|animation/.test(kind)?"state":/dimension|layout|hit|occlusion/.test(kind)?"layout":/texture|glyph|font/.test(kind)?"render":"resolve"; }
