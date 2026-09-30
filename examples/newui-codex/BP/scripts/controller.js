import { ADDON_VERSION, CATALOG } from './catalog.js';
import { createSessions } from './session.js';

export const NPC_TYPE = 'newui:codex';
export const BOOK_TYPE = 'newui:field_guide';
export const OWNER_TAG = 'newui.codex.owned';
const TEMPLATE_TAG = 'newui.codex.template';
const SESSION_KEY = 'newui:session', OWNER_KEY = 'newui:owner', PAGE_KEY = 'newui:entry';
const MAX_SESSION_TICKS = 6000;
const STAGE = Object.freeze({ queue: '예약', player: '플레이어확인', place: '구조체배치', candidate: '새NPC확인', session: '세션등록', dialogue: '대화열기' });

// Engine adapter is injected so identity, queueing and inventory behavior can be
// tested without importing or pretending to execute the Bedrock engine.
export function createCodexController({ world, system, makeItem, warn = message => console.warn(message), prefix = Date.now().toString(36) }) {
  if (!/^[a-z0-9_]+$/i.test(prefix)) throw new Error('Unsafe session prefix');
  const sessions = createSessions(CATALOG, prefix), pending = new Map(), cleanupPending = new Map(), deliveries = new Map();
  let tagSequence = 0;
  const entity = id => { try { return world.getEntity(id); } catch { return undefined; } };
  const validPlayer = player => player?.typeId === 'minecraft:player' && player.isValid;
  const tell = (player, message) => { try { if (validPlayer(player)) player.sendMessage(message); } catch { /* Player left. */ } };
  function failure(stage, entryIndex, cause, player, message = '요청을 처리하지 못했어요. 콘텐츠 로그를 확인해 주세요.') {
    const entry = Number.isInteger(entryIndex) ? String(entryIndex).padStart(2, '0') : '--';
    const reason = String(cause).replace(/[\r\n]+/g, ' ').slice(0, 180);
    warn(`[NewUI ${ADDON_VERSION}] stage=${stage} entry=${entry} reason=${reason}`);
    if (player) tell(player, `[NewUI ${ADDON_VERSION}] ${stage}: ${message}`);
  }
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
    // Only a new template ID observed across our placement, or a matched session, enters
    // this retry list. Incomplete dynamic properties alone never establish ownership.
    const ticket = { npcId, playerId, sessionId, expires: system.currentTick + MAX_SESSION_TICKS };
    cleanupPending.set(npcId, ticket); retryCleanup(ticket);
  }
  function removeOwned(session) {
    if (session && deliveries.get(session.playerId)?.session.id === session.id) deliveries.delete(session.playerId);
    const npc = entity(session?.npcId);
    try {
      if (npc?.isValid && npc.typeId === NPC_TYPE && npc.hasTag(OWNER_TAG) && npc.getDynamicProperty(SESSION_KEY) === session.id && npc.getDynamicProperty(OWNER_KEY) === session.playerId) cleanupCandidate(npc.id, session.playerId, session.id);
    } catch (error) { warn(`[NewUI] NPC cleanup deferred: ${String(error).slice(0, 180)}`); }
  }
  function endPlayer(playerId) { pending.delete(playerId); deliveries.delete(playerId); const old = sessions.endPlayer(playerId); if (old) removeOwned(old); }
  function deliverDialogue(ticket, sameTickDeferrals = 0) {
    const { session, selectionTag, action, diagnostic } = ticket;
    let stage = STAGE.queue, player;
    try {
      if (deliveries.get(session.playerId) !== ticket) {
        failure(STAGE.queue, session.entryIndex, `DIALOGUE_TICKET_CANCELED session=${session.id}`); return;
      }
      // runTimeout(1) may run in the same tick when called from an after-event.
      // Permit one bounded reschedule, never a same-tick open or a placement retry.
      if (system.currentTick <= ticket.placedTick) {
        if (sameTickDeferrals >= 1) throw new Error('TICK_DID_NOT_ADVANCE');
        system.runTimeout(() => deliverDialogue(ticket, 1), 1); return;
      }
      stage = STAGE.player;
      player = entity(session.playerId);
      if (!validPlayer(player) || player.dimension.id !== session.dimensionId) throw new Error('DEFERRED_PLAYER_OR_DIMENSION_CHANGED');
      stage = STAGE.session;
      const current = sessions.getPlayer(session.playerId), npc = entity(session.npcId);
      if (current?.id !== session.id || current.npcId !== session.npcId || current.dimensionId !== session.dimensionId) throw new Error('DEFERRED_SESSION_CHANGED');
      if (!npc?.isValid || npc.typeId !== NPC_TYPE || npc.dimension.id !== session.dimensionId || !npc.hasTag(OWNER_TAG) || npc.getDynamicProperty(SESSION_KEY) !== session.id || npc.getDynamicProperty(OWNER_KEY) !== session.playerId) throw new Error('DEFERRED_NPC_IDENTITY_CHANGED');
      const selected = player.dimension.getEntities({ type: NPC_TYPE, tags: [selectionTag] });
      if (selected.length !== 1 || selected[0].id !== session.npcId) throw new Error('Deferred NPC selector is not unique');
      stage = STAGE.dialogue;
      const commandTick = system.currentTick;
      deliveries.set(session.playerId, Object.freeze({ ...ticket, commandTick }));
      const result = player.runCommand(`dialogue open @e[type=${NPC_TYPE},tag=${selectionTag},c=1] @s`);
      if (result.successCount < 1) throw new Error('Dialogue open was not accepted');
      warn(`[NewUI ${ADDON_VERSION}] stage=${STAGE.dialogue} entry=${String(session.entryIndex).padStart(2, '0')} session=${session.id} action=${action} placedTick=${ticket.placedTick} openTick=${commandTick} delayTicks=${commandTick - ticket.placedTick} command=accepted display=unverified`);
      if (diagnostic) tell(player, `[NewUI ${ADDON_VERSION}] 대화 요청을 게임에 전달했어요. 화면 표시는 아직 확인되지 않았어요.`);
      stage = STAGE.session;
      player.setDynamicProperty(PAGE_KEY, session.entryIndex);
      const animation = action === 'prev' ? 'turn_left' : action === 'next' ? 'turn_right' : 'open';
      try { npc.playAnimation(`animation.newui.codex.${animation}`, { players: [player] }); }
      catch (error) { warn(`[NewUI ${ADDON_VERSION}] Animation not applied: ${String(error).slice(0, 180)}`); }
    } catch (error) {
      sessions.close(session); removeOwned(session);
      failure(stage, session.entryIndex, error, player ?? entity(session.playerId));
    }
  }
  function present(player, entryIndex, action = 'open', diagnostic = false) {
    if (!validPlayer(player)) { failure(STAGE.player, entryIndex, 'PLAYER_UNAVAILABLE'); return false; }
    let npc, session, candidates = [];
    let stage = STAGE.player;
    const previous = sessions.getPlayer(player.id);
    try {
      const dimension = player.dimension, location = player.location;
      const anchor = { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };
      stage = STAGE.place;
      // place() returns void and may queue unloaded chunks. Only attempt this
      // one-block template in a currently loaded block; never adopt a later NPC.
      if (!dimension.getBlock(anchor)) throw new Error('Structure anchor is not loaded');
      const entry = `entry_${String(entryIndex).padStart(2, '0')}`;
      const query = { type: NPC_TYPE, tags: [TEMPLATE_TAG, `newui.codex.${entry}`], location: anchor, maxDistance: 2 };
      const before = new Set(dimension.getEntities(query).map(candidate => candidate.id));
      let placementError;
      try { world.structureManager.place(`newui:${entry}`, dimension, anchor, { includeBlocks: false, includeEntities: true, waterlogged: false }); }
      catch (error) { placementError = error; }
      // Query even after a thrown placement: the engine may have created an
      // entity before failing. Only the observed ID difference may be cleaned.
      stage = placementError ? STAGE.place : STAGE.candidate;
      candidates = dimension.getEntities(query).filter(candidate => !before.has(candidate.id));
      if (placementError) throw placementError;
      stage = STAGE.candidate;
      if (candidates.length !== 1) throw new Error(`Expected one new NPC template, found ${candidates.length}`);
      npc = candidates[0];
      if (!npc.isValid || npc.hasTag(OWNER_TAG) || npc.getDynamicProperty(SESSION_KEY) !== undefined || npc.getDynamicProperty(OWNER_KEY) !== undefined || sessions.getNpc(npc.id)) throw new Error('NPC template has an existing ownership identity');
      stage = STAGE.session;
      npc.addTag(OWNER_TAG);
      const selectionTag = `newui_page_${prefix}_${++tagSequence}`;
      npc.addTag(selectionTag);
      ({ session } = sessions.replace({ playerId: player.id, npcId: npc.id, dimensionId: dimension.id, entryIndex, tick: system.currentTick }));
      npc.setDynamicProperty(SESSION_KEY, session.id);
      npc.setDynamicProperty(OWNER_KEY, player.id);
      stage = STAGE.queue;
      const ticket = Object.freeze({ session, selectionTag, action, diagnostic, placedTick: system.currentTick });
      deliveries.set(player.id, ticket);
      system.runTimeout(() => deliverDialogue(ticket), 1);
      return true;
    } catch (error) {
      if (session || previous) sessions.close(session ?? previous);
      if (deliveries.get(player.id)?.session.id === session?.id) deliveries.delete(player.id);
      // Includes partial placement and initialization failures. An older template
      // at the same location was in before and is never a cleanup candidate.
      for (const candidate of candidates) cleanupCandidate(candidate.id, player.id, candidate.id === npc?.id ? session?.id : undefined);
      failure(stage, entryIndex, error, player);
      return false;
    } finally { if (previous) removeOwned(previous); }
  }
  function queueAction(player, action, { notifyRejected = true, diagnostic = false } = {}) {
    if (!validPlayer(player)) { failure(STAGE.player, undefined, 'QUEUE_REJECTED_PLAYER'); return false; }
    if (pending.has(player.id) || (deliveries.has(player.id) && deliveries.get(player.id).commandTick === undefined)) { failure(STAGE.queue, undefined, 'QUEUE_REJECTED_PENDING', notifyRejected ? player : undefined, '이미 처리 중인 요청이 있어요.'); return false; }
    const playerId = player.id, ticket = {};
    pending.set(playerId, ticket);
    try { system.run(() => {
      if (pending.get(playerId) !== ticket) { failure(STAGE.queue, undefined, 'QUEUE_CANCELED'); return; }
      pending.delete(playerId);
      const live = entity(playerId);
      try {
        if (!validPlayer(live)) { failure(STAGE.player, undefined, 'QUEUED_PLAYER_UNAVAILABLE', player); return; }
        if (action === 'book') giveBook(live);
        else present(live, sessions.entryIndex(live.getDynamicProperty(PAGE_KEY)), 'open', diagnostic);
      } catch (error) { failure(STAGE.player, undefined, error, live); }
    }); } catch (error) {
      if (pending.get(playerId) === ticket) pending.delete(playerId);
      failure(STAGE.queue, undefined, error, notifyRejected ? player : undefined); return false;
    }
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
      const commandTick = deliveries.get(player.id)?.commandTick;
      warn(`[NewUI ${ADDON_VERSION}] close=received entry=${String(current.entryIndex).padStart(2, '0')} session=${current.id} tick=${system.currentTick} sincePlace=${system.currentTick - current.tick} sinceCommand=${commandTick === undefined ? 'pending' : system.currentTick - commandTick}`);
      // A navigation event can run before or after on_close in the same tick.
      // The immutable NPC/session ticket cannot remove a replacement page.
      system.runTimeout(() => {
        const closed = sessions.close(current);
        warn(`[NewUI ${ADDON_VERSION}] close=${closed ? 'applied' : 'stale'} session=${current.id} tick=${system.currentTick}`);
        if (closed) removeOwned(closed);
      }, 2);
      return true;
    }
    if (deliveries.get(player.id)?.commandTick === undefined) return false;
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
  return Object.freeze({ queueOpen: (player, options) => queueAction(player, 'open', options), queueBook: (player, options) => queueAction(player, 'book', options), giveBook, handleScriptEvent, endPlayer, sweep, sessions });
}
