import test from 'node:test';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, cp, unlink, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { configuration, root } from '../tools/studio/config.mjs';
import { startHost } from '../tools/studio/host.mjs';
import { editObject, jsonSpans, spanAt, removeArrayItems, appendControlBodies } from '../tools/studio/json-edit.mjs';
import { CodexBridge } from '../tools/studio/codex.mjs';
import { indexResourcePack } from '../tools/_lib/final-rp-v2/rp-index.mjs';
import { buildViewCatalog, matchesView } from '../tools/studio/views.mjs';
import { PackWorkspace, snapshot } from '../tools/studio/workspace.mjs';
import { compactStudioRender } from '../tools/studio/render-transfer.mjs';
import { selectionBounds, alignSelection, distributeSelection, gridSelection, matchSelectionSize, snapMove } from '../studio/geometry.js';
import { DEVICE_PRESETS, normalizeDevice, safeRect, layoutIssues } from '../studio/devices.js';

async function workspaceFixture(t) {
  const dir=join(process.env.MCBEKIT_TEST_ROOT||join(root,'workspace/test-studio'),randomUUID()),a=join(dir,'a');
  await mkdir(a,{recursive:true});await writeFile(join(a,'manifest.json'),'{}');await writeFile(join(a,'ui.json'),'base');
  const w=new PackWorkspace(join(dir,'runtime'));t.after(()=>w.close());
  const meta=await w.open(a);return {dir,a,b:meta.workingRpRoot,w};
}

test('pack workspace copies A, preserves B across reopen, imports A and applies B with backups',async t=>{
  const {a,b,w,dir}=await workspaceFixture(t);
  await writeFile(join(b,'ui.json'),'B change');assert.equal(await readFile(join(a,'ui.json'),'utf8'),'base');
  const reopened=new PackWorkspace(join(dir,'runtime'));t.after(()=>reopened.close());
  assert.equal((await reopened.open(a)).workingRpRoot,b);assert.equal(await readFile(join(b,'ui.json'),'utf8'),'B change');
  await writeFile(join(a,'new.txt'),'A added');
  const pull=await w.preview('pull');assert.equal(pull.retainedCount,1);assert.deepEqual(pull.changes.map(c=>c.path),['new.txt']);
  await w.apply(pull.id);assert.equal(await readFile(join(b,'new.txt'),'utf8'),'A added');assert.equal(await readFile(join(b,'ui.json'),'utf8'),'B change');
  await unlink(join(b,'new.txt'));
  const push=await w.preview('push');assert.deepEqual(push.changes.map(c=>c.kind),['delete','update']);
  const applied=await w.apply(push.id);assert.equal(await readFile(join(a,'ui.json'),'utf8'),'B change');
  assert.equal(await readFile(join(applied.backupRoot,'before/ui.json'),'utf8'),'base');
  assert.equal(await readFile(join(applied.backupRoot,'before/new.txt'),'utf8'),'A added');
  assert.equal((await w.preview('pull')).changes.length,0);
});

test('pack workspace blocks conflicts and stale plans, tracks converged edits and opposite changes',async t=>{
  const {a,b,w}=await workspaceFixture(t);
  await writeFile(join(a,'ui.json'),'A');await writeFile(join(b,'ui.json'),'B');
  const conflict=await w.preview('push');assert.equal(conflict.conflicts.length,1);
  await assert.rejects(w.apply(conflict.id),/WORKSPACE_CONFLICT/);assert.equal(await readFile(join(a,'ui.json'),'utf8'),'A');
  await writeFile(join(b,'ui.json'),'A');const converged=await w.preview('pull');await w.apply(converged.id);
  await writeFile(join(b,'ui.json'),'B2');const valid=await w.preview('push');assert.equal(valid.changes.length,1);
  await writeFile(join(a,'late.txt'),'late');await assert.rejects(w.apply(valid.id),/WORKSPACE_STALE/);
  const next=await w.preview('push');assert.equal(next.retainedCount,1);await w.apply(next.id);
  assert.equal(w.summary().originChanged,true,'A-only file still needs importing');
  const pull=await w.preview('pull');await w.apply(pull.id);assert.equal(await readFile(join(b,'late.txt'),'utf8'),'late');
});

test('pack workspace rolls back completed files if a later write fails and rejects links',async t=>{
  const {a,b,w,dir}=await workspaceFixture(t);await writeFile(join(b,'manifest.json'),'{"name":"new"}');await writeFile(join(b,'ui.json'),'new');
  const plan=await w.preview('push'),original=w.replace.bind(w);let once=false;
  w.replace=async(...args)=>{if(args[1]==='ui.json'&&!once){once=true;throw Error('simulated IO failure');}return original(...args);};
  await assert.rejects(w.apply(plan.id),/simulated IO failure/);
  assert.equal(await readFile(join(a,'manifest.json'),'utf8'),'{}');assert.equal(await readFile(join(a,'ui.json'),'utf8'),'base');
  assert.equal((await w.preview('push')).changes.length,2);
  const outside=join(dir,'outside');await mkdir(outside);await symlink(outside,join(a,'link'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(snapshot(a),/WORKSPACE_LINK/);
});

test('public Studio open always edits B, keeps selected form on restart and does not write A',{timeout:120000},async t=>{
  const config=await configuration(),dir=join(process.env.MCBEKIT_TEST_ROOT||join(root,'workspace/test-studio'),randomUUID()),a=join(dir,'a');
  await cp(join(root,'examples/studio-rp'),a,{recursive:true});const before=await snapshot(a);
  const host=await startHost({...config,port:0,runtime:join(dir,'runtime'),bridgeRoot:join(dir,'native')});t.after(()=>host.close());
  const call=async(name,args)=>{const response=await fetch(host.connection.url+'/api/'+name,{method:'POST',headers:{Authorization:'Bearer '+host.connection.token,'Content-Type':'application/json'},body:JSON.stringify(args)});const result=await response.json();assert.equal(response.status,200,result.error);return result;};
  const opened=await call('open',{rpRoot:a,useWorkspace:false});assert.equal(opened.status,'ready',opened.error);
  assert.notEqual(opened.project.rpRoot,a);assert.equal(opened.workspace.originRpRoot,a);assert.equal(host.session.context().workspace.workingRpRoot,opened.project.rpRoot);
  const source=await call('read_source',{path:'ui/live_demo.json'});
  await call('write_source',{path:source.path,expectedHash:source.sha256,text:source.text+'\n// B edit\n'});
  assert.deepEqual(await snapshot(a),before);assert.equal((await call('workspace_preview',{direction:'push'})).changes.length,1);
  const restored=await startHost({...config,port:0,runtime:join(dir,'runtime'),bridgeRoot:join(dir,'native')});t.after(()=>restored.close());
  assert.equal(restored.session.project.rpRoot,opened.project.rpRoot);assert.equal(restored.session.project.workspaceId,opened.project.workspaceId);
  assert.ok((await restored.session.readSource(source.path)).text.includes('// B edit'));assert.deepEqual(await snapshot(a),before);
});

test('Studio render transfer preserves geometry and immediate origins without recursive or graph duplication',()=>{
  const result={reportPath:'report.json',bindingGraph:{schema:'g',nodes:[1,2],edges:[1],unresolved:[1]},controls:{root:{rect:{x:1},source:{relative:'ui/a.json',hash:'h',value:{huge:true}},provenance:{huge:true}}},render:{controls:{}},editorLayout:{layout:{viewport:[480,270],nodes:[{id:'root',pointer:'',rect:{x:1},controls:[{huge:true}],props:{type:'panel',controls:[{huge:true}]},provenance:{'':{relative:'ui/a.json'},'/offset':{hash:'h'},'/controls/0/text':{huge:true}}}]}}};
  const small=compactStudioRender(result);assert.equal(small.bindingGraph,undefined);assert.equal(small.bindingGraphSummary.nodeCount,2);assert.equal(small.bindingGraphSummary.detailReport,'report.json');
  assert.deepEqual(small.editorLayout.layout.nodes[0].rect,result.editorLayout.layout.nodes[0].rect);assert.ok(small.editorLayout.layout.nodes[0].provenance['/offset']);
  assert.equal(small.editorLayout.layout.nodes[0].props.controls,undefined);assert.equal(small.editorLayout.layout.nodes[0].provenance['/controls/0/text'],undefined);
  assert.equal(small.controls.root.source.value,undefined);assert.ok(result.bindingGraph);assert.ok(result.editorLayout.layout.nodes[0].props.controls);
});

test('form catalog uses title routes rather than template names',()=>{
  const doc={namespace:'forms',button:{type:'button'},maybe_form:{type:'panel'},screen:{type:'screen'},a:{type:'panel'},b:{type:'panel'},router:{type:'panel',controls:[
    {'a@forms.a':{bindings:[{binding_type:'view',source_property_name:"(#title_text = 'A')",target_property_name:'#visible'}]}},
    {'b@forms.b':{bindings:[{binding_type:'view',source_property_name:"(#title_text = 'B')",target_property_name:'#visible'}]}},
  ]},host:{type:'panel',factory:{name:'server_form_factory',control_ids:{long_form:'@forms.router'}}}};
  const screens=Object.entries(doc).filter(([key])=>key!=='namespace').map(([declaration,value])=>({control:'forms.'+declaration,path:'ui/forms.json',declaration,type:value.type,registered:true}));
  const catalog=buildViewCatalog(screens,new Map([['ui/forms.json',doc]]));
  assert.deepEqual(catalog.forms.map(view=>view.control),['forms.a','forms.b']);
  assert.ok(catalog.forms.every(view=>view.renderControl==='forms.router'));
  assert.ok(catalog.components.some(view=>view.control==='forms.maybe_form'));
  assert.equal(matchesView(catalog.forms[0],{title:'B'}),false);
  assert.equal(matchesView(catalog.forms[0],{title:'A'}),true);
});

test('whole forms include shared shell, isolate routes, retain per-form fixtures and load matching vanilla overrides',{timeout:120000},async t=>{
  const config=await configuration(),dir=join(process.env.MCBEKIT_TEST_ROOT||join(root,'workspace/test-studio'),randomUUID());
  const rpRoot=join(dir,'rp'),vanillaRoot=join(dir,'vanilla');
  await cp(join(root,'examples/studio-rp'),rpRoot,{recursive:true});await mkdir(join(vanillaRoot,'ui'),{recursive:true});
  await writeFile(join(vanillaRoot,'ui/_ui_defs.json'),JSON.stringify({ui_defs:['ui/server_form.json']}));
  await writeFile(join(vanillaRoot,'ui/server_form.json'),JSON.stringify({namespace:'server_form',main_screen_content:{type:'panel'}}));
  await writeFile(join(rpRoot,'ui/_ui_defs.json'),JSON.stringify({ui_defs:['ui/forms.json']}));
  const image={type:'image',texture:'textures/ui/live_pixel',size:[160,100]};
  await writeFile(join(rpRoot,'ui/forms.json'),JSON.stringify({namespace:'forms',a:{type:'panel',controls:[{a_background:image}]},b:{type:'panel',controls:[{b_background:{...image,color:[0,1,0]}}]},button_part:{type:'label',text:'Internal'}}));
  await writeFile(join(rpRoot,'ui/unregistered.json'),JSON.stringify({namespace:'loose',form:{type:'panel'}}));
  await writeFile(join(rpRoot,'ui/server_form.json'),JSON.stringify({namespace:'server_form',main_screen_content:{type:'panel',factory:{name:'server_form_factory',control_ids:{long_form:'@server_form.router'}}},router:{type:'panel',controls:[
    {'a@forms.a':{bindings:[{binding_type:'view',source_property_name:"(#title_text = 'A')",target_property_name:'#visible'}]}},
    {'b@forms.b':{bindings:[{binding_type:'view',source_property_name:"(#title_text = 'B')",target_property_name:'#visible'}]}},
    {shared_close:{type:'panel',size:[20,20]}}
  ]}}));
  const index=await indexResourcePack(rpRoot,{overlays:[vanillaRoot]});
  assert.ok(index.controls.has('server_form.router'));
  assert.equal(index.controls.has('loose.form'),false,'unregistered arbitrary files are not made runtime roots');
  const host=await startHost({...config,port:0,runtime:join(dir,'runtime'),bridgeRoot:join(dir,'native')});t.after(()=>host.close());
  const s=host.session,catalog=await s.catalog(rpRoot),a=catalog.forms.find(view=>view.control==='forms.a'),b=catalog.forms.find(view=>view.control==='forms.b');
  await s.open({rpRoot,vanillaRoot,viewId:a.id,fixture:{title:'A',body:'A body',buttons:[{text:'A action'}]}});
  assert.equal(s.project.control,'server_form.router');
  assert.ok(s.editor.nodes.find(node=>node.id==='a_background').visible);
  assert.equal(s.editor.nodes.find(node=>node.id==='b_background').visible,false);
  assert.ok(s.editor.nodes.find(node=>node.id==='shared_close').visible);
  const hashA=s.state.report.hash;
  await s.open({rpRoot,vanillaRoot,viewId:b.id});
  assert.equal(s.project.fixture.title,'B');assert.equal(s.project.fixture.buttons,undefined,'A payload must not leak into B');
  assert.equal(s.editor.nodes.find(node=>node.id==='a_background').visible,false);
  assert.ok(s.editor.nodes.find(node=>node.id==='b_background').visible);
  assert.notEqual(s.state.report.hash,hashA);
  await s.render({fixture:{title:'B',body:'B body',buttons:[{text:'B action'}]}});
  await s.open({rpRoot,vanillaRoot,viewId:a.id});assert.equal(s.project.fixture.body,'A body');assert.equal(s.state.report.hash,hashA);
  await s.open({rpRoot,vanillaRoot,viewId:b.id});assert.equal(s.project.fixture.body,'B body');
  await assert.rejects(s.open({rpRoot,viewId:'nonexistent'}),/더 이상/);
  const restored=await startHost({...config,port:0,runtime:join(dir,'runtime'),bridgeRoot:join(dir,'native')});t.after(()=>restored.close());
  assert.equal(restored.session.project.viewId,b.id);assert.equal(restored.session.project.fixture.body,'B body');
});

test('device profiles distinguish physical specs, editable logical coordinates and safe-area test margins',()=>{
  const consoleProfile=normalizeDevice({presetId:'console-fhd'},[480,270]);
  assert.deepEqual(safeRect([480,270],consoleProfile),{x:24,y:13.5,w:432,h:243});assert.equal(consoleProfile.runtimeVerified,false);
  const adjusted=normalizeDevice({presetId:'tablet-ipad',physicalSize:[1000,750]},[400,300]);assert.equal(adjusted.source,null);assert.equal(adjusted.physicalSpecMatches,false);
  assert.throws(()=>normalizeDevice({presetId:'mobile-iphone',safeInsets:[0,0,0,26]},[584,270]),/안전 여백/);
  assert.throws(()=>normalizeDevice({presetId:'pc-fhd'},[480.5,270]),/작업 크기/);
  assert.equal(DEVICE_PRESETS.filter(p=>p.family==='태블릿').length,2);
  const nodes=[{key:'/',visible:true,type:'panel',rect:{x:0,y:0,w:480,h:270}},{key:'edge',id:'edge',visible:true,type:'label',rect:{x:1,y:1,w:30,h:10}},{key:'outside',id:'outside',visible:true,type:'button',rect:{x:479,y:30,w:20,h:10}},{key:'hidden',visible:false,rect:{x:-100,y:0,w:20,h:10}}];
  assert.deepEqual(layoutIssues(nodes,[480,270],consoleProfile).map(i=>i.kind),['SAFE_AREA','PREVIEW_BOUNDS']);
});

test('editor geometry: edge/center guides, equal gaps, grid, axis lock and unequal element sizes',()=>{
  const n=(id,x,y,w=10,h=10,index=0)=>({id,index,rect:{x,y,w,h},props:{offset:[x,y]}});
  const a=n('a',0,0),b=n('b',30,0,20),c=n('c',80,0);
  assert.deepEqual(selectionBounds([a,b,c]),{x:0,y:0,w:90,h:10});
  assert.deepEqual(matchSelectionSize([a,b]).map(e=>e.patch.size),[[20,10],[20,10]]);
  assert.deepEqual(alignSelection([b],'centerX',{x:0,y:0,w:100,h:100})[0].patch.offset,[40,0]);
  assert.deepEqual(alignSelection([a,b,c],'bottom').map(e=>e.patch.offset),[[0,0],[30,0],[80,0]]);
  assert.deepEqual(distributeSelection([c,a,b],'x').map(e=>e.patch.offset),[[0,0],[35,0],[80,0]]);
  assert.throws(()=>distributeSelection([a,n('b',1,0),n('c',2,0)],'x'),/겹칩니다/);
  assert.deepEqual(gridSelection([a,b,c],2,8).map(e=>e.patch.offset),[[0,0],[28,0],[0,18]]);
  assert.throws(()=>gridSelection([a,b],0,8),/열 수/);
  const edge=snapMove({x:10,y:10,w:10,h:10},17,0,{peers:[n('peer',30,50)],grid:8,threshold:4});
  assert.equal(edge.dx,20,'smart alignment precedes a coarser grid');assert.equal(edge.guides[0].axis,'x');
  const spaced=snapMove({x:65,y:0,w:10,h:10},-6,0,{peers:[a,n('peer',30,0)],grid:0,threshold:2});
  assert.equal(spaced.dx,-5);assert.equal(spaced.guides.find(g=>g.gap!==undefined).gap,20);
  const left=snapMove({x:-35,y:0,w:10,h:10},6,0,{peers:[a,n('peer',30,0)],grid:0,threshold:2});
  assert.equal(left.guides.find(g=>g.gap!==undefined).to-left.guides.find(g=>g.gap!==undefined).from,20);
  assert.deepEqual(snapMove(a.rect,5,7,{smart:false,grid:0}),{dx:5,dy:7,guides:[]});
  assert.deepEqual(snapMove(a.rect,5,7,{smart:false,grid:8,axis:'x'}),{dx:8,dy:0,guides:[]});
  assert.equal(snapMove(a.rect,100,100,{peers:[b],grid:0,threshold:2}).guides.length,0);
  assert.throws(()=>alignSelection([{...a,props:{offset:['$x',0]}}],'left',b.rect),/동적 위치/);
});

test('JSONC patch preserves comments, escaped keys, trailing commas and unrelated content',()=>{
  const text='\uFEFF{\n// retained\n"a/b": {"size": [20, 10], /* sizing */ "text": "old", // keep\n}, "untouched": 1\n}';
  const updated=editObject(text,'/a~1b',{size:[24,12],offset:[3,4]});
  assert.match(updated,/\/\/ retained/);assert.match(updated,/\/\* sizing \*\//);assert.match(updated,/\/\/ keep/);assert.match(updated,/"untouched": 1/);
  assert.equal(jsonSpans(updated).kind,'{');
  assert.throws(()=>jsonSpans('{"a":1,"a":2}'),/duplicate/);
});

test('real Studio: source provenance, visual edits, undo, conflict, images, shared context, HTTP boundaries',{timeout:120000},async t=>{
  const config=await configuration();
  const dir=join(process.env.MCBEKIT_TEST_ROOT || join(root,'workspace/test-studio'),randomUUID());await mkdir(dir,{recursive:true});
  const rpRoot=join(dir,'rp');await cp(join(root,'examples/studio-rp'),rpRoot,{recursive:true});
  const host=await startHost({...config,port:0,runtime:join(dir,'runtime'),bridgeRoot:join(dir,'native')});t.after(()=>host.close());
  const s=host.session;
  const first=await s.open({rpRoot});assert.equal(first.status,'ready',first.error);assert.equal(s.editor.screens.length,1);
  const workerPid = s.worker.pid;
  const composite = createCanvas(...s.project.viewport), compositeCtx = composite.getContext('2d');
  compositeCtx.imageSmoothingEnabled = false;
  for (const sprite of s.editor.layers) { const b=sprite.bounds; compositeCtx.drawImage(await loadImage(Buffer.from(sprite.data.split(',')[1],'base64')),b.x,b.y,b.w,b.h); }
  assert.equal(createHash('sha256').update(await composite.encode('png')).digest('hex'),first.report.hash,'editor layers must composite to the exact engine preview');
  let node=s.editor.nodes.find(n=>n.id==='progress');assert.ok(node.source);assert.equal(node.source.pointer,'/screen/controls/4/progress');
  const original=await s.readSource('ui/live_demo.json'), initialHash=first.report.hash;
  await s.select({key:node.key});assert.equal(s.context().selection.id,'progress');
  const sourceBeforeProfiles=await s.readSource('ui/live_demo.json');
  await s.configureViewport({viewport:[584,270],previewDevice:{presetId:'mobile-iphone'}});
  assert.deepEqual(s.project.viewport,[584,270]);assert.equal(s.selection,node.key);assert.equal(s.context().previewDevice.presetId,'mobile-iphone');
  await s.configureViewport({viewport:[584,270]});assert.equal(s.context().previewDevice.presetId,'mobile-iphone');
  const comparisonRevision=s.editorRevision;
  const comparison=await s.compareViewports({expectedRevision:comparisonRevision,presetIds:['pc-fhd','tablet-ipad','console-fhd','mobile-iphone']});
  assert.equal(comparison.profiles.length,4);assert.deepEqual(comparison.profiles[1].viewport,[480,360]);assert.ok(comparison.profiles.every(p=>p.nodes.length&&p.layers.length));
  assert.equal(s.editorRevision,comparisonRevision);assert.equal(s.selection,node.key);assert.equal(s.undoStack.length,0);assert.equal((await s.readSource('ui/live_demo.json')).text,sourceBeforeProfiles.text);
  await assert.rejects(s.configureViewport({viewport:[0,270],previewDevice:{presetId:'pc-fhd'}}),/작업 크기/);assert.deepEqual(s.project.viewport,[584,270]);
  await assert.rejects(s.compareViewports({expectedRevision:comparisonRevision-1,presetIds:['pc-fhd']}),/PREVIEW_CONFLICT/);
  s.ai.busy=true;await assert.rejects(s.compareViewports({expectedRevision:comparisonRevision,presetIds:['pc-fhd']}),/Codex/);s.ai.busy=false;
  await s.configureViewport({viewport:[480,270],previewDevice:null});node=s.editor.nodes.find(n=>n.id==='progress');
  await s.edit({key:node.key,expectedRevision:s.editorRevision,expectedHash:node.source.sha256,patch:{size:[80,12],offset:[9,35]}});
  const savedRevision=s.editorRevision;
  await new Promise(resolve=>setTimeout(resolve,350));
  assert.equal(s.revision,savedRevision,'a GUI save must not schedule a second watcher render');
  assert.equal(s.worker.pid,workerPid,'edits must reuse the renderer worker');
  assert.notEqual(s.state.report.hash,initialHash);assert.deepEqual(s.editor.nodes.find(n=>n.id==='progress').props.offset,[9,35]);
  await assert.rejects(s.edit({key:node.key,expectedRevision:s.editorRevision,expectedHash:original.sha256,patch:{alpha:.5}}),/SOURCE_CONFLICT/);
  await s.history({direction:'undo'});assert.equal((await s.readSource(original.path)).text,original.text);assert.equal(s.state.report.hash,initialHash);
  await s.history({direction:'redo'});assert.notEqual(s.state.report.hash,initialHash);
  const group=s.editor.nodes.filter(n=>['title','progress'].includes(n.id));
  await s.select({key:group[0].key,keys:group.map(n=>n.key)});assert.equal(s.context().selectionCount,2);assert.equal(s.context().selectionGroup.length,2);
  const beforeBatch=await s.readSource(original.path),historyCount=s.undoStack.length;
  const edits=group.map((n,i)=>({key:n.key,expectedHash:n.source.sha256,patch:{offset:[i*20,20]}}));
  await assert.rejects(s.batchEdit({expectedRevision:s.editorRevision,edits:edits.map((e,i)=>({...e,expectedHash:i?'stale':e.expectedHash}))}),/SOURCE_CONFLICT/);
  assert.equal((await s.readSource(original.path)).text,beforeBatch.text,'failed batches must never partially write');
  await s.batchEdit({expectedRevision:s.editorRevision,edits});assert.equal(s.undoStack.length,historyCount+1);
  assert.deepEqual(s.editor.nodes.find(n=>n.id==='progress').props.offset,[20,20]);
  await s.history({direction:'undo'});assert.equal((await s.readSource(original.path)).text,beforeBatch.text);
  const commented=beforeBatch.text.replace('"progress":{','"progress":{/* clone comment */"custom_extra":{"keep":"value"},');
  await s.writeSource({path:original.path,text:commented,expectedHash:beforeBatch.sha256});await s.render();
  let duplicateNode=s.editor.nodes.find(n=>n.id==='progress');
  await writeFile(join(rpRoot,'ir.yaml'),'version: 1\n');
  await assert.rejects(s.duplicate({key:duplicateNode.key,expectedRevision:s.editorRevision,expectedHash:duplicateNode.source.sha256}),/IR_OWNER/);
  await assert.rejects(s.batchEdit({expectedRevision:s.editorRevision,edits:[{key:duplicateNode.key,expectedHash:duplicateNode.source.sha256,patch:{offset:[3,4]}}]}),/IR_OWNER/);
  assert.equal((await s.readSource(original.path)).text,commented);await unlink(join(rpRoot,'ir.yaml'));
  const copied=await s.duplicate({key:duplicateNode.key,expectedRevision:s.editorRevision,expectedHash:duplicateNode.source.sha256});
  const clone=s.editor.nodes.find(n=>n.id===copied.id);assert.deepEqual(clone.props.offset,duplicateNode.props.offset.map(v=>v+8));assert.equal(clone.props.texture,duplicateNode.props.texture);
  const clonedText=(await s.readSource(original.path)).text;assert.equal((clonedText.match(/clone comment/g)||[]).length,2);assert.equal((clonedText.match(/"custom_extra"/g)||[]).length,2);
  await s.history({direction:'undo'});assert.equal((await s.readSource(original.path)).text,commented);
  await s.select({key:null});await s.render();assert.equal(s.context().selectionCount,0);assert.equal(s.context().selection,undefined);
  await assert.rejects(s.writeSource({path:original.path,text:'{"broken":',expectedHash:(await s.readSource(original.path)).sha256}));
  await assert.rejects(s.readSource('../outside.json'));
  const pixel=await readFile(join(rpRoot,'textures/ui/live_pixel.png'));
  await assert.rejects(s.importImage({name:'broken.png',data:Buffer.from('not-png').toString('base64')}),/PNG/);
  const uploaded=await s.importImage({name:'../../sprite.png',data:pixel.toString('base64')});assert.match(uploaded.texture,/^textures\/studio\//);
  await s.render();node=s.editor.nodes[0];
  await s.add({key:node.key,expectedRevision:s.editorRevision,expectedHash:node.source.sha256,type:'image',texture:uploaded.texture});
  assert.ok(s.editor.nodes.some(n=>n.props.texture===uploaded.texture));
  const latest=await s.readSource(original.path);await writeFile(join(rpRoot,original.path),latest.text+'\n// external edit\n');
  await assert.rejects(s.history({direction:'undo'}),/SOURCE_CONFLICT/);
  const externalDeadline=Date.now()+5000;
  while((s.editorRevision===savedRevision||s.state.stale||s.editor.nodes[0].source.sha256!==createHash('sha256').update(latest.text+'\n// external edit\n').digest('hex'))&&Date.now()<externalDeadline)await new Promise(resolve=>setTimeout(resolve,40));
  assert.equal(s.editor.nodes[0].source.sha256,createHash('sha256').update(latest.text+'\n// external edit\n').digest('hex'),'external writes must still refresh the shared source evidence');
  await s.acceptFrame({data:pixel.toString('base64'),source:'test window'});assert.equal(s.context().gameFrame.source,'test window');
  s.clearFrame();assert.equal(s.context().gameFrame,null);
  const preview=await readFile(s.state.report.outputPath);
  await s.acceptBrowserFrame({data:preview.toString('base64'),revision:s.state.renderedRevision,fontMode:'approximate'});assert.equal(s.context().previewFontMode,'approximate-system-font');
  await assert.rejects(s.acceptBrowserFrame({data:pixel.toString('base64'),revision:0}),/PREVIEW_CONFLICT/);
  await assert.rejects(s.acceptBrowserFrame({data:pixel.toString('base64'),revision:s.state.renderedRevision}),/dimensions/);
  const sharp = createCanvas(s.project.viewport[0]*2,s.project.viewport[1]*2);
  sharp.getContext('2d').drawImage(await loadImage(preview),0,0,sharp.width,sharp.height);
  await s.acceptBrowserFrame({data:(await sharp.encode('png')).toString('base64'),revision:s.state.renderedRevision,captureScale:2,fontMode:'approximate'});
  assert.equal(s.context().previewCaptureScale,2);
  await assert.rejects(s.acceptBrowserFrame({data:preview.toString('base64'),revision:s.state.renderedRevision,captureScale:2}),/dimensions/);
  const changedCatalog = await s.readSource(original.path);
  await s.writeSource({path:original.path,text:editObject(changedCatalog.text,'',{extra_screen:{type:'panel',size:[32,32]}}),expectedHash:changedCatalog.sha256});
  await s.render();assert.ok(s.editor.screens.some(screen=>screen.control==='live_demo.extra_screen'));
  await writeFile(join(rpRoot,'ir.yaml'),'schema_version: 1\n');node=s.editor.nodes[0];
  await assert.rejects(s.edit({key:node.key,expectedRevision:s.editorRevision,expectedHash:node.source.sha256,patch:{offset:[1,1]}}),/IR_OWNER/);
  const request=async(path,headers={})=>fetch(host.connection.url+path,{method:path.startsWith('/api/')?'POST':'GET',headers});
  assert.equal((await request('/api/status')).status,401);
  assert.equal((await request('/api/status',{Authorization:'Bearer '+host.connection.token,Origin:'https://example.com'})).status,403);
  const html=await request('/');assert.match(html.headers.get('content-security-policy'),/script-src 'self'/);
  assert.equal((await request('/app.js')).status,200);assert.equal((await request('/style.css')).status,200);assert.equal((await request('/geometry.js')).status,200);
  const ctx=await request('/api/studio_context',{Authorization:'Bearer '+host.connection.token});assert.equal((await ctx.json()).runtimeVerified,false);
  const restored=await startHost({...config,port:0,runtime:join(dir,'runtime'),bridgeRoot:join(dir,'native')});t.after(()=>restored.close());
  assert.equal(restored.session.project.control,s.project.control,'restart must restore the last screen');
  assert.equal(restored.session.state.status,'ready');
});

test('Codex streams actual protocol items, exposes approvals, rejects unsupported requests, and handles completion',()=>{
  const sent=[],session={config:{},render:async()=>{}};
  const bridge=new CodexBridge(session);bridge.threadId='thread';bridge.child={stdin:{writable:true,write:line=>sent.push(JSON.parse(line))}};
  bridge.receive({method:'item/agentMessage/delta',params:{threadId:'thread',itemId:'a',delta:'안녕'}});
  bridge.receive({method:'item/agentMessage/delta',params:{threadId:'thread',itemId:'a',delta:'하세요'}});
  assert.equal(bridge.messages[0].text,'안녕하세요');
  bridge.receive({id:5,method:'item/commandExecution/requestApproval',params:{command:'node verify.mjs'}});
  assert.equal(bridge.status().requests.length,1);assert.equal(sent.length,0);
  bridge.reply({id:5,decision:'decline'});assert.equal(sent[0].result.decision,'decline');
  bridge.receive({id:6,method:'unsupported/test',params:{}});assert.equal(sent[1].error.code,-32601);
  bridge.receive({id:7,method:'mcpServer/elicitation/request',params:{mode:'form',requestedSchema:{properties:{confirm:{type:'boolean'}}}}});
  assert.equal(sent.length,2);bridge.reply({id:7,decision:'accept',content:{confirm:true}});assert.deepEqual(sent[2].result,{action:'accept',content:{confirm:true}});
  bridge.busy=true;bridge.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:'completed'}}});assert.equal(bridge.busy,false);
});
test('Codex feedback steers the exact active turn with fresh selection context',async()=>{
  const bridge=new CodexBridge({config:{},project:{},context:()=>({stale:false,selection:{id:'title'}})});
  bridge.busy=true;bridge.threadId='thread';bridge.turnId='active';let called;
  bridge.rpc=async(method,params)=>{called={method,params};return {turnId:'active'};};
  await bridge.message({text:'제목을 크게',includePreview:false});
  assert.equal(called.method,'turn/steer');assert.equal(called.params.expectedTurnId,'active');assert.equal(called.params.input[0].text,'제목을 크게');
  assert.equal(bridge.busy,true);assert.equal(bridge.messages.at(-1).role,'user');
});

test('JSONC structural edits retain surrounding comments with first, middle, last and all controls',()=>{
  for(const trailing of ['',','])for(const indices of [[0],[1],[2],[0,2],[0,1,2]]){
    const source='{"controls":[/* before */{"a":{}}/* a */, // between\n{"b":{}},{"c":{}}/* last */'+trailing+'],"untouched":17}';
    const result=removeArrayItems(source,'/controls',indices);
    const array=spanAt(jsonSpans(result),'/controls');assert.equal(array.members.size,3-indices.length);
    for(const comment of ['/* before */','/* a */','// between','/* last */'])assert.ok(result.includes(comment));
    const restored=appendControlBodies(result,'',[{declaration:'p@base.panel',body:'{/* copied */"type":"panel"}'}]);
    assert.equal(spanAt(jsonSpans(restored),'/controls').members.size,4-indices.length);assert.match(restored,/copied/);assert.match(restored,/"untouched":17/);
  }
  assert.equal(spanAt(jsonSpans(appendControlBodies('{"type":"panel"}','',[{declaration:'child',body:'{}'}])),'/controls').members.size,1);
});

test('Studio clipboard freezes originals, preserves JSONC subtrees, guards ownership and supports atomic undo',{timeout:120000},async t=>{
  const config=await configuration(),dir=join(process.env.MCBEKIT_TEST_ROOT||join(root,'workspace/test-studio'),randomUUID());
  const rpRoot=join(dir,'rp');await mkdir(dir,{recursive:true});await cp(join(root,'examples/studio-rp'),rpRoot,{recursive:true});
  const file=join(rpRoot,'ui/live_demo.json');
  await writeFile(file,'{"namespace":"live_demo","screen":{"type":"panel","size":[480,270],"controls":[{"group":{"type":"panel","offset":[4,6],"controls":[{"nested":{"type":"label","text":"nested","size":[50,20]}}]}},{"title":{/* original comment */"type":"label","text":"frozen","size":[100,24],"offset":[10,20]}},{"last":{"type":"panel","size":[10,10]}}]}}');
  const host=await startHost({...config,port:0,runtime:join(dir,'runtime'),bridgeRoot:join(dir,'native')});t.after(()=>host.close());const s=host.session;await s.open({rpRoot});
  const node=id=>id==='screen'?s.editor.nodes[0]:s.editor.nodes.find(n=>n.id===id),copy=ids=>s.copy({keys:ids.map(id=>node(id).key),expectedRevision:s.editorRevision});
  const paste=clip=>{const parent=node('screen');return s.paste({...clip,key:parent.key,expectedRevision:s.editorRevision,expectedHash:parent.source.sha256});};
  const original=await s.readSource('ui/live_demo.json'),history=s.undoStack.length;
  await assert.rejects(s.copy({keys:[node('title').key],expectedRevision:s.editorRevision,cut:'false'}),/boolean/);
  await assert.rejects(copy(['screen']),/루트/);await assert.rejects(copy(['group','nested']),/부모와 자식/);
  const clip=await copy(['title','group']);assert.equal(s.undoStack.length,history);assert.equal((await s.readSource(original.path)).text,original.text);
  await s.edit({key:node('title').key,expectedRevision:s.editorRevision,expectedHash:node('title').source.sha256,patch:{text:'changed'}});
  const beforePaste=await s.readSource(original.path),h=s.undoStack.length;
  await assert.rejects(paste({...clip,sessionId:'expired'}),/만료/);
  const result=await paste(clip);assert.equal(s.undoStack.length,h+1);assert.equal(result.ids.length,2);
  assert.equal(node(result.ids[0]).props.text,'frozen');assert.deepEqual(node(result.ids[0]).props.offset,[18,28]);assert.deepEqual(node(result.ids[1]).props.offset,[12,14]);
  assert.ok(s.editor.nodes.some(n=>n.id==='nested'&&n.parent===node(result.ids[1]).key));assert.equal(((await s.readSource(original.path)).text.match(/original comment/g)||[]).length,2);
  const again=await paste(clip);assert.notEqual(again.ids[0],result.ids[0]);assert.deepEqual(node(again.ids[0]).props.offset,[26,36]);
  await s.history({direction:'undo'});await s.history({direction:'undo'});assert.equal((await s.readSource(original.path)).text,beforePaste.text);
  const cutBefore=await s.readSource(original.path);const cut=await s.copy({keys:[node('title').key,node('last').key],expectedRevision:s.editorRevision,cut:true});assert.equal(node('title'),undefined);assert.equal(node('last'),undefined);
  const moved=await paste(cut);assert.deepEqual(node(moved.ids[0]).props.offset,[10,20]);
  await s.history({direction:'undo'});await s.history({direction:'undo'});assert.equal((await s.readSource(original.path)).text,cutBefore.text);
  await s.remove({keys:[node('nested').key,node('last').key],expectedRevision:s.editorRevision});assert.equal(node('nested'),undefined);assert.equal(node('last'),undefined);
  await s.history({direction:'undo'});assert.equal((await s.readSource(original.path)).text,cutBefore.text);
  const key=node('title').key;await assert.rejects(s.copy({keys:[key],expectedRevision:s.editorRevision-1}),/PREVIEW_CONFLICT/);
  await writeFile(join(rpRoot,'ir.yaml'),'version: 1');await copy(['title']);await assert.rejects(paste(clip),/IR_OWNER/);await assert.rejects(s.remove({keys:[key],expectedRevision:s.editorRevision}),/IR_OWNER/);await unlink(join(rpRoot,'ir.yaml'));
  const live=node('title');await s.edit({key:live.key,expectedRevision:s.editorRevision,expectedHash:live.source.sha256,patch:{offset:['$dynamic',0]}});
  const dynamic=await copy(['title']);const unchanged=await s.readSource(original.path);await assert.rejects(paste(dynamic),/동적 위치/);assert.equal((await s.readSource(original.path)).text,unchanged.text);
  s.ai.busy=true;await assert.rejects(paste(clip),/CODEX_BUSY/);await assert.rejects(s.copy({keys:[node('group').key],expectedRevision:s.editorRevision,cut:true}),/CODEX_BUSY/);s.ai.busy=false;
  const beforeInherited=await s.readSource(original.path);
  const inheritedText=appendControlBodies(editObject(beforeInherited.text,'',{preset:{type:'label',offset:[40,50],size:[50,20]}}),'/screen',[{declaration:'inherited@live_demo.preset',body:'{"text":"inherited","size":[50,20]}'}]);
  await s.writeSource({path:original.path,text:inheritedText,expectedHash:beforeInherited.sha256});await s.render();
  await assert.rejects(copy(['inherited']),/공통 템플릿/);assert.equal((await s.readSource(original.path)).text,inheritedText);
  const response=await fetch(host.connection.url+'/api/copy',{method:'POST',headers:{Authorization:'Bearer '+host.connection.token,'Content-Type':'application/json'},body:JSON.stringify({keys:[node('group').key],expectedRevision:s.editorRevision})});
  assert.equal(response.status,200);assert.equal((await response.json()).format,'json-ui-studio/clipboard@1');
  const other=join(dir,'other');await cp(join(root,'examples/studio-rp'),other,{recursive:true});await s.open({rpRoot:other});await assert.rejects(paste(clip),/같은 리소스팩/);
});

test('Codex session display follows real thread/turn results and clears on reset',async()=>{
  const bridge=new CodexBridge({config:{engineRoot:root,runtime:root},project:{rpRoot:root},context:()=>({stale:false,renderedRevision:7})});
  bridge.connect=async()=>{bridge.state='connected';bridge.account='signed-in';};
  bridge.rpc=async method=>method==='thread/start'?{thread:{id:'returned-thread'}}:{turn:{id:'returned-turn'}};
  const result=await bridge.message({text:'  제목을 정렬해줘  ',includePreview:false});
  assert.equal(result.threadId,'returned-thread');assert.equal(result.turnId,'returned-turn');assert.equal(result.sessionTitle,'제목을 정렬해줘');assert.equal(result.messageCount,1);assert.ok(result.sessionStartedAt<=Date.now());
  await assert.rejects(bridge.reset(),/CODEX_BUSY/);bridge.busy=false;await bridge.reset();
  assert.equal(bridge.status().threadId,null);assert.equal(bridge.status().sessionTitle,null);assert.equal(bridge.status().sessionStartedAt,null);assert.equal(bridge.status().messageCount,0);assert.equal(bridge.status().state,'connected');
});


test('Codex session catalog includes every local source and keeps paging and search on the server',async()=>{
  const bridge=new CodexBridge({config:{}});bridge.connect=async()=>{};
  const calls=[];bridge.rpc=async(method,params)=>{calls.push({method,params});return method==='thread/read'?{thread:{id:'old',name:'Existing title',cwd:'C:/old',status:{type:'idle'}}}:{data:[{id:'old',name:'Existing title',preview:'p'.repeat(500),cwd:'C:/old'}],nextCursor:'page2'};};
  const result=await bridge.listSessions({cursor:'page1',search:'  Existing  ',archived:true});
  assert.equal(result.data[0].name,'Existing title');assert.equal(result.data[0].preview.length,300);assert.equal(result.nextCursor,'page2');
  assert.equal(calls[0].params.searchTerm,'Existing');assert.equal(calls[0].params.cursor,'page1');assert.equal(calls[0].params.archived,true);assert.equal(calls[0].params.limit,40);
  for(const source of ['cli','vscode','appServer','exec','unknown','subAgent'])assert.ok(calls[0].params.sourceKinds.includes(source));
  assert.equal('cwd' in calls[0].params,false,'catalog must include other projects');
  assert.equal((await bridge.readSession({threadId:'old'})).cwd,'C:/old');assert.equal(calls.at(-1).params.includeTurns,false);
  await assert.rejects(bridge.listSessions({archived:'true'}),/잘못된/);await assert.rejects(bridge.readSession({threadId:''}),/잘못된/);
});

test('Codex resumes the chosen ID with Studio tools, bounded chronological history and no inference',async()=>{
  const bridge=new CodexBridge({config:{engineRoot:root,runtime:root},project:{rpRoot:root},context:()=>({stale:false})});
  bridge.connect=async()=>{bridge.state='connected';};const calls=[];
  bridge.rpc=async(method,params)=>{
    calls.push({method,params});
    if(method==='thread/read')return {thread:{id:'chosen',name:'Original title',status:{type:'idle'}}};
    if(method==='thread/turns/list')return {data:[{items:[{type:'agentMessage',id:'a2',text:'recent'}]},{items:[{type:'userMessage',id:'u1',content:[{type:'text',text:'first'}]},{type:'agentMessage',id:'a1',text:'reply'}]}],nextCursor:'older'};
    if(method==='thread/resume')return {thread:{id:'chosen',name:'Original title',createdAt:1234,status:{type:'idle'}}};
    if(method==='turn/start')return {turn:{id:'continued'}};
    throw Error(method);
  };
  const result=await bridge.resumeSession({threadId:'chosen'});
  assert.equal(result.threadId,'chosen');assert.equal(result.sessionTitle,'Original title');assert.equal(result.sessionStartedAt,1234000);
  assert.deepEqual(result.messages.map(m=>m.text),['first','reply','recent']);assert.equal(result.historyLimited,true);assert.equal(result.busy,false);
  assert.equal(calls.some(c=>c.method==='turn/start'),false);assert.equal(calls.some(c=>c.method==='thread/start'),false);
  const resume=calls.find(c=>c.method==='thread/resume').params;assert.equal(resume.cwd,root);assert.equal(resume.excludeTurns,true);assert.ok(resume.config['mcp_servers.jsonui_studio']);assert.match(resume.developerInstructions,/IR owner/);
  await bridge.message({text:'continue',includePreview:false});assert.equal(calls.at(-1).params.threadId,'chosen');assert.equal(calls.at(-1).method,'turn/start');
  await assert.rejects(bridge.resumeSession({threadId:'another'}),/CODEX_BUSY/);
  bridge.busy=false;const before=bridge.status();
  bridge.rpc=async()=>({thread:{id:'running',status:{type:'active'}}});
  await assert.rejects(bridge.resumeSession({threadId:'running'}),/실행 중/);assert.equal(bridge.threadId,before.threadId);assert.deepEqual(bridge.messages,before.messages);assert.equal(bridge.busy,false);
  bridge.rpc=async()=>{throw Error('resume failed');};await assert.rejects(bridge.resumeSession({threadId:'missing'}),/resume failed/);assert.equal(bridge.threadId,'chosen');
});


test('actual Studio keyboard handler accepts canvas Backspace/Delete and preserves native text editing',async()=>{
  const app=await readFile(join(root,'studio/app.js'),'utf8');
  const first=app.indexOf("window.addEventListener('keydown',e=>{");
  const last=app.indexOf("\ndocument.addEventListener('paste'",first);
  let handle,removed=0;const artboard={dataset:{}},target={isContentEditable:false,closest:()=>null},window={addEventListener:(name,fn,capture)=>{assert.equal(name,'keydown');assert.equal(capture,true);handle=fn;}};
  const scope={window,view:'preview',document:{querySelector:()=>null},$:()=>artboard,deleteElements:async()=>{removed++;},toast:()=>{}};
  runInNewContext(app.slice(first,last),scope);
  const press=options=>{const event={key:'Backspace',code:'Backspace',keyCode:8,repeat:false,isComposing:false,ctrlKey:false,metaKey:false,altKey:false,composedPath:()=>[target],preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...options};handle(event);return event;};
  for(const options of [{},{key:'Delete',code:'Delete',keyCode:46},{isComposing:true,defaultPrevented:true},{key:'Unidentified',code:'',keyCode:8}]){
    const before=removed,event=press(options);assert.equal(removed,before+1);assert.equal(event.prevented,true);
  }
  for(const options of [{repeat:true},{ctrlKey:true},{metaKey:true},{altKey:true},{key:'Process',code:'',keyCode:229}]){
    const before=removed,event=press(options);assert.equal(removed,before);assert.equal(event.prevented,undefined);
  }
  for(const kind of ['input','textarea','select','textbox','contenteditable']){
    target.isContentEditable=kind==='contenteditable';target.closest=()=>kind==='contenteditable'?null:{tagName:kind};
    const before=removed,event=press({isComposing:true});assert.equal(removed,before);assert.equal(event.prevented,undefined);
  }
  target.isContentEditable=false;target.closest=()=>null;scope.document.querySelector=()=>({open:true});const before=removed;press({});assert.equal(removed,before);
});

test('Studio deletion waits for its pending refresh, cancels a changed selection and clears shifted siblings',async()=>{
  const app=await readFile(join(root,'studio/app.js'),'utf8'),first=app.indexOf('let deleting=false;'),last=app.indexOf("\non('copyElements'",first);
  const node={key:'/controls/0',id:'chosen',source:{path:'ui/test.json'}},artboard={dataset:{}},calls=[];
  const scope={view:'preview',picked:new Set([node.key]),pickedNodes:()=>[node],editor:{nodes:[node]},selected:node,editingNode:node,dirty:true,state:{stale:true,studioRevision:5},saving:false,
    $:()=>artboard,isLocked:()=>false,toast:()=>{},closeEditMenu:()=>{},updateArrange:()=>{},refreshStudio:async()=>{},api:async(method,args)=>{calls.push({method,args});},
    setTimeout:(resolve)=>{scope.state.stale=false;scope.state.studioRevision=6;resolve();}};
  runInNewContext(app.slice(first,last),scope);await scope.deleteElements();
  assert.equal(calls[0].method,'remove');assert.equal(calls[0].args.expectedRevision,6);assert.equal(calls[1].method,'select');assert.equal(calls[1].args.key,null);assert.equal(scope.picked.size,0);assert.equal(scope.selected,null);
  scope.picked=new Set([node.key]);scope.state.stale=true;scope.setTimeout=resolve=>{scope.state.stale=false;scope.picked=new Set(['/controls/1']);resolve();};
  const before=calls.length;await assert.rejects(scope.deleteElements(),/선택이 바뀌어/);assert.equal(calls.length,before);assert.equal(scope.saving,false);
});
