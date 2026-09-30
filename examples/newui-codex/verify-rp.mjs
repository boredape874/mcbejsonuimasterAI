import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import { stripJsonComments, stripJsonTrailingCommas } from '../../tools/_lib/jsonc.mjs';
import { evaluateExpression } from '../../tools/_lib/final-rp-v2/expression.mjs';

const project = dirname(fileURLToPath(import.meta.url));
const json = async file => JSON.parse(await readFile(file,'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyScreenMount(ui,mount) {
  assert.equal(ui.namespace,'newui_codex');assert.equal(mount.namespace,'npc_interact');
  assert.deepEqual(Object.keys(mount).sort(),['namespace','npc_screen']);
  const screen=mount.npc_screen;
  // Preserve the inherited screen controls and input mappings. Only append the
  // owned branch directly to that screen, outside the animated safezone branch.
  assert.deepEqual(Object.keys(screen).sort(),['$screen_content','modifications','type']);
  assert.equal(screen.type,'screen');assert.equal(screen.$screen_content,'newui_codex.screen_content');
  assert.equal(screen.$screen_animations,undefined,'Preserve native fallback entrance and exit animations');
  assert.equal(screen.modifications.length,1);
  const insertion=screen.modifications[0];
  assert.deepEqual(Object.keys(insertion).sort(),['array_name','operation','value']);
  assert.equal(insertion.array_name,'controls');assert.equal(insertion.operation,'insert_back');
  assert.equal(insertion.value.length,1);
  const inserted=Object.entries(insertion.value[0]);assert.equal(inserted.length,1);
  assert.ok(inserted[0][0].endsWith('@newui_codex.codex_root'),'Custom content must be a direct screen child');
  assert.deepEqual(inserted[0][1],{},'The mount must not override the verified root definition');
  const root=ui.codex_root;
  assert.equal(root.type,'input_panel');assert.deepEqual(root.size,['100%','100%']);
  assert.equal(root.alpha,1);assert.equal(root.visible,true);assert.equal(root.enabled,true);assert.equal(root.propagate_alpha,true);
  assert.ok(Number.isFinite(root.layer)&&root.layer>0);
  assert.equal(root.controls.length,2);
  const rootChildren=Object.assign({},...root.controls);
  assert.deepEqual(Object.keys(rootChildren).sort(),['backdrop','book@newui_codex.book']);
  assert.deepEqual(rootChildren['book@newui_codex.book'],{},'Book reference must use the verified definition');
  const bookChildren=Object.assign({},...ui.book.controls), close=bookChildren['close@common_buttons.light_text_button'];
  assert.ok(close,'The close button must remain inside the mounted book');
  assert.equal(ui.screen_content.controls.length,1,'The safezone content must only mount the vanilla fallback');
  const fallback=ui.screen_content.controls[0]['vanilla@npc_interact.npc_screen_contents'];assert.ok(fallback);
  for(const [name,control]of [['codex_root',root],['book',ui.book],['close',close],['screen_content',ui.screen_content],['fallback',fallback]]){
    assert.ok(control.alpha===undefined||control.alpha===1,`${name} must start opaque`);
    assert.ok(control.visible===undefined||control.visible===true,`${name} must not start hidden`);
    assert.ok(control.enabled===undefined||control.enabled===true,`${name} must not disable input`);
    assert.ok(control.ignored===undefined||control.ignored===false,`${name} must not be ignored`);
    assert.ok(control.anims===undefined||control.anims.length===0,`${name} must stay outside screen animations`);
    assert.ok(!Object.values(control).some(value=>typeof value==='string'&&value.startsWith('@')),`${name} must not animate a property`);
    if(control!==root&&control!==fallback)assert.equal(control.bindings,undefined,`${name} must not add another visibility/input gate`);
  }
  assert.deepEqual(close.button_mappings,[
    {from_button_id:'button.menu_select',to_button_id:'button.exit_student',mapping_type:'pressed'},
    {from_button_id:'button.menu_ok',to_button_id:'button.exit_student',mapping_type:'focused'},
    {from_button_id:'button.menu_cancel',to_button_id:'button.exit_student',mapping_type:'global'},
  ],'Click, focus and Escape must address the owned student close path');
  const knownMarkers=Array.from({length:12},(_,i)=>`(not ((#dialogtext - '[NEWUI:C${Math.floor(i/4)}:E${String(i).padStart(2,'0')}]') = #dialogtext))`).join(' or ');
  const condition=`(${knownMarkers})`, fallbackCondition=`(not ${condition})`;
  for(const [branch,expression]of [[root,condition],[fallback,fallbackCondition]])assert.deepEqual(branch.bindings,[
    {binding_name:'#dialogtext'},
    {binding_type:'view',source_property_name:expression,target_property_name:'#visible'},
  ],'Each mounted branch must import and evaluate its own native dialog text');
  let dialogtextConsumers=0;
  function checkBindings(control){
    if(control.bindings?.some(binding=>binding.source_property_name?.includes('#dialogtext'))){
      assert.deepEqual(control.bindings.filter(binding=>binding.binding_name==='#dialogtext'),[{binding_name:'#dialogtext'}],'A nested dialog-text consumer needs its own native binding');
      dialogtextConsumers++;
    }
    for(const child of control.controls||[])for(const value of Object.values(child))checkBindings(value);
  }
  for(const control of Object.values(ui))if(control&&typeof control==='object')checkBindings(control);
  // These fixtures verify expression truth tables and authored mount ancestry.
  // They do not establish native binding delivery, visibility or input handling.
  const routeCases=[...Array.from({length:12},(_,i)=>[`[NEWUI:C${Math.floor(i/4)}:E${String(i).padStart(2,'0')}]설명`,true]),
    ...['','일반 NPC 안내','NEWUI_CODEX_V1','[NEWUI:C0:E99]','[NEWUI:C1:E00]','[NEWUI:C0:E0]'].map(text=>[text,false])];
  for(const [text,expected]of routeCases){
    const environment={'#dialogtext':text};
    const selected=evaluateExpression(condition,environment),normal=evaluateExpression(fallbackCondition,environment);
    assert.equal(selected.ok,true);assert.equal(normal.ok,true);assert.equal(selected.value,expected);assert.equal(normal.value,!expected);
  }
  return {routeCases:routeCases.length,dialogtextConsumers,screenMount:'direct-screen-controls-insert_back',customRootAnimations:'none'};
}
export async function verifyRp({rp=join(project,'RP'),vanilla}={}) {
  const catalog=await json(join(project,'catalog.json')), solved=await json(join(project,'layout/solved.json'));
  const ui=await json(join(rp,'ui/newui_codex.json')), mount=await json(join(rp,'ui/npc_interact_screen.json'));
  const screenContract=verifyScreenMount(ui,mount);
  const controls=Object.assign({},...ui.book.controls), br=solved.rects.__root__, checked=new Set();
  const children=c=>Object.assign({},...c.controls);
  const visibleExpression=c=>c.bindings.find(b=>b.target_property_name==='#visible').source_property_name;
  const containsMarker=marker=>`(not ((#dialogtext - '${marker}') = #dialogtext))`;
  const sameBox=(id,c)=>{const r=solved.rects[id];assert.ok(c,`Missing ${id}`);assert.deepEqual(c.offset,[r.x-br.x,r.y-br.y]);assert.deepEqual(c.size,[r.w,r.h]);checked.add(id);};
  for(const id of ['tab0','tab1','tab2','card0','card1','card2','card3','prev','next','close'])sameBox(id,controls[id]||controls[`${id}@common_buttons.light_text_button`]);
  sameBox('heading',controls.heading_0);sameBox('detail_body',controls.description);
  const detail=Object.assign({},...controls.detail_0.controls);
  for(const [id,key]of Object.entries({detail_icon:'icon',detail_name:'name',detail_habitat:'habitat',page_info:'page_info'}))sameBox(id,detail[key]);
  assert.equal(checked.size,16);
  function walk(control,visit,key='') {
    visit(key,control);
    for(const child of control.controls||[])for(const [childKey,value]of Object.entries(child))walk(value,visit,childKey);
  }
  const foundActions=[];
  walk(ui.book,(key,value)=>{if(key.endsWith('@newui_codex.action')){
    assert.ok(Number.isInteger(value.collection_index)&&value.collection_index>=0,'NPC action index must be a nonnegative integer');foundActions.push(value);
  }});
  const actionIds=['tab0','tab1','tab2','card0','card1','card2','card3','prev','next'];
  const active=actionIds.map((id,index)=>{
    const control=controls[id];assert.equal(control.collection_name,'student_buttons_collection');
    assert.equal(control.bindings,undefined,`${id} must remain available in every category`);
    const button=children(control)['button@newui_codex.action'];
    const name=index<3?catalog.categories[index].name:index<7?'생물 선택':index===7?'이전':'다음';
    assert.equal(button.$button_tts_name,name,`${id} requires literal TTS text, not a same-control variable alias`);
    assert.equal(control.$newui_text,name,`${id} provides descendant label text in an ancestor scope`);
    assert.equal(control.$newui_selection_token,index<3?`[NEWUI:C${index}:`:'');
    assert.equal(button.$newui_text,undefined);assert.equal(button.$newui_selection_token,undefined);
    assert.equal(button.collection_index,index,`${id} must target NBT action ${index}`);
    assert.equal(button.bindings,undefined);assert.equal(button.visible,undefined);assert.equal(button.enabled,undefined);
    assert.equal(button.focus_identifier,`newui_${id}`);return button;
  });
  assert.equal(foundActions.length,9,'Exactly nine controls target the stored NPC button actions');
  assert.equal(new Set(active.map(b=>b.focus_identifier)).size,9,'Nine distinct action focus targets');
  const indices=active.map(b=>b.collection_index);
  assert.deepEqual(indices,[0,1,2,3,4,5,6,7,8]);
  for(const [id,input,text]of [['prev','button.menu_tab_left','이전'],['next','button.menu_tab_right','다음']]){
    const button=children(controls[id])['button@newui_codex.action'];assert.equal(controls[id].$newui_text,text);
    assert.ok(button.button_mappings.some(m=>m.from_button_id===input&&m.to_button_id==='button.student_button'&&m.mapping_type==='global'));
  }
  const action=ui['action@common_buttons.light_text_button'];
  assert.equal(action.$button_tts_name,undefined);assert.equal(action.$newui_text,undefined);assert.equal(action.$newui_selection_token,undefined);
  assert.ok(action.bindings.some(b=>b.binding_type==='collection_details'&&b.binding_collection_name==='student_buttons_collection'&&b.binding_collection_prefix==='student_buttons'));
  assert.ok(action.button_mappings.some(m=>m.to_button_id==='button.student_button'&&m.mapping_type==='pressed'));
  assert.equal(controls.portrait_collection.controls[0].book.renderer,'actor_portrait_renderer');
  assert.equal(controls.portrait_collection.controls[0].book.collection_index,1);
  const markers=[];
  assert.equal(catalog.categories.length,3);assert.equal(catalog.entries.length,12);
  for(let c=0;c<3;c++) {
    const tab=controls[`tab${c}`];
    assert.equal(tab.$newui_text,catalog.categories[c].name,`Stale category ${c} label`);
    assert.equal(tab.$newui_selection_token,`[NEWUI:C${c}:`);
    assert.equal(controls[`heading_${c}`].text,`${catalog.categories[c].name} 친구들`);
    assert.equal(visibleExpression(controls[`heading_${c}`]),containsMarker(`[NEWUI:C${c}:`));
  }
  assert.equal(children(ui.text_content).selected.texture,'textures/newui/ui/button_selected');
  assert.equal(visibleExpression(children(ui.text_content).selected),'(not ((#dialogtext - $newui_selection_token) = #dialogtext))');
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
    const screenCommon=await parse(join(vanillaRoot,'ui/ui_common.json'));
    const nativeAnimations=screenCommon.base_screen['$screen_animations|default'];
    assert.ok(Array.isArray(nativeAnimations),'The inherited screen must supply its animation defaults');
    for(const kind of ['push','pop']){
      assert.ok(nativeAnimations.includes(`@common.screen_exit_animation_${kind}_fade`));
      const animation=screenCommon[`screen_exit_animation_${kind}_fade`];
      assert.equal(animation.anim_type,'alpha');assert.equal(animation.from,1);assert.equal(animation.to,0);
      assert.equal(animation.play_event,`screen.exit_${kind}`);assert.equal(animation.end_event,'screen.exit_end');
    }
    if(vanilla) vanillaReferences='verified-supplied-json-definitions';
    else {
      const lock=await json(resolve(project,'../../config/design-research-lock.json'));
      const source=lock.sources.find(s=>s.id==='mojang-bedrock-samples');assert.ok(source,'Missing vanilla source lock');
      for(const path of ['ui/npc_interact_screen.json','ui/ui_template_buttons.json','ui/ui_common.json']) {
        const file=source.files.find(f=>f.path===`resource_pack/${path}`);assert.ok(file,`Missing pinned ${path}`);
        const bytes=await readFile(join(vanillaRoot,path));assert.equal(bytes.length,file.bytes,`Vanilla size drift: ${path}`);assert.equal(hash(bytes),file.sha256,`Vanilla hash drift: ${path}`);
        vanillaEvidence.push({path,bytes:file.bytes,sha256:file.sha256,revision:source.revision});
      }
      vanillaReferences='verified-pinned-json-definitions';
    }
  } catch(error) {if(vanilla||error.code!=='ENOENT')throw error;}
  return {ok:true,evidenceLevel:'static-artifact',runtimeVerified:false,solvedBoxes:checked.size,buttonIndices:indices,activeActions:active.length,transport:'NPC NBT Actions',...screenContract,screenAnimations:'inherited vanilla defaults preserved',models,animations:animationIds.size,decodedPngs:pngs.length,vanillaReferences,vanillaEvidence,materials:'engine built-in entity_alphatest requires target-client verification',limitations:['Native dialog-text delivery, actual root visibility, Escape and NPC callbacks were not executed.','Portrait framing, GUI scale, animation timing and touch were not executed.','Variant0 transparency is validated as assets/selectors, not a captured game result.']};
}
if (process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){assert.ok(['--rp','--vanilla'].includes(args[i])&&args[i+1]);const key=args[i].slice(2);assert.ok(!options[key]);options[key]=resolve(args[i+1]);}console.log(JSON.stringify(await verifyRp(options)));}
  catch(error){console.error(JSON.stringify({ok:false,runtimeVerified:false,error:String(error.message).slice(0,1000)}));process.exitCode=1;}
}
