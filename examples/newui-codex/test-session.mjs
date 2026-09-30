import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ADDON_VERSION, CATALOG } from './BP/scripts/catalog.js';
import { ACTIONS, createSessions } from './BP/scripts/session.js';
import { BOOK_TYPE, NPC_TYPE, OWNER_TAG, createCodexController } from './BP/scripts/controller.js';
import { assertCodexBpContract } from './bp-contract.mjs';
import { decodeStructure, encodeStructure } from './structure-nbt.mjs';

let cases = 0;
const test = (name, run) => { run(); cases++; };
function fixture() {
  const entities = new Map(), dimensions = new Map(), jobs = [], warnings = [], commands = [], placements = [];
  let count = 0;
  const system = {
    currentTick: 0,
    run(fn) { jobs.push({ due: this.currentTick + 1, fn }); },
    runTimeout(fn, ticks) { jobs.push({ due: this.currentTick + ticks, fn }); },
    advance(ticks = 1) { for (let i = 0; i < ticks; i++) { this.currentTick++; const ready = jobs.filter(job => job.due <= this.currentTick); for (const job of ready) { jobs.splice(jobs.indexOf(job), 1); job.fn(); } } },
  };
  function makeEntity(typeId, dimension, id = `npc-${++count}`) {
    const tags = new Set(), properties = new Map();
    const entity = { id, typeId, dimension, location: { x: 0, y: 0, z: 0 }, isValid: true, tags, properties, animations: [],
      addTag: tag => tags.add(tag), hasTag: tag => tags.has(tag),
      setDynamicProperty: (key, value) => properties.set(key, value), getDynamicProperty: key => properties.get(key),
      remove() { this.isValid = false; entities.delete(id); },
      playAnimation(name, options) { this.animations.push({ name, options }); },
    };
    entities.set(id, entity); return entity;
  }
  for (const name of ['overworld', 'nether', 'the_end']) {
    const dimension = { id: `minecraft:${name}`,
      spawnEntity(typeId) { return makeEntity(typeId, dimension); },
      getBlock() { return {}; },
      getEntities({ type, tags = [], location, maxDistance = Infinity }) { return [...entities.values()].filter(e => e.dimension === dimension && e.typeId === type && tags.every(tag => e.hasTag(tag)) && (!location || Math.hypot(e.location.x - location.x, e.location.y - location.y, e.location.z - location.z) <= maxDistance)); },
    };
    dimensions.set(name, dimension);
  }
  const world = { getEntity: id => entities.get(id), getDimension: id => dimensions.get(id), structureManager: {
    place(id, dimension, location, options) {
      assert.match(id, /^newui:entry_\d{2}$/);
      placements.push({ id, dimensionId: dimension.id, location: { ...location }, options: { ...options } });
      const npc = dimension.spawnEntity(NPC_TYPE);
      npc.location = { x: location.x + 0.5, y: location.y, z: location.z + 0.5 };
      npc.addTag('newui.codex.template'); npc.addTag(`newui.codex.${id.split(':')[1]}`);
    },
  } };
  function player(id) {
    const p = makeEntity('minecraft:player', dimensions.get('overworld'), id), slots = new Array(3);
    p.location = { x: 1, y: 70, z: 2 }; p.messages = []; p.name = 'name" with selector @a';
    p.container = { size: slots.length, slots, getItem: i => slots[i], firstEmptySlot: () => { for (let i = 0; i < slots.length; i++) if (slots[i] === undefined) return i; return undefined; }, setItem: (i, item) => { assert.equal(slots[i], undefined, 'Occupied slots are never overwritten'); slots[i] = item; } };
    p.getComponent = key => key === 'minecraft:inventory' ? { container: p.container } : undefined;
    p.sendMessage = message => p.messages.push(message);
    p.runCommand = command => { commands.push({ playerId: p.id, command }); if (p.failCommand) throw new Error('fixture open failure'); return { successCount: p.commandCount ?? 1 }; };
    return p;
  }
  const a = player('player-a'), b = player('player-b');
  const controller = createCodexController({ world, system, makeItem: typeId => ({ typeId, amount: 1 }), warn: text => warnings.push(text), prefix: 'test' });
  const open = p => { assert.equal(controller.queueOpen(p), true); system.advance(2); return controller.sessions.getPlayer(p.id); };
  const event = (p, npcId, action, id = 'newui:navigate') => ({ id, sourceEntity: entities.get(npcId), initiator: p, message: action });
  return { ...controller, controller, a, b, open, event, entities, dimensions, world, system, warnings, commands, placements, makeEntity };
}

test('catalog and session snapshots stay immutable', () => {
  const input = structuredClone(CATALOG), store = createSessions(input);
  const { session } = store.replace({ playerId: 'p', npcId: 'n', dimensionId: 'd', entryIndex: 0, tick: 0 });
  input.entries[0].category = 2; input.entries[0].description = 'modified';
  assert.equal(session.entry.category, 0); assert.notEqual(session.entry.description, 'modified');
  assert.ok(Object.isFrozen(session) && Object.isFrozen(session.entry));
  assert.throws(() => { session.entry.category = 1; });
});
test('internal action routes and bounds retain legacy prev/next support', () => {
  const expected = [0, 4, 8, 4, 5, 6, 7, 4, 6];
  ACTIONS.forEach((action, index) => {
    const store = createSessions(CATALOG), { session } = store.replace({ playerId: 'p', npcId: 'n', dimensionId: 'd', entryIndex: 5, tick: 0 });
    assert.equal(store.consume({ playerId: 'p', npcId: 'n', sessionId: session.id, action, tick: 1 }).entryIndex, expected[index]);
  });
  for (const [entryIndex, action, expectedIndex] of [[0, 'prev', 11], [11, 'next', 0]]) {
    const store = createSessions(CATALOG), { session } = store.replace({ playerId: 'p', npcId: 'n', dimensionId: 'd', entryIndex, tick: 0 });
    assert.equal(store.consume({ playerId: 'p', npcId: 'n', sessionId: session.id, action, tick: 1 }).entryIndex, expectedIndex);
  }
});
test('unknown, stale, cross-player, duplicate and reentrant input', () => {
  const store = createSessions(CATALOG), { session } = store.replace({ playerId: 'p', npcId: 'n', dimensionId: 'd', entryIndex: 0, tick: 2 });
  const valid = { playerId: 'p', npcId: 'n', sessionId: session.id, action: 'next', tick: 3 };
  for (const extra of [{ playerId: 'q' }, { npcId: 'other' }, { sessionId: 'old' }, { action: 'slot4' }, { action: '__proto__' }, { tick: 1 }, { tick: NaN }]) assert.equal(store.consume({ ...valid, ...extra }), undefined);
  assert.ok(store.consume(valid)); assert.equal(store.consume({ ...valid, tick: 4 }), undefined, 'Locked snapshot rejects reentrancy');
  const next = store.replace({ playerId: 'p', npcId: 'n2', dimensionId: 'd', entryIndex: 1, tick: 3 }).session;
  assert.equal(store.consume({ ...valid, npcId: 'n2', sessionId: next.id }), undefined, 'Same tick input rejected across replacement');
  assert.equal(store.close(session), undefined, 'Old close cannot remove replacement');
});
test('two players have independent NPCs and explicit command targets', () => {
  const f = fixture(), a = f.open(f.a), b = f.open(f.b);
  assert.notEqual(a.npcId, b.npcId);
  assert.equal(f.handleScriptEvent(f.event(f.b, a.npcId, 'next')), false);
  assert.equal(f.sessions.getPlayer(f.a.id).entryIndex, 0);
  for (const { command } of f.commands) {
    assert.match(command, /^dialogue open @e\[type=newui:codex,tag=newui_page_test_\d+,c=1\] @s$/);
    assert.ok(!command.includes(f.a.name) && !command.includes('@p'));
  }
});
test('structure placement uses a loaded floor anchor and entities-only options', () => {
  const f = fixture(); f.a.location = { x: -1.2, y: 70.8, z: 2.9 }; f.a.setDynamicProperty('newui:entry', 11);
  const current = f.open(f.a);
  assert.equal(current.entryIndex, 11);
  assert.deepEqual(f.placements, [{ id: 'newui:entry_11', dimensionId: 'minecraft:overworld', location: { x: -2, y: 70, z: 2 }, options: { includeBlocks: false, includeEntities: true, waterlogged: false } }]);
  assert.ok(f.commands[0].command.endsWith(' @s'), 'Embedded NPC Actions are opened without a scene name');
});
test('simultaneous queued opens at the same position claim different loaded NPCs', () => {
  const f = fixture(); f.queueOpen(f.a); f.queueOpen(f.b); f.system.advance();
  const a = f.sessions.getPlayer(f.a.id), b = f.sessions.getPlayer(f.b.id);
  assert.notEqual(a.npcId, b.npcId); assert.equal(f.placements.length, 2);
  assert.equal(f.entities.get(a.npcId).getDynamicProperty('newui:owner'), f.a.id);
  assert.equal(f.entities.get(b.npcId).getDynamicProperty('newui:owner'), f.b.id);
});
test('an existing template at the load position is never adopted or deleted', () => {
  const f = fixture(), old = f.makeEntity(NPC_TYPE, f.a.dimension);
  old.location = { ...f.a.location }; old.addTag('newui.codex.template'); old.addTag('newui.codex.entry_00');
  const current = f.open(f.a); assert.notEqual(current.npcId, old.id);
  f.endPlayer(f.a.id); assert.equal(old.isValid, true); assert.equal(old.getDynamicProperty('newui:owner'), undefined);
});
test('zero loaded candidates fail closed without adopting an existing template', () => {
  const f = fixture(), old = f.makeEntity(NPC_TYPE, f.a.dimension);
  old.location = { ...f.a.location }; old.addTag('newui.codex.template'); old.addTag('newui.codex.entry_00');
  f.world.structureManager.place = () => {};
  assert.equal(f.open(f.a), undefined); assert.equal(old.isValid, true); assert.equal(f.commands.length, 0);
  assert.ok(f.warnings.some(message => message.includes('found 0')));
});
test('ambiguous loads clean only the two observed new candidates', () => {
  const f = fixture(), old = f.makeEntity(NPC_TYPE, f.a.dimension), unmanaged = f.makeEntity(NPC_TYPE, f.a.dimension);
  old.location = unmanaged.location = { ...f.a.location }; old.addTag('newui.codex.template'); old.addTag('newui.codex.entry_00');
  const place = f.world.structureManager.place;
  f.world.structureManager.place = (...args) => { place(...args); place(...args); };
  assert.equal(f.open(f.a), undefined); assert.equal(f.commands.length, 0);
  assert.equal(old.isValid, true); assert.equal(unmanaged.isValid, true);
  assert.deepEqual([...f.entities.values()].filter(entity => entity.typeId === NPC_TYPE).map(entity => entity.id), [old.id, unmanaged.id]);
});
test('partial placement then throw cleans the observed entity and leaves another player intact', () => {
  const f = fixture(), b = f.open(f.b), place = f.world.structureManager.place;
  f.world.structureManager.place = (...args) => { place(...args); throw new Error('partial structure load'); };
  assert.equal(f.open(f.a), undefined); assert.equal(f.sessions.getPlayer(f.b.id).id, b.id);
  assert.deepEqual([...f.entities.values()].filter(entity => entity.typeId === NPC_TYPE).map(entity => entity.id), [b.npcId]);
});
test('an unloaded anchor prevents placement and failed navigation closes the old snapshot', () => {
  const f = fixture(), a = f.open(f.a), b = f.open(f.b), count = f.placements.length;
  f.a.dimension.getBlock = () => undefined; f.system.advance();
  assert.equal(f.handleScriptEvent(f.event(f.a, a.npcId, 'next')), true);
  assert.equal(f.placements.length, count); assert.equal(f.sessions.getPlayer(f.a.id), undefined);
  assert.equal(f.entities.has(a.npcId), false); assert.equal(f.sessions.getPlayer(f.b.id).id, b.id);
});
test('a newly observed entity carrying someone else\'s ownership is preserved', () => {
  const f = fixture(), place = f.world.structureManager.place;
  f.world.structureManager.place = (...args) => {
    place(...args);
    const candidate = [...f.entities.values()].find(entity => entity.typeId === NPC_TYPE);
    candidate.setDynamicProperty('newui:owner', 'someone-else'); candidate.setDynamicProperty('newui:session', 'other-session');
  };
  assert.equal(f.open(f.a), undefined); assert.equal(f.commands.length, 0);
  assert.equal([...f.entities.values()].filter(entity => entity.typeId === NPC_TYPE).length, 1);
});
test('navigation rotates NPC, preserves page and links animation', () => {
  const f = fixture(), original = f.open(f.a), originalNpc = f.entities.get(original.npcId);
  assert.equal(originalNpc.animations[0].name, 'animation.newui.codex.open');
  f.system.advance(); assert.equal(f.handleScriptEvent(f.event(f.a, original.npcId, 'next')), true);
  const next = f.sessions.getPlayer(f.a.id);
  assert.equal(next.entryIndex, 1); assert.notEqual(next.npcId, original.npcId); assert.equal(originalNpc.isValid, false);
  f.system.advance();
  assert.equal(f.a.getDynamicProperty('newui:entry'), 1);
  const animation = f.entities.get(next.npcId).animations[0];
  assert.equal(animation.name, 'animation.newui.codex.turn_right'); assert.deepEqual(animation.options.players, [f.a]);
  assert.equal(f.handleScriptEvent({ id: 'newui:navigate', sourceEntity: originalNpc, initiator: f.a, message: 'next' }), false);
});
test('close-before-navigation race keeps replacement and close-after-navigation removes only current', () => {
  const f = fixture(), initial = f.open(f.a);
  assert.equal(f.handleScriptEvent(f.event(f.a, initial.npcId, 'close', 'newui:close')), true);
  assert.equal(f.handleScriptEvent(f.event(f.a, initial.npcId, 'next')), true);
  const next = f.sessions.getPlayer(f.a.id); f.system.advance(2);
  assert.equal(f.sessions.getPlayer(f.a.id).id, next.id);
  assert.equal(f.handleScriptEvent(f.event(f.a, next.npcId, 'wrong', 'newui:close')), false);
  assert.equal(f.handleScriptEvent(f.event(f.a, next.npcId, 'close', 'newui:close')), true);
  f.system.advance(2); assert.equal(f.sessions.getPlayer(f.a.id), undefined); assert.equal(f.entities.has(next.npcId), false);
});
test('close ticket cannot remove a newly opened session', () => {
  const f = fixture(), old = f.open(f.a);
  f.handleScriptEvent(f.event(f.a, old.npcId, 'close', 'newui:close'));
  f.endPlayer(f.a.id); const next = f.open(f.a); f.system.advance(2);
  assert.equal(f.sessions.getPlayer(f.a.id).id, next.id);
});
test('cancelled queued open cannot consume a later request', () => {
  const f = fixture(); assert.equal(f.queueOpen(f.a), true); assert.equal(f.queueOpen(f.a), false);
  f.endPlayer(f.a.id); assert.equal(f.queueOpen(f.a), true); f.system.advance(2);
  assert.equal(f.commands.length, 1); assert.equal(f.sessions.all().length, 1);
});
test('book grant preserves full inventory, handles index zero and prevents duplicate grant', () => {
  const f = fixture(), occupied = [{ typeId: 'minecraft:stone', amount: 64 }, { typeId: 'minecraft:apple', amount: 7 }, { typeId: 'minecraft:diamond', amount: 3 }];
  f.a.container.slots.splice(0, 3, ...occupied); const before = structuredClone(f.a.container.slots);
  assert.equal(f.giveBook(f.a), false); assert.deepEqual(f.a.container.slots, before);
  f.a.container.slots[0] = undefined; assert.equal(f.giveBook(f.a), true); assert.equal(f.a.container.slots[0].typeId, BOOK_TYPE);
  assert.deepEqual(f.a.container.slots.slice(1), before.slice(1)); assert.equal(f.giveBook(f.a), false);
});
test('no grants or auto-open on lifecycle cleanup; stale scheduled grant is cancelled', () => {
  const f = fixture(); f.queueBook(f.a); f.endPlayer(f.a.id); f.system.advance();
  assert.ok(f.a.container.slots.every(item => item === undefined)); assert.equal(f.commands.length, 0);
  f.a.setDynamicProperty('newui:entry', 9); const s = f.open(f.a); assert.equal(s.entryIndex, 9);
  f.endPlayer(f.a.id); assert.equal(f.sessions.all().length, 0); assert.equal(f.a.getDynamicProperty('newui:entry'), 9);
});
test('dimension changes, inactivity and loaded orphan NPCs only clean owned entities', () => {
  const f = fixture(), s = f.open(f.a), b = f.open(f.b);
  f.a.dimension = f.dimensions.get('nether'); f.sweep(); assert.equal(f.entities.has(s.npcId), false); assert.ok(f.entities.has(b.npcId));
  const orphan = f.makeEntity(NPC_TYPE, f.dimensions.get('overworld')); orphan.addTag(OWNER_TAG); orphan.setDynamicProperty('newui:session', 'orphan'); orphan.setDynamicProperty('newui:owner', 'gone');
  const unmanaged = f.makeEntity(NPC_TYPE, f.dimensions.get('overworld'));
  const unrelated = f.makeEntity('minecraft:npc', f.dimensions.get('overworld')); unrelated.addTag(OWNER_TAG);
  f.sweep(); assert.equal(orphan.isValid, false); assert.equal(unmanaged.isValid, true); assert.equal(unrelated.isValid, true);
  f.system.currentTick += 6000; f.sweep(); assert.equal(f.sessions.all().length, 0);
});
test('open failures remove candidates and old snapshots without affecting another player', () => {
  const f = fixture(), first = f.open(f.a), b = f.open(f.b); f.a.failCommand = true;
  f.system.advance(); f.handleScriptEvent(f.event(f.a, first.npcId, 'next')); f.system.advance();
  assert.equal(f.sessions.getPlayer(f.a.id), undefined); assert.equal(f.entities.has(first.npcId), false); assert.equal(f.sessions.getPlayer(f.b.id).id, b.id);
  assert.equal([...f.entities.values()].filter(e => e.typeId === NPC_TYPE).length, 1);
});
test('partial initialization retries only the candidate spawned by this controller', () => {
  const f = fixture(), dimension = f.dimensions.get('overworld');
  const unrelated = f.makeEntity(NPC_TYPE, dimension); unrelated.addTag(OWNER_TAG); unrelated.setDynamicProperty('newui:session', 'unrelated');
  let candidate, attempts = 0;
  dimension.spawnEntity = typeId => {
    candidate = f.makeEntity(typeId, dimension);
    const set = candidate.setDynamicProperty, remove = candidate.remove;
    candidate.setDynamicProperty = (key, value) => { if (key === 'newui:owner') throw new Error('owner write rejected'); set(key, value); };
    candidate.remove = function () { if (++attempts === 1) throw new Error('transient remove failure'); remove.call(this); };
    return candidate;
  };
  assert.equal(f.open(f.a), undefined); assert.equal(attempts, 1); assert.equal(candidate.isValid, true);
  assert.equal(candidate.getDynamicProperty('newui:owner'), undefined);
  f.sweep(); assert.equal(attempts, 2); assert.equal(candidate.isValid, false);
  assert.equal(unrelated.isValid, true, 'An incomplete external identity is not a cleanup candidate');
  f.sweep(); assert.equal(attempts, 2);
});
test('deferred cleanup refuses a changed candidate identity', () => {
  const f = fixture(), s = f.open(f.a), npc = f.entities.get(s.npcId);
  let attempts = 0;
  npc.remove = () => { attempts++; throw new Error('temporarily unavailable'); };
  f.endPlayer(f.a.id); assert.equal(attempts, 1);
  npc.setDynamicProperty('newui:owner', f.b.id);
  // A live replacement session prevents the ordinary orphan sweep from claiming it.
  f.sessions.replace({ playerId: f.b.id, npcId: npc.id, dimensionId: f.b.dimension.id, entryIndex: 0, tick: f.system.currentTick });
  f.sweep(); assert.equal(attempts, 1); assert.equal(npc.isValid, true);
});
test('orphan cleanup success also removes the failed retry ticket', () => {
  const f = fixture(), s = f.open(f.a), npc = f.entities.get(s.npcId), remove = npc.remove;
  let attempts = 0, lookups = 0;
  npc.remove = function () { if (++attempts <= 2) throw new Error('temporary remove failure'); remove.call(this); };
  f.endPlayer(f.a.id); f.sweep(); assert.equal(attempts, 3); assert.equal(npc.isValid, false);
  const lookup = f.world.getEntity;
  f.world.getEntity = id => { if (id === npc.id) lookups++; return lookup(id); };
  f.sweep(); assert.equal(lookups, 0, 'Removed NPC has no historical retry ticket');
});
test('unavailable cleanup IDs have a bounded retry lifetime', () => {
  const f = fixture(), s = f.open(f.a), npc = f.entities.get(s.npcId);
  npc.remove = () => { throw new Error('temporary remove failure'); };
  f.endPlayer(f.a.id); f.entities.delete(npc.id);
  let lookups = 0; const lookup = f.world.getEntity;
  f.world.getEntity = id => { if (id === npc.id) lookups++; return lookup(id); };
  f.sweep(); assert.equal(lookups, 1);
  f.system.currentTick += 6000; f.sweep(); f.sweep();
  assert.equal(lookups, 1); assert.equal(f.warnings.filter(message => message.includes('retry expired')).length, 1);
});
test('queued saved-page read failure remains contained', () => {
  const f = fixture(); f.a.getDynamicProperty = () => { throw new Error('player became unavailable'); };
  f.queueOpen(f.a); assert.doesNotThrow(() => f.system.advance());
  assert.equal(f.sessions.all().length, 0); assert.equal(f.commands.length, 0);
  assert.ok(f.warnings.some(w => w.includes('stage=플레이어확인') && w.includes('player became unavailable')));
  assert.ok(f.a.messages.some(message => message.includes(ADDON_VERSION) && message.includes('플레이어확인')));
});
test('forged event sources, missing initiator and altered ownership are ignored', () => {
  const f = fixture(), s = f.open(f.a), npc = f.entities.get(s.npcId);
  assert.equal(f.handleScriptEvent({ id: 'newui:navigate', sourceEntity: f.a, initiator: f.a, message: 'next' }), false);
  assert.equal(f.handleScriptEvent({ id: 'newui:navigate', sourceEntity: npc, message: 'next' }), false);
  npc.setDynamicProperty('newui:owner', f.b.id); assert.equal(f.handleScriptEvent(f.event(f.a, npc.id, 'next')), false);
  f.endPlayer(f.a.id); assert.equal(npc.isValid, true, 'Removal refuses an identity that no longer belongs to this session');
});
test('invalid saved pages use the first entry', () => {
  for (const invalid of [-1, 12, NaN, '0', 'newui:entry_99', undefined]) {
    const f = fixture(); f.a.setDynamicProperty('newui:entry', invalid); assert.equal(f.open(f.a).entryIndex, 0);
  }
});
test('rejected item requests and canceled or missing-player callbacks leave diagnostics', () => {
  const f = fixture(); assert.equal(f.queueOpen(f.a), true); assert.equal(f.queueOpen(f.a), false);
  assert.ok(f.a.messages.some(message => message.includes('이미 처리 중')));
  f.endPlayer(f.a.id); f.system.advance();
  assert.ok(f.warnings.some(message => message.includes('QUEUE_CANCELED')));
  assert.equal(f.queueOpen(f.a), true); f.entities.delete(f.a.id); f.system.advance();
  assert.ok(f.warnings.some(message => message.includes('QUEUED_PLAYER_UNAVAILABLE')));
  assert.equal(f.commands.length, 0); assert.equal(f.sessions.all().length, 0);
});
test('failed scheduling releases the pending ticket for another request', () => {
  const f = fixture(), run = f.system.run;
  f.system.run = () => { throw new Error('schedule unavailable'); };
  assert.equal(f.queueOpen(f.a), false);
  assert.ok(f.warnings.some(message => message.includes('stage=예약') && message.includes('schedule unavailable')));
  f.system.run = run; assert.equal(f.queueOpen(f.a), true); f.system.advance();
  assert.equal(f.sessions.all().length, 1);
});
test('opening failures report the actual bounded stage and build to a valid player', () => {
  const changes = [
    ['구조체배치', f => { f.world.structureManager.place = () => { throw new Error('place rejected'); }; }],
    ['새NPC확인', f => { f.world.structureManager.place = () => {}; }],
    ['세션등록', f => { const spawn = f.a.dimension.spawnEntity; f.a.dimension.spawnEntity = type => { const npc = spawn(type); npc.setDynamicProperty = () => { throw new Error('property rejected'); }; return npc; }; }],
    ['대화열기', f => { f.a.runCommand = () => { throw new Error('x'.repeat(2000) + '\nsecond line'); }; }],
  ];
  for (const [stage, change] of changes) {
    const f = fixture(); change(f); assert.equal(f.open(f.a), undefined);
    const diagnostic = f.warnings.find(message => message.includes(`stage=${stage}`));
    assert.ok(diagnostic?.includes(`NewUI ${ADDON_VERSION}`) && diagnostic.includes('entry=00'));
    assert.ok(diagnostic.length < 300 && !diagnostic.includes('\n'));
    assert.ok(f.a.messages.some(message => message.includes(stage) && message.includes(ADDON_VERSION)));
    assert.ok(!f.warnings.some(message => message.includes('command=accepted')));
  }
});
test('accepted dialogue command is explicitly unverified and diagnostic chat is opt-in', () => {
  const f = fixture(); f.queueOpen(f.a, { diagnostic: true }); f.system.advance(2);
  assert.equal(f.warnings.filter(message => message.includes('command=accepted display=unverified')).length, 1);
  assert.equal(f.a.messages.filter(message => message.includes('대화 요청을 게임에 전달')).length, 1);
  f.open(f.b); assert.ok(!f.b.messages.some(message => message.includes('대화 요청을 게임에 전달')));
});
test('placement is claimed immediately but dialogue waits one elapsed tick', () => {
  const f = fixture(); f.queueOpen(f.a); f.system.advance();
  const current = f.sessions.getPlayer(f.a.id), npc = f.entities.get(current.npcId);
  assert.equal(npc.getDynamicProperty('newui:owner'), f.a.id); assert.equal(f.commands.length, 0);
  assert.equal(f.queueOpen(f.a), false);
  assert.equal(f.handleScriptEvent(f.event(f.a, npc.id, 'next')), false);
  f.system.advance(); assert.equal(f.commands.length, 1);
  assert.ok(f.warnings.some(message => message.includes('delayTicks=1') && message.includes(`session=${current.id}`)));
});
test('cancelled delayed dialogue cannot open or remove a replacement session', () => {
  const f = fixture(); f.queueOpen(f.a); f.system.advance();
  const old = f.sessions.getPlayer(f.a.id); f.endPlayer(f.a.id); f.queueOpen(f.a); f.system.advance();
  const replacement = f.sessions.getPlayer(f.a.id);
  assert.notEqual(old.id, replacement.id); assert.equal(f.entities.has(old.npcId), false); assert.equal(f.commands.length, 0);
  f.system.advance(); assert.equal(f.commands.length, 1); assert.equal(f.sessions.getPlayer(f.a.id).id, replacement.id);
  assert.ok(f.warnings.some(message => message.includes('DIALOGUE_TICKET_CANCELED')));
});
test('deferred callbacks recheck player, dimension and NPC ownership', () => {
  for (const change of ['player', 'dimension', 'owner']) {
    const f = fixture(), b = f.open(f.b); f.queueOpen(f.a); f.system.advance();
    const current = f.sessions.getPlayer(f.a.id), npc = f.entities.get(current.npcId);
    if (change === 'player') f.a.isValid = false;
    if (change === 'dimension') f.a.dimension = f.dimensions.get('nether');
    if (change === 'owner') npc.setDynamicProperty('newui:owner', 'foreign-owner');
    f.system.advance(); assert.equal(f.commands.length, 1); assert.equal(f.sessions.getPlayer(f.a.id), undefined);
    assert.equal(f.sessions.getPlayer(f.b.id).id, b.id);
    assert.equal(npc.isValid, change === 'owner', 'Changed ownership must be preserved; other known candidates are cleaned');
  }
});
test('same-tick timer callbacks are bounded and cannot open in the placement tick', () => {
  for (const alwaysSameTick of [false, true]) {
    const f = fixture(), original = f.open(f.a), runTimeout = f.system.runTimeout;
    let calls = 0;
    f.system.runTimeout = (callback, ticks) => { calls++; if (alwaysSameTick || calls === 1) callback(); else runTimeout.call(f.system, callback, ticks); };
    assert.equal(f.handleScriptEvent(f.event(f.a, original.npcId, 'next')), true);
    assert.equal(calls, 2); assert.equal(f.commands.length, 1);
    f.system.advance(); assert.equal(f.commands.length, alwaysSameTick ? 1 : 2);
    if (alwaysSameTick) { assert.equal(f.sessions.getPlayer(f.a.id), undefined); assert.ok(f.warnings.some(message => message.includes('TICK_DID_NOT_ADVANCE'))); }
    else assert.ok(f.warnings.some(message => message.includes('action=next') && message.includes('delayTicks=1')));
  }
});
test('failed deferred scheduling removes the claimed candidate', () => {
  const f = fixture(); f.system.runTimeout = () => { throw new Error('deferred scheduling failed'); };
  assert.equal(f.open(f.a), undefined); assert.equal(f.commands.length, 0);
  assert.equal([...f.entities.values()].filter(entity => entity.typeId === NPC_TYPE).length, 0);
  assert.ok(f.warnings.some(message => message.includes('stage=예약') && message.includes('deferred scheduling failed')));
});
test('close diagnostics record receipt timing and the delayed exact-ticket result', () => {
  const f = fixture(), current = f.open(f.a);
  f.handleScriptEvent(f.event(f.a, current.npcId, 'close', 'newui:close'));
  assert.ok(f.warnings.some(message => message.includes('close=received') && message.includes('sinceCommand=0')));
  assert.ok(f.entities.has(current.npcId)); f.system.advance(2);
  assert.ok(f.warnings.some(message => message.includes(`close=applied session=${current.id}`)));
  assert.equal(f.entities.has(current.npcId), false);
});

// Load the real main module with only its API/import specifiers substituted.
// Registry callbacks, their return status, and the real controller all execute.
{
  const f = fixture(), commands = new Map(), items = new Map(), startup = [], logs = [];
  const signal = () => ({ subscribe() {} });
  f.world.afterEvents = { playerLeave: signal(), playerSpawn: signal(), playerDimensionChange: signal(), entityDie: signal() };
  f.system.beforeEvents = { startup: { subscribe: callback => startup.push(callback) } };
  f.system.afterEvents = { scriptEventReceive: signal() }; f.system.runInterval = () => {};
  const key = `__newuiApi_${Date.now()}`;
  globalThis[key] = { world: f.world, system: f.system, ItemStack: class { constructor(typeId, amount) { this.typeId = typeId; this.amount = amount; } }, CommandPermissionLevel: { Any: 0 }, CustomCommandStatus: { Success: 0, Failure: 1 } };
  const api = `const api=globalThis[${JSON.stringify(key)}];export const {world,system,ItemStack,CommandPermissionLevel,CustomCommandStatus}=api;`;
  const apiUrl = `data:text/javascript,${encodeURIComponent(api)}`;
  const source = (await readFile(new URL('BP/scripts/main.js', import.meta.url), 'utf8'))
    .replace("from '@minecraft/server'", `from '${apiUrl}'`)
    .replace("from './controller.js'", `from '${new URL('BP/scripts/controller.js', import.meta.url).href}'`)
    .replace("from './catalog.js'", `from '${new URL('BP/scripts/catalog.js', import.meta.url).href}'`);
  const previousWarn = console.warn; console.warn = message => logs.push(String(message));
  try {
    await import(`data:text/javascript,${encodeURIComponent(source)}`);
    startup[0]({ itemComponentRegistry: { registerCustomComponent: (id, callbacks) => items.set(id, callbacks) }, customCommandRegistry: { registerCommand: (spec, callback) => commands.set(spec.name, callback) } });
    test('real main reports startup once and returns failure for rejected requests', () => {
      assert.equal(logs.filter(message => message.includes(`NewUI ${ADDON_VERSION}`) && message.includes('startup transport=embedded-nbt')).length, 1);
      const open = commands.get('newui:open'), book = commands.get('newui:book');
      const accepted = open({ sourceEntity: f.a });
      assert.equal(accepted.status, 0); assert.ok(accepted.message.includes(ADDON_VERSION) && accepted.message.includes('요청을 접수'));
      assert.equal(open({ sourceEntity: f.a }).status, 1);
      assert.equal(book({ sourceEntity: f.a }).status, 1);
      assert.equal(open({}).status, 1);
      f.b.isValid = false; assert.equal(open({ sourceEntity: f.b }).status, 1); f.b.isValid = true;
      f.system.advance(2); assert.equal(f.commands.length, 1);
      assert.ok(f.a.messages.some(message => message.includes('대화 요청을 게임에 전달') && message.includes('아직 확인되지')));
      items.get('newui:open_codex').onUse({ source: f.b, itemStack: { typeId: BOOK_TYPE } });
      items.get('newui:open_codex').onUseOn({ source: f.b, itemStack: { typeId: BOOK_TYPE } });
      assert.ok(f.b.messages.some(message => message.includes('이미 처리 중')));
      f.system.advance(2); assert.equal(f.commands.length, 2);
      assert.ok(!f.b.messages.some(message => message.includes('대화 요청을 게임에 전달')));
    });
  } finally { console.warn = previousWarn; delete globalThis[key]; }
}

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const structureBytes = await Promise.all(CATALOG.entries.map((_, index) => readFile(new URL(`BP/structures/newui/entry_${String(index).padStart(2, '0')}.mcstructure`, import.meta.url))));
const structures = structureBytes.map(decodeStructure);
const npc = (await readJson('BP/entities/codex.json'))['minecraft:entity'];
assertCodexBpContract({ npc, structures, catalog: CATALOG });
const structureEntity = document => document.value.structure.value.entities.value.items[0];
test('NBT retains nine ordered buttons and a separate close event in all twelve entries', () => {
  structures.forEach((document, index) => {
    const actions = JSON.parse(structureEntity(document).Actions.value);
    assert.deepEqual(actions.filter(action => action.mode === 0).map(action => action.data[0].cmd_line), ACTIONS.map(action => `scriptevent newui:navigate ${action}`));
    assert.equal(actions.filter(action => action.mode === 1).length, 1);
    assert.deepEqual(encodeStructure(document), structureBytes[index]);
  });
});
test('close mode and button ordering cannot silently shift native indices', () => {
  for (const change of [actions => { actions[9].mode = 0; }, actions => { [actions[7], actions[8]] = [actions[8], actions[7]]; }, actions => actions.splice(6, 1)]) {
    const invalid = structuredClone(structures), target = structureEntity(invalid[0]), actions = JSON.parse(target.Actions.value);
    change(actions); target.Actions.value = JSON.stringify(actions);
    assert.throws(() => assertCodexBpContract({ npc, structures: invalid, catalog: CATALOG }), assert.AssertionError);
  }
});
test('boolean damage values cannot pass the target-client contract', () => {
  for (const value of [false, true, 0, undefined]) {
    const invalid = structuredClone(npc); invalid.components['minecraft:damage_sensor'].triggers[0].deals_damage = value;
    assert.throws(() => assertCodexBpContract({ npc: invalid, structures, catalog: CATALOG }), /deals_damage must be a string/);
  }
  for (const value of ['false', 'never', 'yes']) {
    const invalid = structuredClone(npc); invalid.components['minecraft:damage_sensor'].triggers[0].deals_damage = value;
    assert.throws(() => assertCodexBpContract({ npc: invalid, structures, catalog: CATALOG }), /documented "no" enum value/);
  }
});
test('structure ownership, type, entity count, text key and empty blocks are checked', () => {
  const changes = [
    doc => { structureEntity(doc).Actions.type = 3; },
    doc => { const e = structureEntity(doc); e.InteractiveText = e.InterativeText; delete e.InterativeText; },
    doc => { structureEntity(doc).Tags.value.items[0] = 'other.owner'; },
    doc => { doc.value.structure.value.entities.value.items.push(structuredClone(structureEntity(doc))); },
    doc => { doc.value.structure.value.block_indices.value.items[0].items[0] = 0; },
    doc => { structureEntity(doc).UniqueID = { type: 3, value: 42 }; },
  ];
  for (const change of changes) {
    const invalid = structuredClone(structures); change(invalid[0]);
    assert.throws(() => assertCodexBpContract({ npc, structures: invalid, catalog: CATALOG }), assert.AssertionError);
  }
});
test('truncated, trailing, wrong-endian and oversized NBT cannot pass the decoder', () => {
  const original = structureBytes[0];
  for (const invalid of [original.subarray(0, 4), original.subarray(0, original.length - 1), Buffer.concat([original, Buffer.from([0])]), Buffer.alloc(1024 * 1024 + 1)]) {
    assert.throws(() => decodeStructure(invalid), assert.AssertionError);
  }
  const wrongEndian = Buffer.from(original); wrongEndian[4] = 0; wrongEndian[5] = 14;
  assert.throws(() => decodeStructure(wrongEndian));
});
const manifest = await readJson('BP/manifest.json'), rp = await readJson('RP/manifest.json');
assert.deepEqual(manifest.header.version, [1, 0, 4]);
assert.equal(ADDON_VERSION, manifest.header.version.join('.'));
assert.deepEqual(manifest.dependencies.find(d => d.uuid), { uuid: rp.header.uuid, version: rp.header.version });
assert.deepEqual(manifest.dependencies.find(d => d.module_name), { module_name: '@minecraft/server', version: '2.1.0' });
assert.deepEqual((await readJson('BP/entities/codex.json'))['minecraft:entity'].components['minecraft:npc'].npc_data.skin_list, [{ variant: 0 }, { variant: 1 }]);
const itemComponents = (await readJson('BP/items/field_guide.json'))['minecraft:item'].components;
assert.equal(itemComponents['minecraft:icon'], 'newui:field_guide');
assert.equal(itemComponents['minecraft:allow_off_hand'], true);
assert.equal(itemComponents['minecraft:interact_button'], true);
console.log(JSON.stringify({ ok: true, sessionScenarios: cases, structures: structures.length, buttonsPerNpc: 9, runtimeVerified: false }));
