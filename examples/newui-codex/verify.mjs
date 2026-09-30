import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validatePack } from '../../tools/_lib/pack-validator.mjs';
import { verifyRp } from './verify-rp.mjs';
import { CATALOG } from './BP/scripts/catalog.js';
import { assertCodexBpContract } from './bp-contract.mjs';
import { decodeStructure } from './structure-nbt.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)), repo=path.resolve(root,'../..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function run(args){const r=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',maxBuffer:1024*1024});if(r.error)throw r.error;assert.equal(r.status,0,`${args.join(' ')}\n${r.stdout}\n${r.stderr}`);return r.stdout.trim();}

const bp=read('BP/manifest.json'),rp=read('RP/manifest.json'),catalog=read('catalog.json');
assert.deepEqual(CATALOG,catalog,'BP catalog is stale; run build-bp.mjs');
const ids=[bp.header.uuid,rp.header.uuid,...bp.modules.map(m=>m.uuid),...rp.modules.map(m=>m.uuid)];
assert.equal(new Set(ids).size,ids.length,'Duplicate manifest UUID');
for(const id of ids)assert.match(id,/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
assert.ok(bp.dependencies.some(d=>d.uuid===rp.header.uuid&&JSON.stringify(d.version)===JSON.stringify(rp.header.version)),'Missing BP/RP dependency');
assert.equal(bp.dependencies.find(d=>d.module_name==='@minecraft/server')?.version,'2.1.0');
for(const manifest of [bp,rp]){assert.deepEqual(manifest.header.version,[1,0,4]);for(const module of manifest.modules)assert.deepEqual(module.version,[1,0,4]);}
const sourceFiles=[...files(path.join(root,'BP')),...files(path.join(root,'RP'))];
let jsonFiles=0,scriptFiles=0;
for(const file of sourceFiles){if(file.endsWith('.json')){JSON.parse(fs.readFileSync(file,'utf8'));jsonFiles++;}if(file.endsWith('.js')){run(['--check',file]);scriptFiles++;}}
const item=read('BP/items/field_guide.json')['minecraft:item'];
assert.equal(item.description.identifier,'newui:field_guide');
assert.equal(item.components['minecraft:max_stack_size'],1);
assert.equal(item.components['minecraft:allow_off_hand'],true);
assert.ok(Object.hasOwn(item.components,'newui:open_codex'));
const atlas=read('RP/textures/item_texture.json');
assert.equal(atlas.texture_data[item.components['minecraft:icon']].textures,'textures/newui/field_guide');
const npc=read('BP/entities/codex.json')['minecraft:entity'];
assert.equal(npc.description.identifier,read('RP/entity/codex.entity.json')['minecraft:client_entity'].description.identifier);
assert.deepEqual(npc.components['minecraft:npc'].npc_data.skin_list,[{variant:0},{variant:1}]);
assert.equal(npc.components['minecraft:variant'].value,0);
assert.equal(fs.existsSync(path.join(root,'BP/dialogue/codex.json')),false,'Retire the old generated dialogue scenes');
const structureFiles=catalog.entries.map((_,index)=>`BP/structures/newui/entry_${String(index).padStart(2,'0')}.mcstructure`);
assert.deepEqual(sourceFiles.filter(file=>file.endsWith('.mcstructure')).map(file=>path.relative(root,file).replaceAll('\\','/')).sort(),structureFiles);
const structures=structureFiles.map(file=>decodeStructure(fs.readFileSync(path.join(root,file))));
assertCodexBpContract({npc,structures,catalog});
const pack=await validatePack(path.join(root,'RP'));
assert.equal(pack.ok,true,JSON.stringify(pack.errors));assert.equal(pack.warnings.length,0,JSON.stringify(pack.warnings));
const render=await verifyRp();
const graph=JSON.parse(run(['tools/attachable-inspect.mjs','--rp',path.join(root,'RP'),'--bp',path.join(root,'BP'),'--json']));
assert.equal(graph.ok,true);assert.equal(graph.summary.unresolved,0);assert.equal(graph.runtimeVerified,false);
const sessions=run([path.join(root,'test-session.mjs')]);
console.log(JSON.stringify({ok:true,jsonFiles,scriptFiles,sourceFiles:sourceFiles.length,structures:structures.length,buttonsPerNpc:9,closeActions:1,solvedBoxes:render.solvedBoxes,decodedPngs:render.decodedPngs,graph:graph.summary,sessionTests:sessions,vanillaReferences:render.vanillaReferences,runtimeVerified:false,limitations:['NBT entity import, all nine native buttons, portrait framing and input require fresh Bedrock verification.','Engine materials and dynamic skin selection remain outside static execution.']}));
