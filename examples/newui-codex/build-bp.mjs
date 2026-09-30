import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCodexStructure, encodeStructure } from './structure-nbt.mjs';

const root = new URL('./', import.meta.url), catalog = JSON.parse(await readFile(new URL('catalog.json', root), 'utf8'));
if (catalog.entries.length !== 12 || catalog.categories.length !== 3 || catalog.entries.some((entry, index) => entry.category !== Math.floor(index / 4))) throw new Error('Expected three ordered categories of four entries');
const out = async (path, value) => {
  const target = fileURLToPath(new URL(`BP/${path}`, root)); await mkdir(dirname(target), { recursive: true });
  await writeFile(target, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + '\n');
};
const version = [1, 0, 4];
await out('manifest.json', {
  format_version: 2,
  header: { name: 'NewUI · 작은 세계 탐험 도감 BP', description: 'Original NPC dialogue and held guide example. Static checks do not establish target-client behavior.', uuid: 'f7c1d546-8d1d-4c0f-9495-563a510fcb24', version, min_engine_version: [1, 21, 100] },
  modules: [{ type: 'data', uuid: '4df246af-91c7-4cdb-82a2-489c69371680', version }, { type: 'script', language: 'javascript', uuid: '2809c16d-18cb-4d1e-b224-8ba26180c685', version, entry: 'scripts/main.js' }],
  dependencies: [{ uuid: '6b882368-c6c6-4275-8c2b-588a57a3f8b1', version }, { module_name: '@minecraft/server', version: '2.1.0' }],
});
await out('items/field_guide.json', {
  format_version: '1.21.100',
  'minecraft:item': {
    description: { identifier: 'newui:field_guide', menu_category: { category: 'items' } },
    components: { 'minecraft:display_name': { value: '작은 세계 탐험 도감' }, 'minecraft:icon': 'newui:field_guide', 'minecraft:max_stack_size': 1, 'minecraft:hand_equipped': true, 'minecraft:allow_off_hand': true, 'minecraft:interact_button': true, 'newui:open_codex': {} },
  },
});
await out('entities/codex.json', {
  format_version: '1.21.100',
  'minecraft:entity': {
    description: { identifier: 'newui:codex', runtime_identifier: 'minecraft:npc', is_spawnable: false, is_summonable: true, is_experimental: false },
    components: {
      'minecraft:type_family': { family: ['npc', 'newui_codex'] },
      'minecraft:npc': { npc_data: { skin_list: [{ variant: 0 }, { variant: 1 }] } },
      'minecraft:variant': { value: 0 },
      'minecraft:collision_box': { width: 0.01, height: 0.01 },
      'minecraft:physics': { has_gravity: false, has_collision: false },
      'minecraft:pushable': { is_pushable: false, is_pushable_by_piston: false },
      'minecraft:damage_sensor': { triggers: [{ cause: 'all', deals_damage: 'no' }] },
      'minecraft:persistent': {},
    },
  },
});
for (let index = 0; index < catalog.entries.length; index++) {
  await out(`structures/newui/entry_${String(index).padStart(2, '0')}.mcstructure`, encodeStructure(createCodexStructure(catalog, index)));
}
// Retire only this example's old generated scene file. The JSON scene loader's
// six-button check is distinct from the persisted NPC Actions import path.
await rm(new URL('BP/dialogue/codex.json', root), { force: true });
await out('scripts/catalog.js', `// Generated from ../catalog.json by build-bp.mjs.\nexport const ADDON_VERSION = '${version.join('.')}';\nexport const CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);
await out('functions/newui/help.mcfunction', 'tellraw @s {"rawtext":[{"text":"작은 세계 탐험 도감: /newui:book 으로 책을 받고 사용하거나 /newui:open 으로 여세요. 두 명령은 플레이어가 직접 실행합니다. BP와 RP를 함께 활성화하세요."}]}\n');
console.log(JSON.stringify({ ok: true, structures: catalog.entries.length, buttonsPerNpc: 9, closeActions: 1, scriptApi: '2.1.0', runtimeVerified: false }));
