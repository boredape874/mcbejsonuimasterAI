import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG } from './BP/scripts/catalog.js';
import { ACTIONS, createSessions } from './BP/scripts/session.js';
import { BOOK_TYPE, NPC_TYPE, OWNER_TAG, createCodexController } from './BP/scripts/controller.js';

let cases = 0;
const test = (name, run) => { run(); cases++; };
function fixture() {
  const entities = new Map(), dimensions = new Map(), jobs = [], warnings = [], commands = [];
  let count = 0;
  const system = {
    currentTick: 0,
    run(fn) { jobs.push({ due: this.currentTick + 1, fn }); },
    runTimeout(fn, ticks) { jobs.push({ due: this.currentTick + ticks, fn }); },
    advance(ticks = 1) { for (let i = 0; i < ticks; i++) { this.currentTick++; const ready = jobs.filter(job => job.due <= this.currentTick); for (const job of ready) { jobs.splice(jobs.indexOf(job), 1); job.fn(); } } },
  };
  function makeEntity(typeId, dimension, id = `npc-${++count}`) {
    const tags = new Set(), properties = new Map();
    const entity = { id, typeId, dimension, isValid: true, tags, properties, animations: [],
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
      getEntities({ type, tags = [] }) { return [...entities.values()].filter(e => e.dimension === dimension && e.typeId === type && tags.every(tag => e.hasTag(tag))); },
    };
    dimensions.set(name, dimension);
  }
  const world = { getEntity: id => entities.get(id), getDimension: id => dimensions.get(id) };
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
  const open = p => { assert.equal(controller.queueOpen(p), true); system.advance(); return controller.sessions.getPlayer(p.id); };
  const event = (p, npcId, action, id = 'newui:navigate') => ({ id, sourceEntity: entities.get(npcId), initiator: p, message: action });
  return { ...controller, controller, a, b, open, event, entities, dimensions, world, system, warnings, commands, makeEntity };
}

test('catalog and session snapshots stay immutable', () => {
  const input = structuredClone(CATALOG), store = createSessions(input);
  const { session } = store.replace({ playerId: 'p', npcId: 'n', dimensionId: 'd', entryIndex: 0, tick: 0 });
  input.entries[0].category = 2; input.entries[0].description = 'modified';
  assert.equal(session.entry.category, 0); assert.notEqual(session.entry.description, 'modified');
  assert.ok(Object.isFrozen(session) && Object.isFrozen(session.entry));
  assert.throws(() => { session.entry.category = 1; });
});
test('all nine action routes and bounds', () => {
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
    assert.match(command, /^dialogue open @e\[type=newui:codex,tag=newui_page_test_\d+,c=1\] @s newui:entry_\d{2}$/);
    assert.ok(!command.includes(f.a.name) && !command.includes('@p'));
  }
});
test('navigation rotates NPC, preserves page and links animation', () => {
  const f = fixture(), original = f.open(f.a), originalNpc = f.entities.get(original.npcId);
  assert.equal(originalNpc.animations[0].name, 'animation.newui.codex.open');
  f.system.advance(); assert.equal(f.handleScriptEvent(f.event(f.a, original.npcId, 'next')), true);
  const next = f.sessions.getPlayer(f.a.id);
  assert.equal(next.entryIndex, 1); assert.notEqual(next.npcId, original.npcId); assert.equal(originalNpc.isValid, false);
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
  f.endPlayer(f.a.id); assert.equal(f.queueOpen(f.a), true); f.system.advance();
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
  f.system.advance(); f.handleScriptEvent(f.event(f.a, first.npcId, 'next'));
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
  assert.ok(f.warnings.some(w => w.includes('Queued action failed')));
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

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const scenes = (await readJson('BP/dialogue/codex.json'))['minecraft:npc_dialogue'].scenes;
assert.equal(scenes.length, 12);
scenes.forEach((scene, index) => {
  assert.equal(scene.scene_tag, `newui:entry_${String(index).padStart(2, '0')}`);
  assert.equal(scene.npc_name, 'NEWUI_CODEX_V1');
  assert.equal(scene.text, `[NEWUI:C${Math.floor(index / 4)}:E${String(index).padStart(2, '0')}]${CATALOG.entries[index].description}`);
  assert.deepEqual(scene.buttons.map(b => b.commands[0]), ACTIONS.map(action => `/scriptevent newui:navigate ${action}`));
  assert.deepEqual(scene.on_close_commands, ['/scriptevent newui:close close']);
  assert.ok(scene.buttons.every(b => b.commands.length === 1 && !b.commands[0].includes('execute')));
});
const manifest = await readJson('BP/manifest.json'), rp = await readJson('RP/manifest.json');
assert.deepEqual(manifest.dependencies.find(d => d.uuid), { uuid: rp.header.uuid, version: rp.header.version });
assert.deepEqual(manifest.dependencies.find(d => d.module_name), { module_name: '@minecraft/server', version: '2.1.0' });
assert.deepEqual((await readJson('BP/entities/codex.json'))['minecraft:entity'].components['minecraft:npc'].npc_data.skin_list, [{ variant: 0 }, { variant: 1 }]);
const itemComponents = (await readJson('BP/items/field_guide.json'))['minecraft:item'].components;
assert.equal(itemComponents['minecraft:icon'], 'newui:field_guide');
assert.equal(itemComponents['minecraft:allow_off_hand'], true);
assert.equal(itemComponents['minecraft:interact_button'], true);
console.log(JSON.stringify({ ok: true, sessionScenarios: cases, scenes: scenes.length, buttonsPerScene: 9, runtimeVerified: false }));
