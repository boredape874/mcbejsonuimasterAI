import { readFile, stat, writeFile, link, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

async function freshJson(file) {
  try {
    const [text, info] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
    const rawAge = Date.now() - info.mtimeMs;
    // NTFS write times and Date.now() can differ slightly at sub-ms/clock-tick boundaries.
    return { data: JSON.parse(text), ageMs: Math.max(0, rawAge), fresh: rawAge >= -1000 && rawAge < 5000 };
  } catch { return { fresh: false }; }
}

export async function nativeStatus(bridgeRoot) {
  const [frame, heartbeat] = await Promise.all([
    freshJson(join(bridgeRoot, 'snapshot.json')), freshJson(join(bridgeRoot, 'native.json'))
  ]);
  const native = heartbeat.data;
  const sameSession = !native || (frame.data?.nativeSession === native.nativeSession && frame.data?.pid === native.pid);
  const frameFresh = frame.fresh && sameSession;
  const connected = heartbeat.fresh || frameFresh;
  return { connected, ageMs: heartbeat.fresh ? heartbeat.ageMs : frame.ageMs,
    snapshot: frameFresh ? frame.data : undefined, native: heartbeat.fresh ? native : undefined,
    reloadSupported: heartbeat.fresh && native?.schemaVersion === 2 && native.reloadSupported === true,
    reason: connected ? native?.reason : 'NATIVE_DISCONNECTED', runtimeVerified: false };
}

export async function requestNativeReload(bridgeRoot, { timeoutMs = 60000, action } = {}) {
  const state = await nativeStatus(bridgeRoot);
  if (!state.connected) throw new Error('NATIVE_DISCONNECTED: 게임과 새 재로딩 DLL을 실행해주세요.');
  if (!state.reloadSupported) throw new Error(`NATIVE_RELOAD_UNAVAILABLE: ${state.reason || '재로딩 DLL을 주입해주세요.'}`);
  if (action && state.native?.uiActionsSupported !== true) throw Error('UI_ACTIONS_UNAVAILABLE: 새 AI 브리지 DLL이 필요합니다.');
  const { pid, nativeSession } = state.native;
  if (!Number.isSafeInteger(pid) || pid <= 0 || typeof nativeSession !== 'string' || !nativeSession)
    throw new Error('Invalid native identity');
  const id = randomUUID(), expiresAt = Date.now() + 10000;
  const request = { schemaVersion: 2, id, operation: action ? 'ui_action' : 'reload_ui', pid, nativeSession, expiresAt, ...(action ? {action} : {}) };
  const temp = join(bridgeRoot, `reload-${id}.tmp`);
  await writeFile(temp, JSON.stringify(request), { flag: 'wx' });
  try {
    // Hard-link publishes a complete file without replacing another editor's request.
    await link(temp, join(bridgeRoot, 'reload-request.json'));
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('NATIVE_RELOAD_BUSY: 기존 요청을 먼저 처리해야 합니다.');
    throw error;
  } finally { await unlink(temp).catch(() => {}); }
  const deadline = Date.now() + timeoutMs;
  let accepted = false;
  while (Date.now() < deadline) {
    const response = await freshJson(join(bridgeRoot, 'reload-response.json'));
    const r = response.data;
    if (r?.id === id && r.pid === pid && r.nativeSession === nativeSession) {
      if (r.status === 'invoking') accepted = true;
      else if (['reloaded', 'acted', 'rejected', 'failed'].includes(r.status))
        return { ...r, runtimeVerified: false, scope: action ? 'foreground-game-ui' : 'active-game-resource-pack-stack' };
    }
    const current = await nativeStatus(bridgeRoot);
    if (current.native && (current.native.pid !== pid || current.native.nativeSession !== nativeSession))
      return { id, status: 'interrupted', error: 'NATIVE_SESSION_CHANGED', mayHaveExecuted: true, runtimeVerified: false };
    await delay(100);
  }
  // Never retry automatically: a synchronous game reload can outlive its heartbeat.
  return { id, status: 'timeout', accepted, mayHaveExecuted: true, runtimeVerified: false,
    error: action ? 'UI_ACTION_TIMEOUT' : 'NATIVE_RELOAD_TIMEOUT', message: '게임 상태와 native_status를 확인하세요. 자동 재시도하지 않았습니다.' };
}

export function requestNativeAction(root, action) {
  if (!['hover','click','key'].includes(action?.kind) || typeof action.expectedScreen !== 'string' || !action.expectedScreen || action.expectedScreen.length > 256) throw Error('kind and expectedScreen required');
  if (action.kind === 'key' ? !['Escape','Tab','Enter','Left','Right','Up','Down'].includes(action.key) : ![action.x,action.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) throw Error('Invalid key or normalized x/y (0..1)');
  const {kind,expectedScreen,x,y,key} = action;
  return requestNativeReload(root, { timeoutMs: 5000, action: {kind,expectedScreen,...(kind === 'key' ? {key} : {x,y})} });
}
