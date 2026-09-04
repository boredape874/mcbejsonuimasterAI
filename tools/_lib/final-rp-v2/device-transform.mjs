const DEFAULT_LOGICAL_SIZE = Object.freeze([480, 270]);

function pair(value, name) {
  if (!Array.isArray(value) || value.length !== 2 || value.some((n) => !Number.isFinite(Number(n)))) throw new TypeError(`${name} must be [x, y]`);
  return value.map(Number);
}

function margins(value = [0, 0, 0, 0]) {
  if (Array.isArray(value) && value.length === 4) return value.map(Number);
  if (value && typeof value === "object") return [value.left ?? 0, value.top ?? 0, value.right ?? 0, value.bottom ?? 0].map(Number);
  throw new TypeError("safeArea must be [left, top, right, bottom] or an object");
}

function invert([a, b, c, d, e, f]) {
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-12) throw new RangeError("DeviceTransform matrix is singular");
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
}

function apply([a, b, c, d, e, f], [x, y]) { return [a * x + c * y + e, b * x + d * y + f]; }

function solve3(rows, values) {
  const a = rows.map((row, i) => [...row, values[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    if (Math.abs(a[col][col]) < 1e-12) throw new RangeError("Calibration points do not define an affine transform");
    const divisor = a[col][col];
    for (let j = col; j < 4; j++) a[col][j] /= divisor;
    for (let r = 0; r < 3; r++) if (r !== col) {
      const factor = a[r][col];
      for (let j = col; j < 4; j++) a[r][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row[3]);
}

function leastSquares(samples, axis) {
  const normal = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], rhs = [0, 0, 0];
  for (const sample of samples) {
    const [x, y] = pair(sample.logical, "sample.logical"), p = [x, y, 1], target = pair(sample.pixel, "sample.pixel")[axis];
    for (let i = 0; i < 3; i++) { rhs[i] += p[i] * target; for (let j = 0; j < 3; j++) normal[i][j] += p[i] * p[j]; }
  }
  return solve3(normal, rhs);
}

export class DeviceTransform {
  constructor({ screenshotSize, guiScale = 1, safeArea = [0, 0, 0, 0], logicalSize = DEFAULT_LOGICAL_SIZE, matrix, confidence, residual = 0, profileId = null, device = null, calibration = null } = {}) {
    this.screenshotSize = pair(screenshotSize, "screenshotSize");
    this.logicalSize = pair(logicalSize, "logicalSize");
    this.guiScale = Number(guiScale);
    if (!(this.guiScale > 0)) throw new RangeError("guiScale must be positive");
    this.safeArea = margins(safeArea);
    this.profileId = profileId; this.device = device; this.calibration = calibration;
    if (this.safeArea.some((n) => !Number.isFinite(n) || n < 0)) throw new RangeError("safeArea margins must be finite and non-negative");
    const [sw, sh] = this.screenshotSize, [l, t, r, b] = this.safeArea, usableW = sw - l - r, usableH = sh - t - b;
    if (!(usableW > 0 && usableH > 0)) throw new RangeError("safeArea leaves no drawable pixels");
    if (matrix) this.matrix = matrix.map(Number);
    else {
      const scale = Math.min(usableW / this.logicalSize[0], usableH / this.logicalSize[1]);
      this.matrix = [scale, 0, 0, scale, l + (usableW - this.logicalSize[0] * scale) / 2, t + (usableH - this.logicalSize[1] * scale) / 2];
    }
    if (this.matrix.length !== 6 || this.matrix.some((n) => !Number.isFinite(n))) throw new TypeError("matrix must contain six finite values");
    this.inverseMatrix = invert(this.matrix);
    this.residual = Number(residual);
    const scale = (Math.hypot(this.matrix[0], this.matrix[1]) + Math.hypot(this.matrix[2], this.matrix[3])) / 2;
    this.confidence = confidence ?? Math.max(0, Math.min(1, 1 - this.residual / Math.max(1, scale * 2)));
  }

  logicalToPixel(point) { return apply(this.matrix, pair(point, "point")); }
  pixelToLogical(point) { return apply(this.inverseMatrix, pair(point, "point")); }
  pixelToGui(point) { return pair(point, "point").map((n) => n / this.guiScale); }
  guiToPixel(point) { return pair(point, "point").map((n) => n * this.guiScale); }
  transformRect({ x, y, w, h }) { const p = this.logicalToPixel([x, y]), q = this.logicalToPixel([x + w, y + h]); return { x: p[0], y: p[1], w: q[0] - p[0], h: q[1] - p[1] }; }
  toJSON() { return { profileId: this.profileId, device: this.device, logicalSize: this.logicalSize, screenshotSize: this.screenshotSize, guiScale: this.guiScale, safeArea: this.safeArea, matrix: this.matrix, confidence: this.confidence, residual: this.residual, calibration: this.calibration, evidenceLevel: "final-pack-static-visual", runtimeVerified: false }; }

  static fit(options) { return new DeviceTransform(options); }
  static calibrate({ samples, ...options }) {
    if (!Array.isArray(samples) || samples.length < 3) throw new RangeError("At least three calibration samples are required");
    const [a, c, e] = leastSquares(samples, 0), [b, d, f] = leastSquares(samples, 1), matrix = [a, b, c, d, e, f];
    const squared = samples.reduce((sum, sample) => { const actual = apply(matrix, sample.logical), expected = sample.pixel; return sum + (actual[0] - expected[0]) ** 2 + (actual[1] - expected[1]) ** 2; }, 0);
    const residual = Math.sqrt(squared / samples.length);
    return new DeviceTransform({ ...options, matrix, residual, confidence: Math.max(0, Math.min(1, 1 - residual / 4)) });
  }
}

export function createDeviceTransform(options) { return DeviceTransform.fit(options); }
export const LOGICAL_VIEWPORT = DEFAULT_LOGICAL_SIZE;

export function validateDeviceProfile(profile) {
  const missing = ["id", "device", "screenshotSize", "guiScale", "safeArea", "calibration"].filter((key) => profile?.[key] == null);
  const provenanceMissing = ["source", "capturedAt", "screenshotSha256", "bedrockVersion", "anchors"].filter((key) => profile?.calibration?.[key] == null);
  return { ok: missing.length === 0 && provenanceMissing.length === 0, code: missing.length || provenanceMissing.length ? "DEVICE_PROFILE_PROVENANCE_MISSING" : "DEVICE_PROFILE_VALID", missing, provenanceMissing, evidenceLevel: "final-pack-static-visual", runtimeVerified: false };
}

export function transformFromDeviceProfile(profile) {
  const validation = validateDeviceProfile(profile);
  if (!validation.ok) { const error = new Error(validation.code); error.code = validation.code; error.details = validation; throw error; }
  return DeviceTransform.fit({ profileId: profile.id, device: profile.device, screenshotSize: profile.screenshotSize, guiScale: profile.guiScale, safeArea: profile.safeArea, logicalSize: profile.logicalSize ?? DEFAULT_LOGICAL_SIZE, calibration: profile.calibration });
}
