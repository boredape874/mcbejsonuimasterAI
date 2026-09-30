import assert from 'node:assert/strict';

// Original NewUI structure contract, not a general NPC schema. The JSON dialogue
// scene limit does not describe persisted NBT Actions.
const value = (fields, name, type) => { assert.equal(fields[name]?.type, type, `Invalid NBT type: ${name}`); return fields[name].value; };
const list = (fields, name, type) => { const data = value(fields, name, 9); assert.equal(data.type, type, `Invalid NBT list type: ${name}`); return data.items; };

export function assertCodexBpContract({ npc, structures, catalog }) {
  const triggers = npc.components['minecraft:damage_sensor']?.triggers;
  assert.ok(Array.isArray(triggers) && triggers.length > 0, 'NPC damage_sensor requires triggers');
  for (const trigger of triggers) {
    assert.equal(typeof trigger.deals_damage, 'string', 'deals_damage must be a string for target 1.21.100; boolean is invalid');
    assert.equal(trigger.deals_damage, 'no', 'NewUI damage_sensor must use the documented "no" enum value');
  }
  assert.equal(structures.length, 12);
  structures.forEach((document, index) => {
    assert.equal(document.type, 10);
    const root = document.value, page = String(index).padStart(2, '0'), entry = catalog.entries[index];
    assert.equal(value(root, 'format_version', 3), 1);
    assert.deepEqual(list(root, 'size', 3), [1, 1, 1]);
    assert.deepEqual(list(root, 'structure_world_origin', 3), [0, 0, 0]);
    const structure = value(root, 'structure', 10), entities = list(structure, 'entities', 10);
    assert.equal(entities.length, 1, 'Exactly one NPC per template');
    assert.deepEqual(list(structure, 'block_indices', 9), [{ type: 3, items: [-1] }, { type: 3, items: [-1] }]);
    const palette = value(value(structure, 'palette', 10), 'default', 10);
    assert.deepEqual(list(palette, 'block_palette', 10), []);
    assert.equal(Object.keys(value(palette, 'block_position_data', 10)).length, 0);
    const entity = entities[0];
    assert.equal(value(entity, 'identifier', 8), 'newui:codex');
    assert.deepEqual(list(entity, 'definitions', 8), ['+newui:codex']);
    assert.equal(value(entity, 'CustomName', 8), 'NEWUI_CODEX_V1');
    assert.equal(value(entity, 'RawtextName', 8), 'NEWUI_CODEX_V1');
    assert.equal(value(entity, 'InterativeText', 8), `[NEWUI:C${entry.category}:E${page}]${entry.description}`);
    assert.deepEqual(list(entity, 'Tags', 8), ['newui.codex.template', `newui.codex.entry_${page}`]);
    assert.deepEqual(list(entity, 'Pos', 5), [0.5, 0, 0.5]);
    assert.deepEqual(list(entity, 'Rotation', 5), [0, 0]);
    assert.equal(value(entity, 'Persistent', 1), 1);
    for (const key of ['Variant', 'SkinID']) assert.equal(value(entity, key, 3), 0);
    assert.deepEqual(Object.keys(entity).sort(), ['identifier', 'definitions', 'CustomName', 'RawtextName', 'InterativeText', 'Actions', 'Tags', 'Pos', 'Rotation', 'Persistent', 'Variant', 'SkinID'].sort(), 'No saved runtime identity, scene or unrelated entity data');
    const actions = JSON.parse(value(entity, 'Actions', 8));
    const names = [...catalog.categories.map(category => category.name), ...catalog.entries.filter(candidate => candidate.category === entry.category).map(candidate => candidate.name), '이전', '다음'];
    const semantic = [...catalog.categories.map(category => category.id), 'slot0', 'slot1', 'slot2', 'slot3', 'prev', 'next'];
    assert.equal(actions.length, 10, 'Nine button actions plus one close action');
    actions.forEach((action, actionIndex) => {
      const close = actionIndex === 9;
      assert.equal(action.type, 1);
      assert.equal(action.mode, close ? 1 : 0, 'Close must not consume a native button index');
      assert.equal(action.button_name, close ? '' : names[actionIndex]);
      const command = close ? 'scriptevent newui:close close' : `scriptevent newui:navigate ${semantic[actionIndex]}`;
      assert.deepEqual(action.data, [{ cmd_line: command, cmd_ver: 38 }]);
      assert.equal(action.text, close ? command : names[actionIndex]);
    });
  });
}
