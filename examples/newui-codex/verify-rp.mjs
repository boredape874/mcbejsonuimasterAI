import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import { stripJsonComments, stripJsonTrailingCommas } from '../../tools/_lib/jsonc.mjs';

const project = dirname(fileURLToPath(import.meta.url));
const json = async file => JSON.parse(await readFile(file,'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function verifyRp({rp=join(project,'RP'),vanilla}={}) {
  const catalog=await json(join(project,'catalog.json')), solved=await json(join(project,'layout/solved.json'));
  const ui=await json(join(rp,'ui/newui_codex.json')), mount=await json(join(rp,'ui/npc_interact_screen.json'));
  assert.equal(ui.namespace,'newui_codex');assert.equal(mount.npc_screen.$screen_content,'newui_codex.screen_content');
  assert.deepEqual(Object.keys(mount).sort(),['namespace','npc_screen']);
  assert.deepEqual(Object.keys(mount.npc_screen),['$screen_content']); // Keep the vanilla screen implementation.
  const controls=Object.assign({},...ui.book.controls), br=solved.rects.__root__, checked=new Set();
  const sameBox=(id,c)=>{const r=solved.rects[id];assert.ok(c,`Missing ${id}`);assert.deepEqual(c.offset,[r.x-br.x,r.y-br.y]);assert.deepEqual(c.size,[r.w,r.h]);checked.add(id);};
  for(const id of ['tab0','tab1','tab2','card0','card1','card2','card3','prev','next','close'])sameBox(id,controls[id]||controls[`${id}@common_buttons.light_text_button`]);
  sameBox('heading',controls.heading_0);sameBox('detail_body',controls.description);
  const detail=Object.assign({},...controls.detail_0.controls);
  for(const [id,key]of Object.entries({detail_icon:'icon',detail_name:'name',detail_habitat:'habitat',page_info:'page_info'}))sameBox(id,detail[key]);
  assert.equal(checked.size,16);
  const actions=Object.entries(controls).filter(([key])=>/^(tab\d|card\d|prev|next)$/.test(key));
  const indices=actions.map(([,c])=>{assert.equal(c.collection_name,'student_buttons_collection');return c.controls[0]['button@newui_codex.action'].collection_index;}).sort((a,b)=>a-b);
  assert.deepEqual(indices,[0,1,2,3,4,5,6,7,8]);
  const action=ui['action@common_buttons.light_text_button'];
  assert.ok(action.bindings.some(b=>b.binding_type==='collection_details'&&b.binding_collection_name==='student_buttons_collection'&&b.binding_collection_prefix==='student_buttons'));
  assert.ok(action.button_mappings.some(m=>m.to_button_id==='button.student_button'&&m.mapping_type==='pressed'));
  assert.ok(controls['close@common_buttons.light_text_button'].button_mappings.some(m=>m.to_button_id==='button.exit_student'&&m.mapping_type==='global'));
  const [fallback,custom]=ui.screen_content.controls;
  assert.ok(fallback['vanilla@npc_interact.npc_screen_contents']);
  const condition=custom.codex.bindings.find(b=>b.target_property_name==='#visible').source_property_name;
  const knownMarkers=Array.from({length:12},(_,i)=>`(not ((#dialogtext - '[NEWUI:C${Math.floor(i/4)}:E${String(i).padStart(2,'0')}]') = #dialogtext))`).join(' or ');
  assert.equal(condition,`(#student_view_visible and (#title_text = 'NEWUI_CODEX_V1') and (${knownMarkers}))`,'Only the 12 defined scene markers may mount the codex');
  assert.equal(fallback['vanilla@npc_interact.npc_screen_contents'].bindings.find(b=>b.target_property_name==='#visible').source_property_name,`(not ${condition})`);
  assert.equal(controls.portrait_collection.controls[0].book.renderer,'actor_portrait_renderer');
  assert.equal(controls.portrait_collection.controls[0].book.collection_index,1);
  const children=c=>Object.assign({},...c.controls);
  const visibleExpression=c=>c.bindings.find(b=>b.target_property_name==='#visible').source_property_name;
  const containsMarker=marker=>`(not ((#dialogtext - '${marker}') = #dialogtext))`;
  const markers=[];
  assert.equal(catalog.categories.length,3);assert.equal(catalog.entries.length,12);
  for(let c=0;c<3;c++) {
    const button=controls[`tab${c}`].controls[0]['button@newui_codex.action'];
    assert.equal(button.$newui_text,catalog.categories[c].name,`Stale category ${c} label`);
    assert.equal(button.$newui_selection_token,`[NEWUI:C${c}:`);
    assert.equal(controls[`heading_${c}`].text,`${catalog.categories[c].name} 친구들`);
    assert.equal(visibleExpression(controls[`heading_${c}`]),containsMarker(`[NEWUI:C${c}:`));
  }
  for(let i=0;i<12;i++) {
    const marker=`[NEWUI:C${Math.floor(i/4)}:E${String(i).padStart(2,'0')}]`;
    markers.push(marker);
    const entry=catalog.entries[i], category=Math.floor(i/4), slot=i%4;
    assert.equal(entry.category,category);
    assert.equal(visibleExpression(controls[`detail_${i}`]),containsMarker(marker));
    const detail=children(controls[`detail_${i}`]);
    assert.equal(detail.name.text,entry.name,`Stale entry ${i} name`);
    assert.equal(detail.habitat.text,entry.habitat,`Stale entry ${i} habitat`);
    assert.equal(detail.icon.texture,`textures/newui/icons/${entry.id}`);
    assert.equal(detail.page_info.text,`${slot+1} / 4 · 모든 생물 보기`);
    const card=controls[`card${slot}`].controls[0]['button@newui_codex.action'];
    assert.equal(card.$button_type_panel,`newui_codex.slot_${slot}_content`);
    const categoryPanel=children(ui[`slot_${slot}_content`])[`category_${category}`];
    assert.equal(visibleExpression(categoryPanel),containsMarker(`[NEWUI:C${category}:`));
    const content=children(categoryPanel);
    assert.equal(content.name.text,entry.name,`Stale slot ${slot} category ${category} name`);
    assert.equal(content.icon.texture,`textures/newui/icons/${entry.id}`);
    assert.equal(visibleExpression(content.selected),containsMarker(marker));
  }
  assert.equal(controls.description.text,'#newui_description');
  assert.equal(controls.description.bindings.find(b=>b.target_property_name==='#newui_description').source_property_name,`(#dialogtext${markers.map(marker=>` - '${marker}'`).join('')})`);
  const pngs=[];
  const png=async (path,w,h)=>{
    const bytes=await readFile(join(rp,path)), image=PNG.sync.read(bytes);assert.equal(image.width,w,path);assert.equal(image.height,h,path);
    let transparent=0,opaque=0;for(let i=3;i<image.data.length;i+=4){if(image.data[i]===0)transparent++;if(image.data[i]===255)opaque++;}
    pngs.push({path,w,h,transparent,opaque,sha256:hash(bytes)});return image;
  };
  const clear=await png('textures/newui/transparent.png',1,1);assert.equal(clear.data[3],0);
  const atlas=await png('textures/newui/book_atlas.png',256,128);
  for(const half of [0,1]){let opaque=0;for(let y=0;y<128;y++)for(let x=half*128;x<(half+1)*128;x++)if(atlas.data[(y*256+x)*4+3]===255)opaque++;assert.ok(opaque>0,`Blank atlas half ${half}`);}
  await png('textures/newui/cover.png',32,32);
  for(const entry of catalog.entries){await png(`textures/newui/icons/${entry.id}.png`,32,32);const p=pngs.at(-1);assert.ok(p.transparent>0&&p.opaque>0,`Missing RGBA sprite content ${entry.id}`);}
  assert.equal(new Set(pngs.filter(p=>p.path.includes('/icons/')).map(p=>p.sha256)).size,12,'Icons must be distinct original images');
  for(const state of ['default','hover','pressed','selected']){
    await png(`textures/newui/ui/button_${state}.png`,24,24);
    const sidecar=await json(join(rp,`textures/newui/ui/button_${state}.json`));assert.deepEqual(sidecar,{nineslice_size:3,base_size:[24,24]});
  }
  assert.equal(new Set(pngs.filter(p=>p.path.includes('/ui/')).map(p=>p.sha256)).size,4,'Button states must differ');
  const bones=new Set(),models=[];
  for(const file of await readdir(join(rp,'models/entity'))) {
    const g=(await json(join(rp,'models/entity',file)))['minecraft:geometry'][0], local=new Map();
    for(const b of g.bones){assert.ok(!local.has(b.name),`Duplicate bone ${b.name}`);local.set(b.name,b);bones.add(b.name);}
    for(const b of g.bones){const seen=new Set([b.name]);let cur=b;while(cur.parent){assert.ok(local.has(cur.parent));assert.ok(!seen.has(cur.parent),'Parent cycle');seen.add(cur.parent);cur=local.get(cur.parent);}for(const cube of b.cubes||[])for(const face of Object.values(cube.uv)){const [u,v]=face.uv,[w,h]=face.uv_size;assert.ok(Math.min(u,u+w)>=0&&Math.max(u,u+w)<=g.description.texture_width,'UV outside width');assert.ok(Math.min(v,v+h)>=0&&Math.max(v,v+h)<=g.description.texture_height,'UV outside height');}}
    models.push({file,bones:g.bones.length});
  }
  const animationIds=new Set();
  for(const file of await readdir(join(rp,'animations')))for(const [id,a]of Object.entries((await json(join(rp,'animations',file))).animations)){assert.ok(!animationIds.has(id));animationIds.add(id);for(const bone of Object.keys(a.bones||{}))assert.ok(bones.has(bone),`Animation targets missing ${bone}`);}
  const entity=(await json(join(rp,'entity/codex.entity.json')))['minecraft:client_entity'].description;
  for(const id of Object.values(entity.animations))assert.ok(animationIds.has(id));
  const rcs=(await json(join(rp,'render_controllers/codex.render_controllers.json'))).render_controllers;
  for(const kind of ['pages','cover']){const rc=rcs[`controller.render.newui.codex_${kind}`];assert.deepEqual(rc.arrays.textures['Array.skin'],['Texture.transparent',`Texture.${kind}`]);assert.deepEqual(rc.textures,['Array.skin[q.variant]']);}
  const attachable=(await json(join(rp,'attachables/field_guide.player.json')))['minecraft:attachable'].description;
  assert.ok(attachable.item['newui:field_guide']);assert.equal(attachable.scripts.animate.length,4);
  for(const id of Object.values(attachable.animations))assert.ok(animationIds.has(id));
  const vanillaRoot=vanilla||resolve(project,'../../workspace/design-library/upstreams/mojang-bedrock-samples/resource_pack');
  let vanillaReferences='external-unverified', vanillaEvidence=[];
  try {await access(join(vanillaRoot,'ui/npc_interact_screen.json'));}
  catch {if(vanilla)throw new Error('Explicit vanilla root lacks ui/npc_interact_screen.json');}
  try {
    const parse=async path=>JSON.parse(stripJsonTrailingCommas(stripJsonComments(await readFile(path,'utf8'))));
    const npc=await parse(join(vanillaRoot,'ui/npc_interact_screen.json'));
    assert.ok(npc.npc_screen_contents&&npc['npc_screen@common.base_screen']);
    assert.ok(npc.student_button_label.bindings.some(b=>b.binding_name==='#student_button_text'));
    const common=await parse(join(vanillaRoot,'ui/ui_template_buttons.json'));
    assert.ok(Object.keys(common).some(k=>k.split('@')[0]==='light_text_button'));
    if(vanilla) vanillaReferences='verified-supplied-json-definitions';
    else {
      const lock=await json(resolve(project,'../../config/design-research-lock.json'));
      const source=lock.sources.find(s=>s.id==='mojang-bedrock-samples');assert.ok(source,'Missing vanilla source lock');
      for(const path of ['ui/npc_interact_screen.json','ui/ui_template_buttons.json']) {
        const file=source.files.find(f=>f.path===`resource_pack/${path}`);assert.ok(file,`Missing pinned ${path}`);
        const bytes=await readFile(join(vanillaRoot,path));assert.equal(bytes.length,file.bytes,`Vanilla size drift: ${path}`);assert.equal(hash(bytes),file.sha256,`Vanilla hash drift: ${path}`);
        vanillaEvidence.push({path,bytes:file.bytes,sha256:file.sha256,revision:source.revision});
      }
      vanillaReferences='verified-pinned-json-definitions';
    }
  } catch(error) {if(vanilla||error.code!=='ENOENT')throw error;}
  return {ok:true,evidenceLevel:'static-artifact',runtimeVerified:false,solvedBoxes:checked.size,buttonIndices:indices,models,animations:animationIds.size,decodedPngs:pngs.length,vanillaReferences,vanillaEvidence,materials:'engine built-in entity_alphatest requires target-client verification',limitations:['Portrait framing, GUI scale, animation timing, touch and NPC callbacks were not executed.','Variant0 transparency is validated as assets/selectors, not a captured game result.']};
}
if (process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){assert.ok(['--rp','--vanilla'].includes(args[i])&&args[i+1]);const key=args[i].slice(2);assert.ok(!options[key]);options[key]=resolve(args[i+1]);}console.log(JSON.stringify(await verifyRp(options)));}
  catch(error){console.error(JSON.stringify({ok:false,runtimeVerified:false,error:String(error.message).slice(0,1000)}));process.exitCode=1;}
}
