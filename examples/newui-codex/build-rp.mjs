import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Independently authored: catalog text and solved boxes are the shared sources.
// NPC skin variant 0 is transparent in the world; variant 1 is selected only by
// the portrait collection. This preserves a statically observed rendering path.
const root = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(await readFile(join(root, 'catalog.json'), 'utf8'));
const solved = JSON.parse(await readFile(join(root, 'layout/solved.json'), 'utf8'));
if (!solved.converged || catalog.categories.length !== 3 || catalog.entries.length !== 12) throw new Error('Expected converged layout and 3 categories / 12 entries');
for (let i = 0; i < 12; i++) if (catalog.entries[i].category !== Math.floor(i / 4)) throw new Error('Entries must be grouped in four-entry categories');
const base = solved.rects.__root__, screen = solved.rects.__screen__;
const box = id => {
  const b = solved.rects[id];
  if (!b || [b.x,b.y,b.w,b.h].some(n => !Number.isFinite(n))) throw new Error(`Missing solved box ${id}`);
  return { anchor_from: 'top_left', anchor_to: 'top_left', offset: [b.x-base.x,b.y-base.y], size:[b.w,b.h] };
};
const files = [];
async function emit(path, value) {
  const destination=join(root,'RP',path); await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination, JSON.stringify(value,null,2)+'\n'); files.push(path);
}
const token = i => `[NEWUI:C${Math.floor(i/4)}:E${String(i).padStart(2,'0')}]`;
const has = text => `(not ((#dialogtext - '${text}') = #dialogtext))`;
const visible = expression => [{binding_name:'#dialogtext'},{binding_type:'view',source_property_name:expression,target_property_name:'#visible'}];
const categoryVisible = i => visible(has(`[NEWUI:C${i}:`));
const textColor = [0.22,0.27,0.25];
const label = (text,size,extra={}) => ({type:'label',text,size,font_size:'normal',font_scale_factor:0.75,color:textColor,shadow:false,...extra});
const image = (texture,size,extra={}) => ({type:'image',texture,size,...extra});
const ui = {namespace:'newui_codex'};
ui.text_content={type:'panel',controls:[
  {selected:image('textures/newui/ui/button_selected',['100%','100%'],{alpha:0.6,layer:1,bindings:visible('(not ((#dialogtext - $newui_selection_token) = #dialogtext))')})},
  {label:label('$newui_text',['100% - 4px',12],{font_scale_factor:0.8,layer:2})},
]};
ui['action@common_buttons.light_text_button']={
  '$button_text':'', '$button_type_panel':'newui_codex.text_content', '$newui_text':'', '$newui_selection_token':'',
  '$default_button_texture':'textures/newui/ui/button_default',
  '$hover_button_texture':'textures/newui/ui/button_hover',
  '$pressed_button_texture':'textures/newui/ui/button_pressed',
  '$locked_button_texture':'textures/newui/ui/button_default',
  '$border_visible':false, '$button_tts_name':'$newui_text',
  button_mappings:[
    {from_button_id:'button.menu_select',to_button_id:'button.student_button',mapping_type:'pressed'},
    {from_button_id:'button.menu_ok',to_button_id:'button.student_button',mapping_type:'focused'},
  ],
  bindings:[{binding_type:'collection_details',binding_collection_name:'student_buttons_collection',binding_collection_prefix:'student_buttons'}],
};
function action(id,index,content='newui_codex.text_content',name='',key) {
  const button={collection_index:index,size:['100%','100%'],focus_identifier:`newui_${id}`,'$button_type_panel':content,'$newui_text':name};
  if (id.startsWith('tab')) button['$newui_selection_token']=`[NEWUI:C${index}:`;
  if(key) button.button_mappings=[...ui['action@common_buttons.light_text_button'].button_mappings,{from_button_id:key,to_button_id:'button.student_button',mapping_type:'global'}];
  return {[id]:{type:'stack_panel',...box(id),layer:40,collection_name:'student_buttons_collection',controls:[{'button@newui_codex.action':button}]}};
}
for(let slot=0;slot<4;slot++) {
  ui[`slot_${slot}_content`]={type:'panel',controls:catalog.categories.map((_,c)=>{
    const entry=catalog.entries[c*4+slot];
    return {[`category_${c}`]:{type:'panel',bindings:categoryVisible(c),controls:[
      {selected:image('textures/newui/ui/button_selected',['100%','100%'],{alpha:0.6,layer:1,bindings:visible(has(token(c*4+slot)))})},
      {icon:image(`textures/newui/icons/${entry.id}`,[28,28],{anchor_from:'top_middle',anchor_to:'top_middle',offset:[0,2],layer:2})},
      {name:label(entry.name,['100% - 4px',12],{anchor_from:'bottom_middle',anchor_to:'bottom_middle',offset:[0,-2],font_scale_factor:0.7,layer:2})},
    ]}};
  })};
}
const rootControls=[];
// Same portrait size/offset family as the inspected NPC path; target-client
// framing remains a calibration requirement, separate from the solved UI boxes.
rootControls.push({portrait_collection:{type:'stack_panel',collection_name:'skins_collection',size:[500,500],offset:[0,-140],layer:2,controls:[
  {book:{type:'custom',renderer:'actor_portrait_renderer',collection_index:1,size:[500,500],enable_scissor_test:true,bindings:[{binding_type:'collection',binding_collection_name:'skins_collection',binding_name:'#skin_index'}]}},
]}});
for(let c=0;c<3;c++) rootControls.push(action(`tab${c}`,c,'newui_codex.text_content',catalog.categories[c].name));
for(let slot=0;slot<4;slot++) rootControls.push(action(`card${slot}`,3+slot,`newui_codex.slot_${slot}_content`,'생물 선택'));
rootControls.push(action('prev',7,'newui_codex.text_content','이전','button.menu_tab_left'));
rootControls.push(action('next',8,'newui_codex.text_content','다음','button.menu_tab_right'));
rootControls.push({'close@common_buttons.light_text_button':{
  ...box('close'),layer:50,'$button_text':'닫기','$button_font_scale_factor':0.8,
  '$default_button_texture':'textures/newui/ui/button_default','$hover_button_texture':'textures/newui/ui/button_hover','$pressed_button_texture':'textures/newui/ui/button_pressed','$border_visible':false,
  button_mappings:[{from_button_id:'button.menu_select',to_button_id:'button.exit_student',mapping_type:'pressed'},{from_button_id:'button.menu_ok',to_button_id:'button.exit_student',mapping_type:'focused'},{from_button_id:'button.menu_cancel',to_button_id:'button.exit_student',mapping_type:'global'}],
}});
for(let c=0;c<3;c++) rootControls.push({[`heading_${c}`]:{...label(`${catalog.categories[c].name} 친구들`,box('heading').size,{font_scale_factor:0.95}),...box('heading'),layer:50,bindings:categoryVisible(c)}});
for(let i=0;i<12;i++) {
  const entry=catalog.entries[i], controls=[];
  controls.push({icon:{...image(`textures/newui/icons/${entry.id}`,box('detail_icon').size),...box('detail_icon')}});
  controls.push({name:{...label(entry.name,box('detail_name').size,{font_scale_factor:1}),...box('detail_name')}});
  controls.push({habitat:{...label(entry.habitat,box('detail_habitat').size,{font_scale_factor:0.65}),...box('detail_habitat')}});
  controls.push({page_info:{...label(`${i%4+1} / 4 · 모든 생물 보기`,box('page_info').size,{font_scale_factor:0.6}),...box('page_info')}});
  rootControls.push({[`detail_${i}`]:{type:'panel',size:['100%','100%'],layer:50,bindings:visible(has(token(i))),controls}});
}
const stripped = Array.from({length:12},(_,i)=>` - '${token(i)}'`).join('');
rootControls.push({description:{...label('#newui_description',box('detail_body').size,{font_scale_factor:0.65,text_alignment:'left'}),...box('detail_body'),layer:50,bindings:[
  {binding_name:'#dialogtext'},{binding_type:'view',source_property_name:`(#dialogtext${stripped})`,target_property_name:'#newui_description'},
]}});
ui.book={type:'panel',size:[base.w,base.h],offset:[base.x+base.w/2-screen.w/2,base.y+base.h/2-screen.h/2],controls:rootControls};
const knownMarkers=`(${catalog.entries.map((_,i)=>has(token(i))).join(' or ')})`;
const gate=`(#student_view_visible and (#title_text = 'NEWUI_CODEX_V1') and ${knownMarkers})`;
const gateBindings = expr => [{binding_name:'#student_view_visible',binding_type:'global'},{binding_name:'#title_text',binding_type:'global'},{binding_name:'#dialogtext'},{binding_type:'view',source_property_name:expr,target_property_name:'#visible'}];
ui.screen_content={type:'panel',controls:[
  {'vanilla@npc_interact.npc_screen_contents':{bindings:gateBindings(`(not ${gate})`)}},
  {codex:{type:'panel',bindings:gateBindings(gate),controls:[
    {backdrop:image('textures/newui/ui/shade',['100%','100%'],{alpha:0.58,layer:0})},
    {'book@newui_codex.book':{}},
  ]}},
]};
await emit('ui/newui_codex.json',ui);
await emit('ui/_ui_defs.json',{ui_defs:['ui/newui_codex.json']});
await emit('ui/npc_interact_screen.json',{namespace:'npc_interact',npc_screen:{'$screen_content':'newui_codex.screen_content'}});

const geometry=(identifier,w,h,bones)=>({format_version:'1.16.0','minecraft:geometry':[{description:{identifier,texture_width:w,texture_height:h,visible_bounds_width:5,visible_bounds_height:5,visible_bounds_offset:[0,0,0]},bones}]});
const frameBones=()=>[{name:'portrait_root',pivot:[0,0,0],rotation:[80,0,0]},{name:'book',parent:'portrait_root',pivot:[0,0,0]}];
const uv=(x,y,w,h)=>({uv:[x,y],uv_size:[w,h]});
const pages=frameBones();
pages.push({name:'left_page',parent:'book',pivot:[0,0,0],cubes:[{origin:[-16,0,-10],size:[16,0.1,20],uv:{up:uv(0,0,128,128)}}]});
pages.push({name:'right_page',parent:'book',pivot:[0,0,0],cubes:[{origin:[0,0,-10],size:[16,0.1,20],uv:{up:uv(128,0,128,128)}}]});
// One original hinged leaf creates a clear page-turn cue without copying the
// source book's many curved strips or animation keyframes.
pages.push({name:'turning_leaf',parent:'book',pivot:[0,0.2,0],cubes:[{origin:[0,0.22,-10],size:[16,0.05,20],uv:{up:uv(128,0,128,128),down:uv(128,128,-128,-128)}}]});
const covers=frameBones();
const coverUv={up:uv(0,0,32,32),down:uv(32,32,-32,-32),north:uv(0,0,32,2),south:uv(0,30,32,2),east:uv(0,0,2,32),west:uv(30,0,2,32)};
covers.push({name:'left_cover',parent:'book',pivot:[0,-0.4,0],cubes:[{origin:[-16.8,-0.65,-10.6],size:[16.8,0.5,21.2],uv:coverUv}]});
covers.push({name:'right_cover',parent:'book',pivot:[0,-0.4,0],cubes:[{origin:[0,-0.65,-10.6],size:[16.8,0.5,21.2],uv:coverUv}]});
await emit('models/entity/codex_pages.geo.json',geometry('geometry.newui.codex_pages',256,128,pages));
await emit('models/entity/codex_cover.geo.json',geometry('geometry.newui.codex_cover',32,32,covers));
const controllers={};
for(const kind of ['pages','cover']) controllers[`controller.render.newui.codex_${kind}`]={arrays:{textures:{'Array.skin':['Texture.transparent',`Texture.${kind}`]}},geometry:`Geometry.${kind}`,materials:[{'*':'Material.default'}],textures:['Array.skin[q.variant]'],ignore_lighting:true};
controllers['controller.render.newui.field_guide']={geometry:'Geometry.default',materials:[{'*':'Material.default'}],textures:['Texture.default']};
await emit('render_controllers/codex.render_controllers.json',{format_version:'1.8.0',render_controllers:controllers});
await emit('entity/codex.entity.json',{format_version:'1.10.0','minecraft:client_entity':{description:{
  identifier:'newui:codex',materials:{default:'entity_alphatest'},textures:{transparent:'textures/newui/transparent',pages:'textures/newui/book_atlas',cover:'textures/newui/cover'},geometry:{pages:'geometry.newui.codex_pages',cover:'geometry.newui.codex_cover'},
  animations:{open:'animation.newui.codex.open',turn_left:'animation.newui.codex.turn_left',turn_right:'animation.newui.codex.turn_right'},
  scripts:{should_update_bones_and_effects_offscreen:true},render_controllers:['controller.render.newui.codex_pages','controller.render.newui.codex_cover'],
}}});
const animations={
  'animation.newui.codex.open':{animation_length:0.45,bones:{book:{position:{'0.0':[0,0,-10],'0.45':[0,0,0]}},left_cover:{rotation:{'0.0':[0,0,70],'0.45':[0,0,0]}},right_cover:{rotation:{'0.0':[0,0,-70],'0.45':[0,0,0]}}}},
};
for(const [direction,from,to] of [['right',0,-180],['left',-180,0]]) animations[`animation.newui.codex.turn_${direction}`]={animation_length:0.35,bones:{turning_leaf:{scale:{'0.0':[1,1,1],'0.32':[1,1,1],'0.35':[0,0,0]},rotation:{'0.0':[0,0,from],'0.18':[0,0,(from+to)/2],'0.35':[0,0,to]}}}};
await emit('animations/codex.animation.json',{format_version:'1.8.0',animations});

const held=[{name:'held_book',binding:'q.item_slot_to_bone_name(context.item_slot)',pivot:[0,0,0],cubes:[{origin:[-3,0,-0.4],size:[6,8,0.8],uv:{north:uv(0,0,32,32),south:uv(32,0,-32,32),east:uv(0,0,3,32),west:uv(29,0,3,32),up:uv(0,0,32,3),down:uv(0,29,32,3)}}]}];
await emit('models/entity/field_guide.geo.json',geometry('geometry.newui.field_guide',32,32,held));
const poseData={main_first:{position:[3,17,-5],rotation:[10,-20,0],scale:0.75},off_first:{position:[-3,17,-5],rotation:[10,20,0],scale:0.75},main_third:{position:[0,22,-2],rotation:[0,0,0],scale:0.65},off_third:{position:[0,22,-2],rotation:[0,0,0],scale:0.65}};
const heldAnimations={},aliases={},conditions=[];
for(const [key,pose]of Object.entries(poseData)) {
  aliases[key]=`animation.newui.field_guide.${key}`;heldAnimations[aliases[key]]={loop:true,bones:{held_book:pose}};
  conditions.push({[key]:`${key.endsWith('first')?'':'!'}context.is_first_person && context.item_slot == '${key.startsWith('main')?'main_hand':'off_hand'}'`});
}
await emit('animations/field_guide.animation.json',{format_version:'1.8.0',animations:heldAnimations});
await emit('attachables/field_guide.player.json',{format_version:'1.10.0','minecraft:attachable':{description:{identifier:'newui:field_guide.player',item:{'newui:field_guide':"query.is_owner_identifier_any('minecraft:player')"},materials:{default:'entity_alphatest'},textures:{default:'textures/newui/cover'},geometry:{default:'geometry.newui.field_guide'},animations:aliases,scripts:{animate:conditions},render_controllers:['controller.render.newui.field_guide']}}});
console.log(JSON.stringify({ok:true,files:files.length,surface:'NPC actor portrait + native JSON UI + held attachable',buttonIndices:{categories:[0,1,2],slots:[3,4,5,6],previous:7,next:8},skinCollectionIndex:1,geometrySource:'independently authored',layoutSource:'layout/solved.json',runtimeVerified:false}));
