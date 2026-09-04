const CATEGORY = /\[(UI|Sound|Scripting|Script)\]/i;
const SEVERITY = /\[(error|warning|warn|info)\]/i;
const CONTROL_PATHS = [
  /(?:control(?: path)?|element|base)\s*[:=]\s*["']?([A-Za-z0-9_$#.@/\[\]-]+)/i,
  /([A-Za-z_][\w-]*\.[A-Za-z_][\w.-]*(?:\/[A-Za-z0-9_$#.@\[\]-]+)*)/,
];

export function parseContentLog(source, options = {}) {
  const target = options.targetControl || null, records = [], counts = { ui: 0, sound: 0, script: 0, other: 0, errors: 0, warnings: 0 };
  for (const [zeroIndex, raw] of String(source).split(/\r\n|\r|\n/).entries()) {
    const line = raw.trim(); if (!line) continue;
    const categoryMatch = line.match(CATEGORY), severityMatch = line.match(SEVERITY);
    const category = categoryMatch ? (/^ui$/i.test(categoryMatch[1]) ? "ui" : /^sound$/i.test(categoryMatch[1]) ? "sound" : "script") : "other";
    const severity = severityMatch ? (/^err/i.test(severityMatch[1]) ? "error" : /^warn/i.test(severityMatch[1]) ? "warning" : "info") : (/\berror\b/i.test(line) ? "error" : "info");
    const signature = category === "ui"
      ? (/unknown propert/i.test(line) ? "UI_UNKNOWN_PROPERTY" : /(?:control reference not found|missing reference|base not found)/i.test(line) ? "UI_CONTROL_NOT_FOUND" : /type not specified/i.test(line) ? "UI_TYPE_NOT_SPECIFIED" : /(?:parse|json).*(?:fail|error)|(?:fail|error).*json/i.test(line) ? "UI_JSON_PARSE_FAILURE" : severity === "error" ? "UI_ERROR" : "UI_MESSAGE")
      : category === "sound" ? (severity === "error" ? "SOUND_ERROR" : "SOUND_MESSAGE")
      : category === "script" ? (severity === "error" ? "SCRIPT_ERROR" : "SCRIPT_MESSAGE")
      : (severity === "error" ? "EXTERNAL_ERROR" : "OTHER_MESSAGE");
    let controlPath = null;
    for (const pattern of CONTROL_PATHS) { const match = line.match(pattern); if (match) { controlPath = match[1]; break; } }
    const packWideUiFailure = category === "ui" && severity === "error" && !controlPath && ["UI_JSON_PARSE_FAILURE", "UI_ERROR"].includes(signature);
    const related = !target || line.includes(target) || controlPath?.includes(target) || packWideUiFailure;
    records.push({ line: zeroIndex + 1, category, severity, signature, controlPath, related, message: line });
    counts[category]++; if (severity === "error") counts.errors++; if (severity === "warning") counts.warnings++;
  }
  const targetUiErrors = records.filter((item) => item.category === "ui" && item.severity === "error" && item.related);
  const externalNoise = records.filter((item) => item.severity === "error" && !(item.category === "ui" && item.related));
  return { schema: "mcbe-jsonui-ai-kit/content-log-audit@1", ok: targetUiErrors.length === 0, targetControl: target, targetUiErrors, externalNoise, counts, records };
}
