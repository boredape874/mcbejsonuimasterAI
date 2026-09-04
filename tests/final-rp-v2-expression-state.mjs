import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { access } from "node:fs/promises";
import { evaluateExpression } from "../tools/_lib/final-rp-v2/expression.mjs";
import { materializeCollections, projectInteractionState } from "../tools/_lib/final-rp-v2/state-engine.mjs";
import { indexResourcePack } from "../tools/_lib/final-rp-v2/rp-index.mjs";
import { resolveControl } from "../tools/_lib/final-rp-v2/resolver.mjs";

const selected="not ((#form_button_text - '|selected') = #form_button_text)";
assert.equal(evaluateExpression(selected,{"#form_button_text":"PLAYER|selected"}).value,true);
assert.equal(evaluateExpression(selected,{"#form_button_text":"BANKER"}).value,false);
assert.equal(evaluateExpression("not ((#form_button_text - 'WIN') = #form_button_text)",{"#form_button_text":"PLAYER WIN"}).value,true);
assert.equal(evaluateExpression("($x * 2) + 1",{$x:4}).value,9);
assert.equal(evaluateExpression("('%.1s' * #form_button_text)",{"#form_button_text":"7|BANKER 카드"}).value,"7");
assert.equal(evaluateExpression("(#form_button_text - ('%.2s' * #form_button_text))",{"#form_button_text":"7|BANKER 카드"}).value,"BANKER 카드");
assert.equal(evaluateExpression("mystery($x)",{$x:1}).ok,false);

const fixture=JSON.parse(await readFile(join(import.meta.dirname,"fixtures","baccarat-form.json"),"utf8"));
const bindingNode=(id,index,type="image")=>({id,props:{type,collection_index:index,bindings:[{binding_type:"collection",binding_collection_name:"form_buttons",binding_name:type==="label"?"#form_button_text":"#form_button_texture",binding_name_override:type==="label"?"#text":"#texture"},{binding_type:"collection",binding_collection_name:"form_buttons",binding_name:"#form_button_texture_file_system",binding_name_override:"#texture_file_system"}]},controls:[]});
const materialized=materializeCollections({id:"root",props:{},controls:[bindingNode("card",0),bindingNode("history",6),bindingNode("data_label",33,"label")]},fixture);
assert.equal(materialized.tree.controls[0].props.texture,fixture.buttons[0].texture);assert.equal(materialized.tree.controls[1].props.texture,fixture.buttons[6].texture);assert.equal(materialized.tree.controls[0].props.texture_file_system,"resource");assert.equal(materialized.tree.controls[2].props.text,"12500원");
const payloadNode={id:"score",props:{type:"label",collection_index:0,bindings:[{binding_type:"collection",binding_collection_name:"form_buttons",binding_name:"#form_button_text",binding_name_override:"#card_payload"},{binding_type:"view",source_property_name:"('%.1s' * #card_payload)",target_property_name:"#text"}]},controls:[]};
const payloadFixture={...fixture,buttons:fixture.buttons.map((button,index)=>index===0?{...button,text:"7|PLAYER 첫 번째 카드"}:button)};
const payloadMaterialized=materializeCollections(payloadNode,payloadFixture);const payloadProjected=projectInteractionState(payloadMaterialized.tree,payloadFixture);
assert.equal(payloadProjected.tree.props.text,"7");assert.equal(payloadProjected.unresolved.length,0);

const button={id:"deal",props:{default_control:"default",hover_control:"hover",pressed_control:"pressed",locked_control:"locked",collection_index:32},collectionIndex:32,collectionItem:fixture.buttons[32],controls:["default","hover","pressed","locked"].map(id=>({id,props:{type:"image"},controls:[]}))};
for(const [expected,stateFixture] of [["default",{}],["hover",{hoveredIndex:32}],["pressed",{pressedIndex:32}],["locked",{lockedIndices:[32]}]]){const result=projectInteractionState(button,{...fixture,...stateFixture});const visible=result.tree.controls.filter(node=>node.visible).map(node=>node.id);assert.deepEqual(visible,[expected]);assert(result.tree.controls.every(node=>node.collectionIndex===32));}
const distinct=projectInteractionState(button,{...fixture,hoveredIndex:32,focusedIndex:31,selectedIndices:[21]});assert.equal(distinct.tree.state,"hover");
const unindexedButton={...button,props:{default_control:"default",hover_control:"hover",pressed_control:"pressed",locked_control:"locked"},collectionIndex:null,collectionItem:null};const unindexedHover=projectInteractionState(unindexedButton,{}, {interactionState:"hover"});assert.equal(unindexedHover.tree.state,"hover");assert.deepEqual(unindexedHover.tree.controls.filter(node=>node.visible).map(node=>node.id),["hover"]);assert.ok(unindexedHover.diagnostics.some(item=>item.kind==="unindexed_interaction_state_sample"));
const textureVisible={id:"empty-card-dependent",props:{collection_index:2,bindings:[{binding_type:"view",source_property_name:"not ((#form_button_texture - '/empty') = #form_button_texture)",target_property_name:"#visible"}]},collectionIndex:2,collectionItem:fixture.buttons[2],controls:[]};
const textureHidden={...textureVisible,collectionIndex:0,collectionItem:fixture.buttons[0]};
assert.equal(projectInteractionState(textureVisible,fixture).tree.props.visible,true);
assert.equal(projectInteractionState(textureHidden,fixture).tree.props.visible,false);
const unknown=projectInteractionState({...button,controls:[...button.controls,{id:"mystery_state",props:{},controls:[]}]},fixture);assert(unknown.unresolved.some(item=>item.kind==="unresolved_state_control"));
const animationIndex={controls:new Map([
  ["pd_casino_baccarat.fade_in",{value:{anim_type:"alpha",to:1},file:"ui/forms/casino/baccarat/index.json",hash:"fadehash"}],
  ["pd.wait",{value:{anim_type:"alpha",to:0,next:"@pd.reveal"},file:"ui/test.json",hash:"waithash"}],
  ["pd.reveal",{value:{anim_type:"alpha",to:1},file:"ui/test.json",hash:"revealhash"}],
  ["pd.pulse_up",{value:{anim_type:"alpha",to:0.8,next:"@pd.pulse_down"},file:"ui/test.json",hash:"uphash"}],
  ["pd.pulse_down",{value:{anim_type:"alpha",to:0.2,next:"@pd.pulse_up"},file:"ui/test.json",hash:"downhash"}],
  ["pd.size_wait",{value:{anim_type:"size",to:[0,47],next:"@pd.size_expand"},file:"ui/test.json",hash:"sizewaithash"}],
  ["pd.size_expand",{value:{anim_type:"size",to:[34,47]},file:"ui/test.json",hash:"sizeexpandhash"}]
])};
const animated=projectInteractionState({id:"content",qualified:"pd_casino_baccarat.table_content",props:{alpha:"@pd_casino_baccarat.fade_in"},controls:[]},fixture,{index:animationIndex});assert.equal(animated.tree.props.alpha,1);assert.equal(animated.diagnostics[0].kind,"animation_terminal_sample");assert.equal(animated.tree.provenance["/alpha"].hash,"fadehash");
const chained=projectInteractionState({id:"card",props:{alpha:"@pd.wait"},controls:[]},fixture,{index:animationIndex});assert.equal(chained.tree.props.alpha,1);assert.deepEqual(chained.diagnostics[0].chain,["pd.wait","pd.reveal"]);
const cyclic=projectInteractionState({id:"glow",props:{alpha:"@pd.pulse_up"},controls:[]},fixture,{index:animationIndex});assert.equal(cyclic.tree.props.alpha,0.8);assert.equal(cyclic.diagnostics[0].cyclic,true);
const sized=projectInteractionState({id:"card",props:{size:"@pd.size_wait"},controls:[]},fixture,{index:animationIndex});assert.deepEqual(sized.tree.props.size,[34,47]);assert.equal(sized.unresolved.length,0);
const badAnimation=projectInteractionState({id:"bad",props:{alpha:"@pd.dynamic"},controls:[]},fixture,{index:animationIndex});assert(badAnimation.unresolved.some(item=>item.kind==="unresolved_animation"));

const reportPath=join(import.meta.dirname,"..","workspace","pd_casino_baccarat","baccarat-mod-chip.report.json");
const hasLocalIntegration=await access(reportPath).then(()=>true,()=>false);
if(hasLocalIntegration){
  const report=JSON.parse(await readFile(reportPath,"utf8"));await access(report.rpRoot);
  const actualIndex=await indexResourcePack(report.rpRoot,{overlays:[join(import.meta.dirname,"..","references","upstreams","MCBVanillaResourcePack")]});const actualResolved=resolveControl(actualIndex,"@pd_casino_baccarat.screen");const actualMaterialized=materializeCollections(actualResolved.tree,fixture);
  function find(node,id){if(node.id===id)return node;for(const child of node.controls||[]){const match=find(child,id);if(match)return match;}return null;}
  function stateHost(node){if((node.controls||[]).filter(child=>["default","hover","pressed"].includes(child.id)).length>=2)return node;for(const child of node.controls||[]){const match=stateHost(child);if(match)return match;}return null;}
  for(const [id,index] of [["undo",29],["chip_100",24],["player_zone",21],["deal",32]])for(const [state,interaction] of [["default",{}],["hover",{hoveredIndex:index}],["pressed",{pressedIndex:index}]]){const projectedActual=projectInteractionState(actualMaterialized.tree,{...fixture,...interaction},{index:actualIndex}),target=stateHost(find(projectedActual.tree,id)),visibleStates=target.controls.filter(child=>["default","hover","pressed","locked"].includes(child.id)&&child.visible).map(child=>child.id);assert.deepEqual(visibleStates,[state],`${id} ${state}`);}
  const actualContent=find(projectInteractionState(actualMaterialized.tree,fixture,{index:actualIndex}).tree,"content");assert.equal(actualContent.props.alpha,1);
}else console.log("SKIP local pd_casino_baccarat integration fixture unavailable");
console.log("final-rp-v2-expression-state: ok");
