import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { inspectMinecraftFonts, FONT_UNAVAILABLE } from "./font-engine.mjs";

async function isDirectory(path) { try { return (await stat(path)).isDirectory(); } catch { return false; } }
async function sha256(path) { return createHash("sha256").update(await readFile(path)).digest("hex"); }

function packageVersion(path) {
  const match = basename(path).match(/^Microsoft\.MinecraftUWP_([0-9.]+)/i);
  return match?.[1] ?? null;
}

async function candidateRoots(searchRoots) {
  const candidates = [];
  for (const root of searchRoots) {
    if (!(await isDirectory(root))) continue;
    if (/Microsoft\.MinecraftUWP_/i.test(basename(root))) candidates.push(root);
    for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) if (entry.isDirectory() && /^Microsoft\.MinecraftUWP_/i.test(entry.name)) candidates.push(join(root, entry.name));
  }
  return candidates.sort((a, b) => (packageVersion(b) ?? "").localeCompare(packageVersion(a) ?? "", undefined, { numeric: true }));
}

async function findVanillaRoot(packageRoot) {
  const relativeCandidates = ["data/resource_packs/vanilla", "data/resource_packs/vanilla_1.0.0", "LocalState/games/com.mojang/resource_packs/vanilla"];
  for (const relative of relativeCandidates) { const path = join(packageRoot, ...relative.split("/")); if (await isDirectory(path)) return path; }
  return null;
}

async function appxInstallations() {
  if (process.platform !== "win32") return [];
  try {
    const command = "Get-AppxPackage -Name Microsoft.MinecraftUWP | Select-Object Version,InstallLocation | ConvertTo-Json -Compress";
    const { stdout } = await promisify(execFile)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
    const parsed = JSON.parse(stdout.trim() || "[]"), records = Array.isArray(parsed) ? parsed : [parsed];
    return records.filter((item) => item?.InstallLocation).map((item) => ({ packageRoot: item.InstallLocation, version: String(item.Version ?? "") || null }));
  } catch { return []; }
}

export async function discoverMinecraftUwp({ searchRoots, useAppx = true } = {}) {
  const roots = searchRoots ?? [process.env.ProgramFiles && join(process.env.ProgramFiles, "WindowsApps"), process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Packages")].filter(Boolean);
  const denied = [];
  for (const packageRoot of await candidateRoots(roots)) {
    try { const vanillaRoot = await findVanillaRoot(packageRoot); if (vanillaRoot) return { packageRoot, vanillaRoot, version: packageVersion(packageRoot) }; }
    catch (error) { denied.push({ package: basename(packageRoot), code: error.code ?? "READ_FAILED" }); }
  }
  for (const item of useAppx ? await appxInstallations() : []) {
    try { const vanillaRoot = await findVanillaRoot(item.packageRoot); if (vanillaRoot) return { packageRoot: item.packageRoot, vanillaRoot, version: item.version }; }
    catch (error) { denied.push({ package: basename(item.packageRoot), code: error.code ?? "READ_FAILED" }); }
  }
  return { packageRoot: null, vanillaRoot: null, version: null, diagnostics: [{ code: FONT_UNAVAILABLE, message: "A readable Microsoft.MinecraftUWP vanilla resource pack was not found", attempts: denied }] };
}

export async function createVanillaProfile({ vanillaRoot, version = null, searchRoots, useAppx = true } = {}) {
  let discovered = null;
  if (!vanillaRoot) { discovered = await discoverMinecraftUwp({ searchRoots, useAppx }); vanillaRoot = discovered.vanillaRoot; version ??= discovered.version; }
  if (!vanillaRoot) return { schemaVersion: 1, source: "Microsoft.MinecraftUWP", version, status: "unavailable", font: { status: "unavailable", code: FONT_UNAVAILABLE }, diagnostics: discovered?.diagnostics ?? [{ code: FONT_UNAVAILABLE, message: "Minecraft vanilla root was not supplied" }] };
  if (!version) try {
    const manifest = JSON.parse(await readFile(join(vanillaRoot, "manifest.json"), "utf8"));
    const value = manifest?.header?.version;
    version = Array.isArray(value) ? value.join(".") : (typeof value === "string" ? value : null);
  } catch {}
  const fontRoot = join(vanillaRoot, "font"), files = [];
  for (const name of ["font_metadata.json", "default8.png"]) { const path = join(fontRoot, name); try { files.push({ path: `font/${name}`, sha256: await sha256(path) }); } catch {} }
  for (const name of (await readdir(fontRoot).catch(() => [])).filter((name) => /^glyph_[0-9a-f]+\.png$/i.test(name)).sort()) files.push({ path: `font/${name}`, sha256: await sha256(join(fontRoot, name)) });
  let font;
  try {
    const inspected = await inspectMinecraftFonts(fontRoot);
    const { metadata: _privateRawMetadata, ...publicFont } = inspected;
    font = publicFont;
  } catch (error) { font = { status: "unavailable", code: FONT_UNAVAILABLE, message: error.message, details: error.details ?? {} }; }
  const fingerprint = createHash("sha256").update(files.map((file) => `${file.path}:${file.sha256}`).join("\n")).digest("hex");
  return { schemaVersion: 1, source: "Microsoft.MinecraftUWP", version, status: "available", fingerprint, files, font, diagnostics: font.status === "available" ? [] : [{ code: FONT_UNAVAILABLE, message: font.message }] };
}

export const buildVanillaProfile = createVanillaProfile;

export const VANILLA_PROFILE_MISMATCH = "VANILLA_PROFILE_MISMATCH";

export function compareVanillaVersionProfiles(profiles) {
  const entries = Object.entries(profiles ?? {}).map(([channel, profile]) => ({ channel, version: profile?.version ?? null, fingerprint: profile?.fingerprint ?? null, status: profile?.status ?? "unavailable" }));
  const available = entries.filter((entry) => entry.status === "available");
  const signatures = new Set(available.map((entry) => `${entry.version ?? "unknown"}:${entry.fingerprint ?? "unknown"}`));
  const missing = entries.filter((entry) => entry.status !== "available").map((entry) => entry.channel);
  const mismatch = signatures.size > 1 || missing.length > 0;
  return { ok: !mismatch, code: mismatch ? VANILLA_PROFILE_MISMATCH : "VANILLA_PROFILES_MATCH", evidenceLevel: "integrated_static", runtimeVerified: false, profiles: entries, missing };
}

export async function createVanillaVersionProfiles({ main = null, preview = null, installed = null } = {}) {
  const inputs = { main, preview, installed }, profiles = {};
  for (const [channel, options] of Object.entries(inputs)) profiles[channel] = options?.status ? options : await createVanillaProfile(options ?? { vanillaRoot: null, useAppx: false });
  return { schemaVersion: 1, evidenceLevel: "integrated_static", runtimeVerified: false, profiles, comparison: compareVanillaVersionProfiles(profiles) };
}
