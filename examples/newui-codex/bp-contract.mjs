import assert from 'node:assert/strict';

// Target 1.21.100: damage_sensor string values were documented in the 1.21.40
// release notes. This example requires "no", without claiming newer enum values.
// https://www.minecraft.net/en-us/article/minecraft-1-21-40-bedrock-changelog
// NPC's six-button cap is also confirmed by the user's target-client Content Log.
// https://edusupport.minecraft.net/hc/en-us/articles/360047555651-Adding-Non-Player-Characters-NPCs
export function assertCodexBpContract({ npc, scenes, catalog }) {
  const triggers = npc.components['minecraft:damage_sensor']?.triggers;
  assert.ok(Array.isArray(triggers) && triggers.length > 0, 'NPC damage_sensor requires triggers');
  for (const trigger of triggers) {
    assert.equal(typeof trigger.deals_damage, 'string', 'deals_damage must be a string for target 1.21.100; boolean is invalid');
    assert.equal(trigger.deals_damage, 'no', 'NewUI damage_sensor must use the documented "no" enum value');
  }
  assert.equal(scenes.length, 12);
  assert.equal(new Set(scenes.map(scene => scene.scene_tag)).size, 12);
  scenes.forEach((scene, index) => {
    assert.ok(Array.isArray(scene.buttons) && scene.buttons.length <= 6, 'NPC dialogue supports a maximum of 6 buttons per scene');
    assert.equal(scene.buttons.length, 6, 'NewUI requires exactly 2 category and 4 entry buttons');
    const entry = catalog.entries[index], otherCategories = catalog.categories.filter((_, categoryIndex) => categoryIndex !== entry.category);
    const entries = catalog.entries.filter(candidate => candidate.category === entry.category);
    const actions = [...otherCategories.map(category => category.id), 'slot0', 'slot1', 'slot2', 'slot3'];
    assert.equal(scene.scene_tag, `newui:entry_${String(index).padStart(2, '0')}`);
    assert.equal(scene.npc_name, 'NEWUI_CODEX_V1');
    assert.equal(scene.text, `[NEWUI:C${entry.category}:E${String(index).padStart(2, '0')}]${entry.description}`);
    assert.deepEqual(scene.buttons.map(button => button.name), [...otherCategories.map(category => category.name), ...entries.map(candidate => candidate.name)]);
    scene.buttons.forEach((button, buttonIndex) => assert.deepEqual(button.commands, [`/scriptevent newui:navigate ${actions[buttonIndex]}`]));
    assert.deepEqual(scene.on_close_commands, ['/scriptevent newui:close close']);
  });
}
