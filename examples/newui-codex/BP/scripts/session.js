const isId = value => typeof value === 'string' && value.length > 0 && value.length < 256;
export const ACTIONS = Object.freeze(['forest', 'meadow', 'cave', 'slot0', 'slot1', 'slot2', 'slot3', 'prev', 'next']);

export function createSessions(catalog, prefix = 'session') {
  if (!Array.isArray(catalog.entries) || catalog.entries.length !== 12 || !Array.isArray(catalog.categories) || catalog.categories.length !== 3) throw new Error('Expected twelve entries in three categories');
  const entries = Object.freeze(catalog.entries.map((entry, index) => {
    if (entry.category !== Math.floor(index / 4) || !isId(entry.id)) throw new Error('Entries must be grouped as four per category');
    return Object.freeze({ ...entry, index });
  }));
  const byPlayer = new Map(), byNpc = new Map(), lastInput = new Map();
  let sequence = 0;
  const match = (playerId, npcId, sessionId) => {
    const current = byPlayer.get(playerId);
    return current && current.npcId === npcId && current.id === sessionId && byNpc.get(npcId) === current ? current : undefined;
  };
  const remove = session => {
    if (!session || !match(session.playerId, session.npcId, session.id)) return undefined;
    byPlayer.delete(session.playerId); byNpc.delete(session.npcId); return session;
  };
  return Object.freeze({
    getPlayer: playerId => byPlayer.get(playerId),
    getNpc: npcId => byNpc.get(npcId),
    all: () => [...byPlayer.values()],
    entryIndex: value => Number.isInteger(value) && value >= 0 && value < entries.length ? value : 0,
    replace({ playerId, npcId, dimensionId, entryIndex, tick }) {
      if (![playerId, npcId, dimensionId].every(isId) || !Number.isSafeInteger(tick) || tick < 0 || !Number.isInteger(entryIndex) || !entries[entryIndex]) throw new Error('Invalid session identity or entry');
      if (byNpc.has(npcId)) throw new Error('NPC already owns a session');
      const previous = byPlayer.get(playerId);
      const session = Object.freeze({ id: `${prefix}_${++sequence}`, playerId, npcId, dimensionId, entryIndex, entry: entries[entryIndex], tick, locked: false });
      remove(previous); byPlayer.set(playerId, session); byNpc.set(npcId, session);
      return { session, previous };
    },
    consume({ playerId, npcId, sessionId, action, tick }) {
      const session = match(playerId, npcId, sessionId);
      if (!session || session.locked || !ACTIONS.includes(action) || !Number.isSafeInteger(tick) || tick < session.tick || (lastInput.get(playerId) ?? -1) >= tick) return undefined;
      let entryIndex = session.entryIndex;
      const category = ['forest', 'meadow', 'cave'].indexOf(action);
      if (category >= 0) entryIndex = category * 4;
      else if (action.startsWith('slot')) entryIndex = session.entry.category * 4 + Number(action.slice(4));
      else entryIndex = (entryIndex + (action === 'next' ? 1 : 11)) % 12;
      const locked = Object.freeze({ ...session, locked: true });
      byPlayer.set(playerId, locked); byNpc.set(npcId, locked); lastInput.set(playerId, tick);
      return Object.freeze({ session: locked, entryIndex });
    },
    close: ticket => remove(ticket),
    endPlayer(playerId) { const removed = remove(byPlayer.get(playerId)); lastInput.delete(playerId); return removed; },
  });
}
