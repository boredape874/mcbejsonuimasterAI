import { createHash } from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
const clip = value => String(value ?? '').slice(0, 256);
export function patchText(source, { expectedHash, find, replace }) {
  if (typeof find !== 'string' || !find || typeof replace !== 'string') throw Error('Nonempty find and string replace required');
  if (source.sha256 !== expectedHash) throw Error('SOURCE_CONFLICT: reread before patching');
  if (source.text.split(find).length !== 2) throw Error('PATCH_AMBIGUOUS: find must match exactly once');
  return source.text.replace(find, () => replace);
}
export class Reviewer {
  constructor() { this.checkpoints = new Map(); }
  review(state, preview, { screen, query = '', limit = 12, since } = {}) {
    if (!Number.isInteger(limit) || limit < 0 || limit > 100) throw Error('limit: 0..100');
    if (typeof query !== 'string' || query.length > 256) throw Error('query: <=256 characters');
    const frames = state.snapshot ? [state.snapshot, ...Object.values(state.snapshot.screens ?? {})] : [];
    const current = frames.filter(f => (!f.capturedAt || (Date.now() - f.capturedAt >= -1000 && Date.now() - f.capturedAt < 5000)) && (!state.native || (f.nativeSession === state.native.nativeSession)));
    const frame = screen ? current.find(f => f.root === screen) : current.find(f => f.root === 'third_party_server_screen') ?? current[0];
    const nodes = (frame?.nodes ?? []).slice(0, 2048);
    const rows = nodes.map(n => [n.index, clip(n.name), n.parent, ...(n.position ?? []), ...(n.size ?? []), n.state]);
    const identity = [state.native?.nativeSession ?? frame?.nativeSession, frame?.root];
    const revision = digest([identity, rows]);
    const before = since ? this.checkpoints.get(since) : undefined;
    const comparable = !!frame && before && JSON.stringify(before.identity) === JSON.stringify(identity);
    // Indices are snapshot-local; structural changes must not masquerade as stable control IDs.
    const sameStructure = comparable && before.rows.length === rows.length && rows.every((r, i) => JSON.stringify(r.slice(0, 3)) === JSON.stringify(before.rows[i].slice(0, 3)));
    const changed = sameStructure ? rows.filter((r, i) => JSON.stringify(r) !== JSON.stringify(before.rows[i])) : rows;
    const matches = (since && sameStructure ? changed : rows).filter(r => r[1].toLowerCase().includes(query.toLowerCase()));
    this.checkpoints.set(revision, { identity, rows });
    if (this.checkpoints.size > 32) this.checkpoints.delete(this.checkpoints.keys().next().value);
    const issues = [];
    if (!state.connected) issues.push({ code: 'DLL_DISCONNECTED' });
    if (!frame) issues.push({ code: screen ? 'SCREEN_NOT_SAMPLED' : 'NO_FRESH_TREE', screen });
    if (nodes.length >= (frame?.maxNodes ?? 2048)) issues.push({ code: 'TREE_MAY_BE_TRUNCATED' });
    const parents = new Set(nodes.map(n => n.parent));
    for (const n of nodes) {
      if (n.name === 'server_form_factory' && !parents.has(n.index)) issues.push({ code: 'EMPTY_FORM_FACTORY', node: n.index, certainty: 'suspected; inspect game' });
      if ([...(n.position ?? []), ...(n.size ?? [])].some(v => !Number.isFinite(v))) issues.push({ code: 'INVALID_GEOMETRY', node: n.index });
    }
    const report = preview?.report;
    const diagnostics = ['diagnostics','warnings','unresolved'].flatMap(kind => (Array.isArray(report?.[kind]) ? report[kind] : []).map(item => ({kind, text:clip(typeof item === 'string' ? item : JSON.stringify(item))})));
    const validationIssues = Array.isArray(report?.validation?.issues) ? report.validation.issues : [];
    const result = { revision, connected: state.connected, screen: frame?.root, capturedAt: frame?.capturedAt,
      screens: [...new Set(current.map(f => f.root))].slice(0, 9), totalNodes: rows.length,
      reloadSupported: state.reloadSupported, openFormRefreshSupported: state.native?.openActionFormRefreshSupported === true,
      uiActionsSupported: state.native?.uiActionsSupported === true,
      reload: state.native?.lastReload?.status, formRefresh: state.native?.openFormRefresh?.result,
      issues: issues.slice(0, 16), issueCount: issues.length,
      preview: { status: preview?.status ?? 'idle', stale: preview?.stale, ok: report?.ok, error: clip(preview?.error) || undefined,
        validationOk: report?.validation?.ok, validationIssueCount: validationIssues.length, diagnosticCount: diagnostics.length,
        diagnostics: diagnostics.slice(0, 5), validationIssues: validationIssues.slice(0, 3).map(v => clip(JSON.stringify(v))) },
      diff: since ? { available: !!comparable, structureChanged: comparable ? !sameStructure : undefined, changed: comparable ? changed.length : undefined } : undefined,
      columns: ['index','name','parent','x','y','width','height','rawState'], nodes: matches.slice(0, limit), matched: matches.length, omitted: Math.max(0, matches.length - limit),
      runtimeVerified: false, evidence: 'Sampled tree; pixels, text, clipping, visibility and button effects are not verified.' };
    return result;
  }
}
