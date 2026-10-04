import assert from "node:assert/strict";
import { join } from "node:path";
import { indexResourcePack } from "../tools/_lib/final-rp-v2/rp-index.mjs";
import { resolveControl } from "../tools/_lib/final-rp-v2/resolver.mjs";

const vanilla=join(import.meta.dirname,"..","references","upstreams","MCBVanillaResourcePack"),fixtureRoot=join(import.meta.dirname,"fixtures","final-rp-v2");
const index=await indexResourcePack(fixtureRoot,{overlays:[vanilla]});
const result=resolveControl(index,"@common_buttons.underline_button",{overrides:{size:[74,46],default_control:"default",hover_control:"hover",pressed_control:"pressed",controls:[{default:{texture:"pd/default"}},{hover:{texture:"pd/hover"}},{pressed:{texture:"pd/pressed"}}]}});
for(const id of ["default","hover","pressed"]){assert.equal(result.tree.controls.filter(child=>child.id===id).length,1);const child=result.tree.controls.find(child=>child.id===id);assert.equal(child.props.texture,`pd/${id}`);assert(child.props.size||result.tree.props.size);}
assert.deepEqual(result.tree.props.size,[74,46]);

const variableIndex={unresolved:[],globals:{},controls:new Map([
  ["demo.shell",{qualified:"demo.shell",namespace:"demo",id:"shell",declaration:"shell",baseRef:null,value:{type:"panel","$content_controls":[],controls:[{content:{type:"panel",controls:"$content_controls"}}]},provenance:{},file:"fixture",relative:"fixture",hash:"fixture",layer:"target"}],
  ["demo.screen",{qualified:"demo.screen",namespace:"demo",id:"screen",declaration:"screen@demo.shell",baseRef:"demo.shell",value:{"$content_controls":[{body:{type:"image",texture:"textures/ui/body"}}]},provenance:{},file:"fixture",relative:"fixture",hash:"fixture",layer:"target"}]
])};
const variableResult=resolveControl(variableIndex,"demo.screen");
assert.equal(variableResult.tree.controls[0].id,"content");
assert.equal(variableResult.tree.controls[0].controls[0].id,"body");
assert.equal(variableResult.tree.controls[0].controls[0].props.texture,"textures/ui/body");
const inheritedDefaults={unresolved:[],globals:{},controls:new Map([
  ["demo.base",{qualified:"demo.base",namespace:"demo",id:"base",value:{type:"panel","$pane|default":[100,40],"$touch|default":false,controls:[{body:{type:"panel",size:"$pane",ignored:"$touch"}}]}}],
  ["demo.derived",{qualified:"demo.derived",namespace:"demo",id:"derived",baseRef:"demo.base",value:{controls:[{extra:{type:"panel",size:"$pane",ignored:"$touch"}}]}}]
])};
for(const record of inheritedDefaults.controls.values())Object.assign(record,{declaration:record.id,file:'fixture',relative:'fixture',hash:'fixture',layer:'target',provenance:{}});
const defaultsResult=resolveControl(inheritedDefaults,"demo.derived");
assert.deepEqual(defaultsResult.tree.controls.find(n=>n.id==='extra').props.size,[100,40]);
assert.equal(defaultsResult.tree.controls.find(n=>n.id==='extra').props.ignored,false);
assert.equal(defaultsResult.unresolved.some(d=>d.kind==='unresolved_expression'),false);
const overrideResult=resolveControl(inheritedDefaults,"demo.derived",{overrides:{'$pane':[80,20],'$touch':true}});
assert.deepEqual(overrideResult.tree.controls.find(n=>n.id==='extra').props.size,[80,20]);
assert.equal(overrideResult.tree.controls.find(n=>n.id==='extra').props.ignored,true);
console.log("final-rp-v2-resolver-state-merge: ok");

const conditionalIndex={unresolved:[],globals:{},controls:new Map()};
for(const [id,value]of Object.entries({screen:{type:'panel','$touch':false,'$pane':[90,30],controls:[{mouse:{type:'panel',variables:[{requires:'(not $touch)','$selected_size':'$pane','$font':0}],size:'$selected_size',controls:[{label:{type:'label',font_scale_factor:'$font'}}]}},{local:{type:'panel','$pane':[22,11],size:'$pane'}}]}}))conditionalIndex.controls.set(`conditional.${id}`,{qualified:`conditional.${id}`,namespace:'conditional',id,declaration:id,value,file:'fixture',relative:'fixture',hash:'fixture',layer:'target'});
const conditional=resolveControl(conditionalIndex,'conditional.screen');
assert.deepEqual(conditional.tree.controls[0].props.size,[90,30]);
assert.equal(conditional.tree.controls[0].controls[0].props.font_scale_factor,0);
assert.deepEqual(conditional.tree.controls[1].props.size,[22,11]);
assert.equal(conditional.unresolved.some(d=>d.kind==='unresolved_expression'),false);
