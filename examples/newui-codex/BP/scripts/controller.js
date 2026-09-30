import { CATALOG } from './catalog.js';
import { createSessions } from './session.js';

export const NPC_TYPE = 'newui:codex';
export const BOOK_TYPE = 'newui:field_guide';
export const OWNER_TAG = 'newui.codex.owned';
const SESSION_KEY = 'newui:session', OWNER_KEY = 'newui:owner', PAGE_KEY = 'newui:entry';
const MAX_SESSION_TICKS = 6000;

// Engine adapter is injected so identity, queueing and inventory behavior can be
// tested without importing or pretending to execute the Bedrock engine.
export function createCodexController({ world, system, makeItem, warn = message => console.warn(message), prefix = Date.now().toString(36) }) {
  if (!/^[a-z0-9_]+$/i.test(prefix)) throw new Error('Unsafe session prefix');
  const sessions = createSessions(CATALOG, prefix), pending = new Map(), cleanupPending = new Map();
  let tagSequence = 0;
  const entity = id => { try { return world.getEntity(id); } catch { return undefined; } };
  const validPlayer = player => player?.typeId === 'minecraft:player' && player.isValid;
  const tell = (player, message) => { try { if (validPlayer(player)) player.sendMessage(message); } catch { /* Player left. */ } };
  function retryCleanup(ticket) {
    try {
      if (system.currentTick >= ticket.expires) {
        cleanupPending.delete(ticket.npcId);
        warn('[NewUI] NPC cleanup retry expired; an unloaded partial candidate may need operator inspection.');
        return;
      }
      const npc = entity(ticket.npcId);
      if (!npc?.isValid) return; // An unloaded candidate may become available later.
      const owner = npc.getDynamicProperty(OWNER_KEY), sessionId = npc.getDynamicProperty(SESSION_KEY);
      if (npc.typeId !== NPC_TYPE || (owner !== undefined && owner !== ticket.playerId) || (sessionId !== undefined && sessionId !== ticket.sessionId)) {
        cleanupPending.delete(ticket.npcId); return;
      }
      npc.remove(); cleanupPending.delete(ticket.npcId);
    } catch (error) { warn(`[NewUI] NPC cleanup deferred: ${String(error).slice(0, 180)}`); }
  }
  function cleanupCandidate(npcId, playerId, sessionId) {
    // Only an ID returned by our spawn, or a fully matched owned session, enters
    // this retry list. Incomplete dynamic properties alone never establish ownership.
    const ticket = { npcId, playerId, sessionId, expires: system.currentTick + MAX_SESSION_TICKS };
    cleanupPending.set(npcId, ticket); retryCleanup(ticket);
  }
  function removeOwned(session) {
    const npc = entity(session?.npcId);
    try {
      if (npc?.isValid && npc.typeId === NPC_TYPE && npc.hasTag(OWNER_TAG) && npc.getDynamicProperty(SESSION_KEY) === session.id && npc.getDynamicProperty(OWNER_KEY) === session.playerId) cleanupCandidate(npc.id, session.playerId, session.id);
    } catch (error) { warn(`[NewUI] NPC cleanup deferred: ${String(error).slice(0, 180)}`); }
  }
  function endPlayer(playerId) { pending.delete(playerId); const old = sessions.endPlayer(playerId); if (old) removeOwned(old); }
  function present(player, entryIndex, action = 'open') {
    if (!validPlayer(player)) return false;
    let npc, session, previous;
    try {
      npc = player.dimension.spawnEntity(NPC_TYPE, player.location);
      npc.addTag(OWNER_TAG);
      const selectionTag = `newui_page_${prefix}_${++tagSequence}`;
      npc.addTag(selectionTag);
      ({ session, previous } = sessions.replace({ playerId: player.id, npcId: npc.id, dimensionId: player.dimension.id, entryIndex, tick: system.currentTick }));
      npc.setDynamicProperty(SESSION_KEY, session.id);
      npc.setDynamicProperty(OWNER_KEY, player.id);
      const selected = player.dimension.getEntities({ type: NPC_TYPE, tags: [selectionTag] });
      if (selected.length !== 1 || selected[0].id !== npc.id) throw new Error('NPC selector is not unique');
      const scene = `newui:entry_${String(entryIndex).padStart(2, '0')}`;
      const result = player.runCommand(`dialogue open @e[type=${NPC_TYPE},tag=${selectionTag},c=1] @s ${scene}`);
      if (result.successCount < 1) throw new Error('Dialogue open was not accepted');
      player.setDynamicProperty(PAGE_KEY, entryIndex);
      const animation = action === 'prev' ? 'turn_left' : action === 'next' ? 'turn_right' : 'open';
      try { npc.playAnimation(`animation.newui.codex.${animation}`, { players: [player] }); }
      catch (error) { warn(`[NewUI] Animation not applied: ${String(error).slice(0, 180)}`); }
      return true;
    } catch (error) {
      if (session) sessions.close(session);
      // This newly spawned entity is our own candidate, including setup failures
      // before the full dynamic-property identity was committed.
      if (npc) cleanupCandidate(npc.id, player.id, session?.id);
      tell(player, '도감을 열지 못했어요. BP/RP 활성화와 콘텐츠 로그를 확인해 주세요.');
      warn(`[NewUI] Open failed: ${String(error).slice(0, 220)}`);
      return false;
    } finally { if (previous) removeOwned(previous); }
  }
  function queueAction(player, action) {
    if (!validPlayer(player) || pending.has(player.id)) return false;
    const playerId = player.id, ticket = {};
    pending.set(playerId, ticket);
    system.run(() => {
      if (pending.get(playerId) !== ticket) return;
      pending.delete(playerId);
      const live = entity(playerId);
      try {
        if (validPlayer(live)) {
          if (action === 'book') giveBook(live);
          else present(live, sessions.entryIndex(live.getDynamicProperty(PAGE_KEY)));
        }
      } catch (error) { warn(`[NewUI] Queued action failed: ${String(error).slice(0, 180)}`); }
    });
    return true;
  }
  function giveBook(player) {
    if (!validPlayer(player)) return false;
    try {
      const inventory = player.getComponent('minecraft:inventory')?.container;
      if (!inventory) return false;
      for (let i = 0; i < inventory.size; i++) if (inventory.getItem(i)?.typeId === BOOK_TYPE) { tell(player, '이미 가방에 도감이 있어요. 손에 들고 사용해 주세요.'); return false; }
      const slot = inventory.firstEmptySlot();
      if (!Number.isInteger(slot) || slot < 0 || slot >= inventory.size || inventory.getItem(slot) !== undefined) { tell(player, '가방에 빈칸이 필요해요. 아이템은 바꾸지 않았어요.'); return false; }
      inventory.setItem(slot, makeItem(BOOK_TYPE));
      tell(player, '탐험 도감을 받았어요. 손에 들고 사용하면 열립니다.'); return true;
    } catch (error) { warn(`[NewUI] Book grant failed: ${String(error).slice(0, 180)}`); return false; }
  }
  function handleScriptEvent(event) {
    if (!['newui:navigate', 'newui:close'].includes(event.id)) return false;
    const npc = event.sourceEntity, player = event.initiator;
    if (npc?.typeId !== NPC_TYPE || !npc.isValid || !validPlayer(player)) return false;
    const current = sessions.getNpc(npc.id);
    if (!current || current.playerId !== player.id || current.dimensionId !== player.dimension.id || npc.dimension.id !== current.dimensionId || !npc.hasTag(OWNER_TAG) || npc.getDynamicProperty(SESSION_KEY) !== current.id || npc.getDynamicProperty(OWNER_KEY) !== player.id) return false;
    if (event.id === 'newui:close') {
      if (event.message !== 'close') return false;
      // A navigation event can run before or after on_close in the same tick.
      // The immutable NPC/session ticket cannot remove a replacement page.
      system.runTimeout(() => { const closed = sessions.close(current); if (closed) removeOwned(closed); }, 2);
      return true;
    }
    const intent = sessions.consume({ playerId: player.id, npcId: npc.id, sessionId: current.id, action: event.message, tick: system.currentTick });
    if (!intent) return false;
    // Navigation rotates the NPC identity. Late input from the previous scene
    // is rejected even if its action happens to be valid on the next page.
    present(player, intent.entryIndex, event.message);
    return true;
  }
  function sweep() {
    for (const ticket of cleanupPending.values()) retryCleanup(ticket);
    for (const current of sessions.all()) {
      const player = entity(current.playerId), npc = entity(current.npcId);
      if (!validPlayer(player) || !npc?.isValid || player.dimension.id !== current.dimensionId || system.currentTick - current.tick >= MAX_SESSION_TICKS) endPlayer(current.playerId);
    }
    for (const id of ['overworld', 'nether', 'the_end']) {
      try {
        for (const npc of world.getDimension(id).getEntities({ type: NPC_TYPE, tags: [OWNER_TAG] })) {
          if (!sessions.getNpc(npc.id) && typeof npc.getDynamicProperty(SESSION_KEY) === 'string' && typeof npc.getDynamicProperty(OWNER_KEY) === 'string') {
            npc.remove(); cleanupPending.delete(npc.id);
          }
        }
      } catch (error) { warn(`[NewUI] Orphan sweep deferred: ${String(error).slice(0, 180)}`); }
    }
  }
  return Object.freeze({ queueOpen: player => queueAction(player, 'open'), queueBook: player => queueAction(player, 'book'), giveBook, handleScriptEvent, endPlayer, sweep, sessions });
}
