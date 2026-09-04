import assert from "node:assert/strict";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { indexResourcePack } from "../tools/_lib/final-rp-v2/rp-index.mjs";
import { resolveControl } from "../tools/_lib/final-rp-v2/resolver.mjs";
import { evaluateExpression } from "../tools/_lib/final-rp-v2/expression.mjs";
import { materializeCollections, projectInteractionState } from "../tools/_lib/final-rp-v2/state-engine.mjs";
import { layoutTree, resolveDimension } from "../tools/_lib/final-rp-v2/layout-engine.mjs";
import { buildDisplayList } from "../tools/_lib/final-rp-v2/display-list.mjs";

const fixtureRoot=join(import.meta.dirname,"fixtures","final-rp-v2"),vanilla=join(import.meta.dirname,"..","references","upstreams","MCBVanillaResourcePack");
const index=await indexResourcePack(fixtureRoot,{overlays:[vanilla]});
assert(index.controls.has("v2.screen"));
const resolved=resolveControl(index,"@v2.screen");assert(resolved.tree);assert.equal(resolved.tree.controls[0].props.size[0],120);assert.match(resolved.tree.controls[0].source.hash,/^[a-f0-9]{64}$/);assert(Object.entries(resolved.tree.controls[0].provenance).some(([pointer,evidence])=>pointer.endsWith("/type")&&evidence.file&&evidence.hash));
assert.equal(resolved.tree.controls[0].provenance["/controls/0/offset/0"].sourcePointer,"/screen/controls/0/instance@v2.base/offset/0");
const collection=materializeCollections(resolved.tree,{buttons:[{index:0,text:"A",texture:"textures/a"},{index:1,text:"B"}]});assert.equal(collection.tree.controls[0].controls[0].props.texture,"textures/a");
const projected=projectInteractionState(collection.tree,{hoveredIndex:1,buttons:[{index:0,text:"A"},{index:1,text:"B"}]});assert.equal(projected.tree.controls[0].controls[1].state,"hover");
const layout=layoutTree(projected.tree,{viewport:[200,100],content:[40,20]});assert.equal(layout.nodes.find(node=>node.id==="first").rect.w,56);assert.equal(layout.nodes.find(node=>node.id==="second").rect.w,22);assert.equal(layout.nodes.find(node=>node.id==="first").alpha,.5);assert(layout.nodes.find(node=>node.id==="first").clip);
const absoluteCollection=layoutTree({id:"absolute_collection",props:{type:"collection_panel",size:[100,80],anchor_from:"top_left",anchor_to:"top_left"},controls:[{id:"left",props:{type:"panel",size:[10,10],offset:[12,18],anchor_from:"top_left",anchor_to:"top_left"},controls:[]},{id:"right",props:{type:"panel",size:[10,10],offset:[61,43],anchor_from:"top_left",anchor_to:"top_left"},controls:[]}]},{viewport:[100,80]});assert.deepEqual(absoluteCollection.nodes.find(node=>node.id==="left").rect,{x:12,y:18,w:10,h:10});assert.deepEqual(absoluteCollection.nodes.find(node=>node.id==="right").rect,{x:61,y:43,w:10,h:10});
assert.equal(resolveDimension("25%cm - 5",{parent:100,contentMax:80},{},[],""),15);assert.equal(resolveDimension("100%sm + 10px",{parent:100,siblingMax:24},{},[],""),34);assert.equal(resolveDimension("19px",{parent:100},{},[],""),19);assert.equal(resolveDimension("fill",{parent:91},{},[],""),91);assert.equal(resolveDimension("default",{parent:91,default:7},{},[],""),7);const siblingLayout=layoutTree({id:"root",props:{type:"panel",size:[100,100],anchor_from:"top_left",anchor_to:"top_left"},controls:[{id:"fixed",props:{type:"panel",size:[44,12]},controls:[]},{id:"matched",props:{type:"panel",size:["100%sm","100%sm"]},controls:[]}]},{viewport:[100,100]});assert.deepEqual(siblingLayout.nodes.find(node=>node.id==="matched").rect.w,44);assert.deepEqual(siblingLayout.nodes.find(node=>node.id==="matched").rect.h,12);
assert.deepEqual(evaluateExpression("($x * 2) + 1",{$x:4}).value,9);assert.equal(evaluateExpression("($x ? 1 : 2)",{$x:true}).ok,false);
const display=buildDisplayList(layout);assert(display.commands.some(command=>command.op==="image"&&command.texture==="textures/a"));
const baccarat=JSON.parse(await readFile(join(import.meta.dirname,"fixtures","baccarat-form.json"),"utf8"));assert.equal(baccarat.buttons.length,42);
if(index.controls.has("common_buttons.light_text_button")){const fortyTwo=resolveControl(index,"@v2.base",{overrides:{controls:baccarat.buttons.map(button=>({[`button_${button.index}@common_buttons.light_text_button`]:{collection_index:button.index,size:[10,10],text:"#form_button_text"}}))}});
const fortyTwoMaterialized=materializeCollections(fortyTwo.tree,baccarat),buttonChildren=fortyTwoMaterialized.tree.controls.filter(child=>child.id.startsWith("button_"));assert.equal(buttonChildren.length,42);assert.equal(buttonChildren[21].props.text,"PLAYER|selected");assert.equal(buttonChildren[41].collectionIndex,41);}
console.log("final-rp-v2-core: ok");
