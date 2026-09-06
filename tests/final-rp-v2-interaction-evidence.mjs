import assert from "node:assert/strict";
import { buildBindingGraph } from "../tools/_lib/final-rp-v2/bindings.mjs";
import { materializeCollectionGraph } from "../tools/_lib/final-rp-v2/collections.mjs";
import { projectInteractionState } from "../tools/_lib/final-rp-v2/state-engine.mjs";
import { deriveInteractionState, projectTooltipVisibility, validateStateContentPersistence } from "../tools/_lib/final-rp-v2/interaction-state.mjs";
import { contentCacheKey, readContentCache, writeContentCache } from "../tools/_lib/final-rp-v2/content-cache.mjs";
import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeHitRegions } from "../tools/_lib/final-rp-v2/hit-test.mjs";
import { classifyUnresolved } from "../tools/_lib/final-rp-v2/unresolved-impact.mjs";

const label=(id,index)=>({id,pointer:`/${id}`,props:{type:"label",collection_index:index,bindings:[{binding_type:"collection",binding_collection_name:"form_buttons",binding_name:"#form_button_text",binding_name_override:"#text"}]},controls:[]});
const tree={id:"root",props:{type:"panel"},controls:[label("first",7),label("second",2)]};
const fixture={buttons:[{index:2,text:"two"},{index:7,text:"seven",details:{kind:"detail"}}],hiddenIndices:[2]};
const materialized=materializeCollectionGraph(tree,fixture);
assert.equal(materialized.tree.controls[0].props.text,"seven");assert.equal(materialized.tree.controls[0].collectionOrdinal,1);assert.equal(materialized.tree.controls[1].collectionProvenance.filteredHidden,true);assert.equal(materialized.tree.controls[1].collectionProvenance.responseIndex,2);
assert.equal(materialized.provenance.length,2);
const graph=buildBindingGraph(materialized.tree,{fixture});assert.equal(graph.edges.length,2);assert.equal(graph.edges[0].sourceProperty,"#form_button_text");assert.equal(graph.edges[0].targetProperty,"#text");
const detailsTree={id:"details",pointer:"/details",props:{type:"button",collection_index:2,bindings:[{binding_type:"collection_details",binding_collection_name:"form_buttons"}]},controls:[]};
const details=materializeCollectionGraph(detailsTree,fixture);assert.equal(details.unresolved.length,0,"endpoint-free collection_details establishes item context");assert.equal(buildBindingGraph(details.tree,{fixture}).unresolved.length,0,"binding graph accepts endpoint-free collection_details");
const missing=buildBindingGraph({id:"x",props:{bindings:[{binding_type:"view",source_control_name:"missing",source_property_name:"#x",target_property_name:"#visible"}]},controls:[]});assert.equal(missing.unresolved[0].kind,"unresolved_binding_source_control");
const missingValue=projectInteractionState({id:"missing-value",props:{type:"label",text:"#not_supplied"},controls:[]},{});assert.equal(missingValue.unresolved.at(0).kind,"unresolved_expression");

assert.equal(deriveInteractionState({id:"toggle",props:{type:"toggle"}},{toggleStates:{toggle:true}},{requestedState:"hover"}).state,"checked_hover");
assert.equal(deriveInteractionState({id:"input",props:{type:"edit_box"}},{textInputs:{input:"abc"}},{requestedState:"focused"}).state,"focused_text");
assert.equal(deriveInteractionState({id:"tab",props:{type:"tab"}},{selectedIndices:[3]},{index:3}).state,"selected");
const content=(text)=>({id:"state",props:{type:"panel"},controls:[{id:"caption",props:{type:"label",semantic_id:"caption",text,bindings:[]},controls:[]}]});
assert.equal(validateStateContentPersistence({id:"button",props:{type:"button"},controls:[{...content("A"),id:"default"},{...content("B"),id:"hover"}]}).at(0).kind,"STATE_CONTENT_LOSS");
const imageState=(id,texture,withIcon=true)=>({id,props:{type:"panel"},controls:[{id:"background",props:{type:"image",semantic_id:"background",texture,bindings:[]},controls:[]},...(withIcon?[{id:"icon",props:{type:"image",semantic_id:"icon",texture:"textures/ui/icon",bindings:[]},controls:[]}]:[])]});
assert.equal(validateStateContentPersistence({id:"styled",props:{type:"button"},controls:[imageState("default","textures/ui/default"),imageState("hover","textures/ui/hover")]}).length,0,"state texture changes are styling, not content loss");
assert.equal(validateStateContentPersistence({id:"missing-icon",props:{type:"button"},controls:[imageState("default","textures/ui/default"),imageState("hover","textures/ui/hover",false)]}).at(0).kind,"STATE_CONTENT_LOSS");
assert.equal(projectTooltipVisibility({hovered:false}).visible,false);assert.equal(projectTooltipVisibility({hovered:true}).visible,true);assert.equal(projectTooltipVisibility({inputMode:"touch",focused:true}).visible,true);assert.equal(projectTooltipVisibility({inputMode:"touch",touchFallback:"hover-only"}).verifiedFallback,false);

const layout={viewport:[100,100],nodes:[{id:"screenwide",qualified:"demo.screenwide",pointer:"/0",props:{type:"button"},rect:{x:0,y:0,w:100,h:100},clip:null,alpha:1,layer:0,visible:true},{id:"covered",qualified:"demo.covered",pointer:"/1",props:{type:"button"},rect:{x:40,y:40,w:20,h:20},clip:null,alpha:1,layer:1,visible:true}]};
const hit=analyzeHitRegions(layout,{step:10});assert(hit.diagnostics.some(issue=>issue.kind==="EXCESSIVE_HIT_AREA"));assert(hit.pointerSweep.samples.every(sample=>sample.hits.length<=2));assert.equal(hit.nodes.find(node=>node.id==="demo.screenwide").occludedBy.includes("demo.covered"),true);
assert.equal(classifyUnresolved([{kind:"unresolved_expression",property:"visible"},{kind:"unresolved_expression",property:"color"}]).counts.blocking,1);
const cacheRoot=await mkdtemp(join(tmpdir(),"final-rp-cache-store-")),cachePath=join(cacheRoot,"entry.json"),cacheKey=contentCacheKey({contentHash:"a",revision:"r1",node:process.version,platform:process.platform,arch:process.arch,schema:"v1",toolHash:"t1"});await Promise.all([writeContentCache(cachePath,cacheKey,{answer:1},{revision:"r1"}),writeContentCache(cachePath,cacheKey,{answer:1},{revision:"r1"})]);assert.equal((await readContentCache(cachePath,cacheKey)).hit,true);assert.equal((await readdir(cacheRoot)).some(name=>name.endsWith(".tmp")),false);await writeFile(cachePath,'{"schema":"broken"}');assert.equal((await readContentCache(cachePath,cacheKey)).reason,"CACHE_CORRUPT");
console.log("final-rp-v2-interaction-evidence: ok");
