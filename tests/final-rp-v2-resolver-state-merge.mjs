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
console.log("final-rp-v2-resolver-state-merge: ok");
