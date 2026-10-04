import { readFile, writeFile, readdir, realpath, mkdir, cp, stat } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseUiSource, DEFAULT_RUNTIME_DIALECT } from '../_lib/json-dialect.mjs';
import { LiveSession, hash } from './session.mjs';
import { editObject, jsonSpans, spanAt, removeArrayItems, appendControlBodies } from './json-edit.mjs';
import { DEVICE_PRESETS, normalizeDevice, validateViewport } from '../../studio/devices.js';
import { buildViewCatalog, matchesView, prepareViewFixture, titleTextureRules } from './views.mjs';
import { PackWorkspace } from './workspace.mjs';
import { importFormFixtures, loadFormFixtures, fixtureSummaries } from './fixtures.mjs';

const parse = text => parseUiSource(text, { kind: 'runtime', dialect:DEFAULT_RUNTIME_DIALECT }).document;
const esc = key => key.replaceAll('~', '~0').replaceAll('/', '~1');
const editableProps = new Set(['offset','size','text','font_scale_factor','color','alpha','layer','anchor_from','anchor_to','visible','texture','keep_ratio']);
export class StudioSession extends LiveSession {
  constructor(config) { super(config); this.undoStack = []; this.redoStack = []; this.selection = null; this.selectionKeys=[]; this.selectionInitialized=false; this.editor = { nodes: [], screens: [] }; this.clips=new Map(); this.workspace = new PackWorkspace(config.runtime,info=>this.publish(info?.progress ? {workspaceProgress:info.progress} : {})); }
  status() { return { ...super.status(), workspace:this.project?.workspaceId ? this.workspace.summary() : null, studio: true, selection: this.selection, selectionKeys:this.selectionKeys, history: {undo:this.undoStack.length,redo:this.redoStack.length}, studioRevision:this.editorRevision, gameFrame:this.gameFrame && {capturedAt:this.gameFrame.capturedAt,source:this.gameFrame.source} }; }
  async catalog(rpRoot) {
    const root = await realpath(rpRoot), screens = [], issues = [], documents = new Map();
    const safeRead = async path => {
      const file = await realpath(join(root,path)), rel = relative(root,file);
      if (rel.startsWith('..') || isAbsolute(rel)) throw Error('Pack reference escapes RP');
      if ((await stat(file)).size > 2 * 1024 * 1024) throw Error('UI file exceeds 2 MiB');
      return parse(await readFile(file,'utf8'));
    };
    let defs = [];
    try { defs = (await safeRead('ui/_ui_defs.json')).ui_defs || []; } catch(error) { issues.push(error.message); }
    const paths = new Set(defs.filter(p => typeof p === 'string'));
    const walk = async dir => {
      for (const e of await readdir(join(root,dir), {withFileTypes:true}).catch(() => [])) {
        if (e.isSymbolicLink()) continue;
        const path = `${dir}/${e.name}`;
        if (e.isDirectory()) await walk(path); else if (/\.jsonc?$/i.test(e.name)) paths.add(path);
      }
    };
    await walk('ui');
    for (const path of paths) {
      try {
        const doc = await safeRead(path); if (!doc.namespace) continue;
        documents.set(path, doc);
        for (const [declaration, value] of Object.entries(doc)) {
          if (declaration === 'namespace' || !value || typeof value !== 'object' || Array.isArray(value)) continue;
          screens.push({control:`${doc.namespace}.${declaration.split('@')[0]}`, declaration, path, type:value.type || 'inherited', base:declaration.split('@')[1], registered:defs.includes(path), pointer:`/${esc(declaration)}`});
        }
      } catch(error) { issues.push(`${path}: ${error.message}`); }
    }
    let packName;
    try{packName=String((await safeRead('manifest.json')).header?.name??'').slice(0,100);}catch{}
    const views = buildViewCatalog(screens, documents);
    for (const form of views.forms) {
      const source = screens.find(screen => screen.control === form.control);
      form.titleVariants = [];
      for (const rule of titleTextureRules(documents.get(source?.path)?.[source?.declaration])) {
        if (rule.texturePrefix.includes('..') || isAbsolute(rule.texturePrefix)) continue;
        const dir = rule.texturePrefix.endsWith('/') ? rule.texturePrefix.slice(0,-1) : dirname(rule.texturePrefix), prefix = rule.texturePrefix.slice(dir === '.' ? 0 : dir.length + 1);
        let folder;
        try { folder = await realpath(join(root, dir)); } catch { continue; }
        const rel = relative(root, folder); if (rel.startsWith('..') || isAbsolute(rel)) continue;
        for (const file of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
          if (!file.isFile() || !/\.(png|tga)$/i.test(file.name) || !file.name.startsWith(prefix)) continue;
          const suffix = file.name.slice(prefix.length).replace(/\.(png|tga)$/i,'');
          const title = rule.titlePrefix + suffix;
          if (matchesView(form,{title}) && !form.titleVariants.some(variant=>variant.title===title)) form.titleVariants.push({title,texture:rule.texturePrefix+suffix});
          if (form.titleVariants.length >= 128) break;
        }
      }
      if (form.titleVariants.length) form.titleHint = form.titleVariants[0].title;
    }
    return {rpRoot:root,screens,issues,packName,...views};
  }
  async open(input) {
    if (this.ai?.busy) throw Error('Codex 작업이 끝난 뒤 팩이나 화면을 바꿔 주세요.');
    if (input.useWorkspace || input.workspaceId) {
      if(this.project?.workspaceId)await this.persistProject();
      this.publish({status:'preparing-workspace',workspaceProgress:null});
      let workspace;
      try { workspace = await this.workspace.open(input.rpRoot,input.workspaceId); }
      catch(error) { this.publish({status:'error',error:error.message,workspaceProgress:null}); throw error; }
      this.publish({workspaceProgress:null});
      input = {...input,rpRoot:workspace.workingRpRoot,workspaceId:workspace.id};
      try{
        const saved=JSON.parse(await readFile(join(this.config.runtime,'workspaces',workspace.id,'studio-project.json'),'utf8'));
        if(saved.workspaceId===workspace.id&&saved.rpRoot===workspace.workingRpRoot){
          const explicitControl=input.control&&!input.viewId;input={...saved,...input};if(explicitControl)delete input.viewId;
        }
      }catch(error){if(error.code!=='ENOENT')throw error;}
    }
    const catalog = await this.catalog(input.rpRoot);
    const samePack = this.project?.rpRoot === catalog.rpRoot;
    const fixtureLibraryId=samePack?this.project.fixtureLibraryId:input.fixtureLibraryId;
    this.fixtureRecords=fixtureLibraryId?await loadFormFixtures(fixtureLibraryId,this.config.runtime):[];
    let view = input.viewId ? catalog.views.find(view => view.id === input.viewId) : null;
    if(!view&&input.control)view=catalog.hud.find(view=>view.control===input.control)??null;
    if (input.viewId && !view) throw Error('선택한 폼이나 화면이 더 이상 존재하지 않습니다.');
    if (!view && !input.control) view = catalog.forms[0] ?? catalog.hud[0] ?? catalog.views.find(view => view.kind === 'screen') ?? catalog.views[0];
    const control = view?.renderControl || input.control || catalog.screens[0]?.control;
    if (!control) throw Error('이 폴더에서 namespace가 있는 JSON UI를 찾지 못했습니다.');
    const changed = !samePack;
    const fixtures = samePack ? structuredClone(this.project.viewFixtures || {}) : structuredClone(input.viewFixtures || {});
    if (samePack && this.project.viewId) fixtures[this.project.viewId] = structuredClone(this.project.fixture);
    if (samePack && this.project.fixture?.title) for (const form of catalog.forms) {
      if (form.titleConditions.length && matchesView(form,this.project.fixture) && !fixtures[form.id]) fixtures[form.id] = structuredClone(this.project.fixture);
    }
    const activeViewId = view?.id;
    let fixture = input.fixture ?? (activeViewId && fixtures[activeViewId]) ?? (samePack && view && matchesView(view, this.project.fixture) ? this.project.fixture : {});
    let fixtureRecordId=input.fixtureRecordId??(samePack?this.project.fixtureRecordId:null);
    if(view?.kind==='form'&&!Array.isArray(fixture.buttons)) {
      const captured=this.fixtureRecords.find(record=>matchesView(view,record.fixture));
      if(captured){fixture=structuredClone(captured.fixture);fixtureRecordId=captured.id;}
    }
    fixtureRecordId=this.fixtureRecords.find(record=>JSON.stringify(record.fixture)===JSON.stringify(fixture))?.id??null;
    if (view) fixture = prepareViewFixture(view, fixture).fixture;
    if (changed) { this.undoStack = []; this.redoStack = []; await this.ai?.reset(); }
    this.selection = null; this.selectionKeys=[]; this.selectionInitialized=false; this.catalogDirty = false; this.editor = {...catalog,nodes:[]};
    const state = await super.open({...input,control,fixture,viewId:activeViewId,viewFixtures:fixtures,fixtureLibraryId,fixtureRecordId});
    this.editor.fixtureRecords=fixtureSummaries(this.fixtureRecords);
    await mkdir(this.config.runtime,{recursive:true});
    await writeFile(join(this.config.runtime,'last-project.json'),JSON.stringify(this.project,null,2));
    this.publish({restoreError:null});
    return this.status();
  }
  async render(changes = {}) {
    if(changes.fixture!==undefined&&this.project)this.project.fixtureRecordId=null;
    const state = await super.render(changes), revision = state.renderedRevision;
    if (state.status === 'ready' && !state.stale && revision === this.revision) {
      try {
        const resolved = this.resolved;
        if (revision !== this.revision) return this.status();
        const nodes = resolved.layout.nodes.map((node, index) => {
          let own = node.provenance?.[node.pointer];
          if (!own) {
            // Inline declarations have property evidence, not an object-level record.
            // Check the actual declaration name; do not infer it from a render index.
            for (const [key, evidence] of Object.entries(node.provenance || {})) {
              if (key.slice(node.pointer.length + 1).includes('/') || !evidence.sourcePointer || evidence.layer !== 'target') continue;
              const pointer = evidence.sourcePointer.replace(/\/[^/]+$/, '');
              const declaration = pointer.split('/').at(-1).replaceAll('~1','/').replaceAll('~0','~');
              if (declaration.split('@')[0] === node.id) { own = {...evidence,sourcePointer:pointer}; break; }
            }
          }
          // An exact declaration origin is required; never guess a source from layout indexes.
          const origin = own?.sourcePointer !== undefined ? {...own,pointer:own.sourcePointer} : own;
          let source = origin?.relative && origin?.pointer !== undefined ? {path:origin.relative,pointer:origin.pointer,sha256:origin.hash,layer:origin.layer} : null;
          if (source?.layer !== 'target') source = null;
          const parentPointer = node.pointer.replace(/\/controls\/\d+$/, '');
          return {key:node.pointer || '/',id:node.id,qualified:node.qualified,type:node.props.type,props:node.props,rect:node.rect,clip:node.clip,alpha:node.alpha,layer:node.layer,visible:node.visible !== false && node.props.visible !== false,depth:(node.pointer.match(/\/controls\//g)||[]).length,parent:node.pointer ? parentPointer || '/' : null,source,index};
        });
        const catalog = this.catalogDirty ? await this.catalog(this.project.rpRoot) : this.editor;
        this.catalogDirty = false;
        if (revision !== this.revision) return this.status();
        this.editor = {...this.editor,screens:catalog.screens,views:catalog.views,forms:catalog.forms,hud:catalog.hud,components:catalog.components,issues:catalog.issues,packName:catalog.packName,nodes,layers:this.previewLayers,unresolved:resolved.unresolved,viewport:resolved.layout.viewport,control:resolved.control};
        this.editorRevision = revision;
        await this.persistProject();
        if (!this.selectionInitialized || (this.selection!==null&&!nodes.some(n => n.key === this.selection))) this.selection = nodes[0]?.key || null;
        this.selectionInitialized=true;
        this.selectionKeys=this.selectionKeys.filter(key=>nodes.some(n=>n.key===key));
        if(!this.selectionKeys.length&&this.selection)this.selectionKeys=[this.selection];
        this.publish({editorError:null});
      } catch(error) { this.publish({editorError:error.message}); }
    }
    return this.status();
  }
  async persistProject() {
    if(!this.project)return;
    await mkdir(this.config.runtime,{recursive:true});
    const text=JSON.stringify(this.project,null,2);await writeFile(join(this.config.runtime,'last-project.json'),text);
    if(this.project.workspaceId)await writeFile(join(this.config.runtime,'workspaces',this.project.workspaceId,'studio-project.json'),text);
  }
  async configureViewport({viewport,previewDevice}) {
    if(!this.project)throw Error('먼저 팩을 여세요.');
    if(this.ai?.busy)throw Error('Codex 작업이 끝난 뒤 미리보기 크기를 바꿔 주세요.');
    const size=validateViewport(viewport),device=normalizeDevice(previewDevice===undefined?this.project.previewDevice:previewDevice,size);
    this.project.viewport=size;
    if(device)this.project.previewDevice=device;else delete this.project.previewDevice;
    const result=await this.render();
    await writeFile(join(this.config.runtime,'last-project.json'),JSON.stringify(this.project,null,2));
    return result;
  }
  async setHudBindings({bindings,controlBindings={}}) {
    if(this.ai?.busy)throw Error('Codex 작업이 끝난 뒤 HUD 데이터를 바꿔 주세요.');
    if(!this.editor.hud?.some(view=>view.id===this.project?.viewId))throw Error('HUD 화면을 선택하세요.');
    if(!bindings||Array.isArray(bindings)||typeof bindings!=='object'||Object.keys(bindings).length>256||JSON.stringify(bindings).length>65536||Object.entries(bindings).some(([name,value])=>!/^#[\w.-]+$/.test(name)||!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value)))throw Error('HUD 값은 #바인딩 이름과 문자열·숫자·불리언으로 입력하세요.');
    if(!controlBindings||Array.isArray(controlBindings)||typeof controlBindings!=='object'||Object.keys(controlBindings).length>64||JSON.stringify(controlBindings).length>65536||Object.values(controlBindings).some(values=>!values||Array.isArray(values)||typeof values!=='object'||Object.keys(values).length>64||Object.entries(values).some(([key,value])=>!/^#[\w.-]+$/.test(key)||!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value))))throw Error('보존 상태는 컨트롤 이름별 #바인딩 값으로 입력하세요.');
    const fixture={...this.project.fixture,bindings:structuredClone(bindings),controlBindings:structuredClone(controlBindings)};
    const result=await this.render({fixture});
    this.project.viewFixtures[this.project.viewId]=fixture;
    await writeFile(join(this.config.runtime,'last-project.json'),JSON.stringify(this.project,null,2));
    return result;
  }
  async setHudScope({scope}) {
    if(!['pack','all'].includes(scope)||!this.editor.hud?.some(view=>view.id===this.project?.viewId))throw Error('HUD 보기 범위를 선택하세요.');
    if(this.ai?.busy)throw Error('Codex 작업이 끝난 뒤 HUD 보기를 바꿔 주세요.');
    this.project.hudScope=scope;const result=await this.render();
    await writeFile(join(this.config.runtime,'last-project.json'),JSON.stringify(this.project,null,2));return result;
  }
  async compareViewports({presetIds,expectedRevision}) {
    if(this.ai?.busy)throw Error('Codex 작업이 끝난 뒤 기기별로 비교하세요.');
    if(!this.project||this.state.stale||expectedRevision!==this.editorRevision)throw Error('PREVIEW_CONFLICT');
    if(!Array.isArray(presetIds)||presetIds.length<1||presetIds.length>8)throw Error('비교 기기는 1~8개를 선택하세요.');
    const presets=presetIds.map(id=>DEVICE_PRESETS.find(p=>p.id===id));
    if(presets.some(p=>!p)||new Set(presetIds).size!==presetIds.length)throw Error('Unknown or duplicate device preset');
    const revision=this.revision,project=structuredClone(this.project),result=[];
    for(const preset of presets){
      const report=await this.engine('renderScreen',{...project,viewport:preset.viewport,sourceScope:this.editor.hud?.some(view=>view.id===project.viewId)&&project.hudScope!=='all'?'target-hud':undefined,variables:{'$touch':['모바일','태블릿'].includes(preset.family)},outputDir:join(this.config.runtime,'comparisons',randomUUID()),includeEditor:true});
      if(this.revision!==revision||this.state.stale)throw Error('PREVIEW_CONFLICT: 비교 중 원본이나 화면 설정이 바뀌었습니다. 다시 비교하세요.');
      result.push({id:preset.id,viewport:preset.viewport,diagnostics:report.diagnostics??[],layers:report.previewLayers??[],nodes:report.editorLayout?.layout?.nodes.map((n,index)=>({key:n.pointer||'/',id:n.id,qualified:n.qualified,type:n.props.type,props:n.props,rect:n.rect,clip:n.clip,alpha:n.alpha,visible:n.visible!==false,layer:n.layer,index}))??[],runtimeVerified:false});
    }
    return {revision,profiles:result,runtimeVerified:false};
  }
  select({key,keys=key?[key]:[]}) {
    if(!Array.isArray(keys)||keys.length>64||keys.some(k=>!this.editor.nodes.some(n=>n.key===k))||(key!==null&&!keys.includes(key)))throw Error('Element no longer exists');
    this.selection = key;this.selectionKeys=[...new Set(keys)];this.selectionInitialized=true; this.publish({}); return this.context();
  }
  context() {
    const node = this.editor.nodes.find(n => n.key === this.selection);
    const selection = node && {...node,props:Object.fromEntries(Object.entries(node.props).filter(([k])=>editableProps.has(k)||k==='type'))};
    const fixture = this.project?.fixture;
    const group=this.editor.nodes.filter(n=>this.selectionKeys.includes(n.key));
    const captured=this.fixtureRecords?.find(record=>record.id===this.project?.fixtureRecordId);
    const fixtureSource=captured?{kind:'captured-request',name:captured.name,sha256:captured.sourceHash}:{kind:'manual-preview'};
    return {sessionId:this.id,revision:this.revision,renderedRevision:this.state.renderedRevision,stale:this.state.stale,workspace:this.project?.workspaceId ? this.workspace.summary() : null,viewId:this.project?.viewId,rpRoot:this.project?.rpRoot,control:this.project?.control,viewport:this.project?.viewport,previewDevice:this.project?.previewDevice??null,hudScope:this.project?.hudScope,fixtureSource,fixtureSummary:fixture?Object.fromEntries(Object.entries(fixture).map(([k,v])=>[k,Array.isArray(v)?{count:v.length}:typeof v==='string'?v.slice(0,256):typeof v])):null,selection,selectionGroup:group.slice(0,16).map(({key,id,rect,source})=>({key,id,rect,source})),selectionCount:group.length,previewPath:this.browserFrame?.revision===this.state.renderedRevision?this.browserFrame.path:this.state.report?.outputPath,previewFontMode:this.browserFrame?.revision===this.state.renderedRevision?this.browserFrame.fontMode:'renderer',previewCaptureScale:this.browserFrame?.revision===this.state.renderedRevision?this.browserFrame.captureScale:1,diagnostics:(this.state.report?.diagnostics||[]).slice(0,12),unresolved:(this.editor.unresolved||[]).slice(0,12),gameFrame:this.gameFrame ? {path:this.gameFrame.path,capturedAt:this.gameFrame.capturedAt,source:this.gameFrame.source} : null,runtimeVerified:false};
  }
  requireNode(key, expectedRevision) {
    if (this.state.stale || this.editorRevision !== this.state.renderedRevision || expectedRevision !== this.editorRevision) throw Error('PREVIEW_CONFLICT: 미리보기를 갱신한 뒤 다시 수정하세요.');
    const node = this.editor.nodes.find(n => n.key === key);
    if (!node?.source) throw Error('이 요소는 상속/생성된 요소입니다. 원본 선언을 선택하거나 Codex로 인스턴스 override를 추가하세요.');
    return node;
  }
  async commit(source, text, label) {
    parse(text); jsonSpans(text);
    const result = await this.writeSource({path:source.path,text,expectedHash:source.sha256});
    this.undoStack.push({path:source.path,before:source.text,after:text,label});
    if (this.undoStack.length > 60) this.undoStack.shift(); this.redoStack = [];
    await this.render(); return {...result,state:this.status()};
  }
  async writeSource(args) {
    const next = parse(args.text); jsonSpans(args.text);
    const before = parse((await this.readSource(args.path)).text);
    const signature = doc => JSON.stringify([doc.namespace,Object.keys(doc).sort(),doc.ui_defs]);
    if (signature(before) !== signature(next)) this.catalogDirty = true;
    return super.writeSource(args);
  }
  async prepareEdit({key,expectedRevision,expectedHash,patch}) {
    const node = this.requireNode(key,expectedRevision);
    if (!patch || !Object.keys(patch).length || Object.keys(patch).some(k => !editableProps.has(k))) throw Error('Unsupported visual property');
    for (const k of ['offset','size','color']) if (k in patch && (!Array.isArray(patch[k]) || patch[k].length !== (k==='color'?3:2) || patch[k].some(v => !['number','string'].includes(typeof v)))) throw Error(`Invalid ${k}`);
    for (const k of ['font_scale_factor','alpha','layer']) if (k in patch && !Number.isFinite(patch[k])) throw Error(`Invalid ${k}`);
    const source = await this.readSource(node.source.path);
    if (source.sha256 !== expectedHash || node.source.sha256 !== expectedHash) throw Error('SOURCE_CONFLICT: 원본이 바뀌었습니다.');
    const target = spanAt(jsonSpans(source.text),node.source.pointer);
    const dynamic = value => typeof value==='string' ? /^\$|^#/.test(value) : Array.isArray(value) && value.some(dynamic);
    for (const prop of Object.keys(patch)) {
      const existing = target.members.get(prop);
      if (existing && dynamic(parse(source.text.slice(existing.start,existing.end)))) throw Error(`${prop} is driven by a variable/binding; edit its owner using Codex or source view.`);
      if ((node.props.bindings||[]).some(b=>[prop,`#${prop}`].includes(b.target_property_name))) throw Error(`${prop} is bound; edit its data owner using Codex.`);
    }
    if (Object.keys(patch).some(k=>['offset','size','anchor_from','anchor_to'].includes(k))) {
      const owners = [join(this.project.rpRoot,'ir.yaml'),join(dirname(await this.sourcePath(source.path)),'ir.yaml')];
      for(const owner of owners) if(await stat(owner).catch(()=>null))throw Error('IR_OWNER: 인접한 ir.yaml에서 배치를 수정하고 다시 컴파일하세요.');
    }
    return {node,source,patch};
  }
  async edit(args) {
    const {node,source,patch}=await this.prepareEdit(args);
    return this.commit(source,editObject(source.text,node.source.pointer,patch),'속성 수정');
  }
  async batchEdit({edits,expectedRevision,label='일괄 정렬'}) {
    if(!Array.isArray(edits)||!edits.length||edits.length>64)throw Error('한 번에 1~64개 요소를 선택하세요.');
    const planned=[];
    for(const edit of edits)planned.push(await this.prepareEdit({...edit,expectedRevision}));
    if(new Set(planned.map(p=>p.source.path)).size!==1)throw Error('같은 UI 파일의 요소를 선택하세요. 다른 파일의 요소는 따로 정렬합니다.');
    if(new Set(planned.map(p=>p.node.source.pointer)).size!==planned.length)throw Error('공통 원본을 공유하는 인스턴스는 한 번에 하나만 수정하세요.');
    const source=planned[0].source;
    if(planned.some(p=>p.source.sha256!==source.sha256))throw Error('SOURCE_CONFLICT');
    let text=source.text;
    for(const p of planned)text=editObject(text,p.node.source.pointer,p.patch);
    return this.commit(source,text,String(label).slice(0,80));
  }
  async duplicate({key,expectedRevision,expectedHash}) {
    const node=this.requireNode(key,expectedRevision),source=await this.readSource(node.source.path);
    if(source.sha256!==expectedHash||node.source.sha256!==expectedHash)throw Error('SOURCE_CONFLICT');
    const match=node.source.pointer.match(/^(.*\/controls)\/\d+\/([^/]+)$/);
    if(!match)throw Error('루트 대신 하위 요소를 선택하세요.');
    // Duplication changes geometry too: preserve IR ownership and binding guards.
    const off=node.props.offset||[0,0];
    if(off.some(n=>!Number.isFinite(n)))throw Error('동적 위치는 원본이나 Codex에서 복제하세요.');
    await this.prepareEdit({key,expectedRevision,expectedHash,patch:{offset:[off[0]+8,off[1]+8]}});
    const target=spanAt(jsonSpans(source.text),node.source.pointer),declaration=match[2].replaceAll('~1','/').replaceAll('~0','~');
    const [name,...base]=declaration.split('@'),id=name+'_copy_'+randomUUID().slice(0,6),newDeclaration=[id,...base].join('@');
    const body=editObject(source.text.slice(target.start,target.end),'',{offset:[off[0]+8,off[1]+8]});
    let text=source.text,array=spanAt(jsonSpans(text),match[1]),last=[...array.members.values()].at(-1);
    if(last&&!array.trailingComma)text=text.slice(0,last.end)+','+text.slice(last.end);
    array=spanAt(jsonSpans(text),match[1]);
    text=text.slice(0,array.end-1)+'\n{'+JSON.stringify(newDeclaration)+':'+body+'}\n'+text.slice(array.end-1);
    const result=await this.commit(source,text,'요소 복제');return {...result,id};
  }
  async structureOwner(node){
    for(const owner of [join(this.project.rpRoot,'ir.yaml'),join(dirname(await this.sourcePath(node.source.path)),'ir.yaml')])if(await stat(owner).catch(()=>null))throw Error('IR_OWNER: 원본 IR에서 구조를 수정하세요.');
  }
  async clipboardNodes(keys,expectedRevision){
    if(!Array.isArray(keys)||!keys.length||keys.length>64||new Set(keys).size!==keys.length)throw Error('1~64개 요소를 선택하세요.');
    const nodes=keys.map(key=>this.requireNode(key,expectedRevision)),origins=new Set();
    if(nodes.some(n=>nodes.some(other=>n!==other&&n.key.startsWith(other.key+'/controls/'))))throw Error('부모와 자식을 함께 선택할 수 없습니다.');
    const entries=[];
    for(const node of nodes){
      const match=node.source.pointer.match(/^(.*\/controls)\/(\d+)\/([^/]+)$/);if(!match)throw Error('루트나 공통 템플릿 대신 하위 원본 요소를 선택하세요.');
      const origin=node.source.path+'|'+node.source.pointer;if(origins.has(origin))throw Error('공통 원본 인스턴스는 하나만 선택하세요.');origins.add(origin);
      const source=await this.readSource(node.source.path);if(source.sha256!==node.source.sha256)throw Error('SOURCE_CONFLICT');
      const target=spanAt(jsonSpans(source.text),node.source.pointer),wrapper=spanAt(jsonSpans(source.text),match[1]+'/'+match[2]);
      if(target.kind!=='{'||wrapper.members.size!==1)throw Error('독립된 inline 요소만 지원합니다.');
      entries.push({node,source,array:match[1],index:Number(match[2]),declaration:match[3].replaceAll('~1','/').replaceAll('~0','~'),body:source.text.slice(target.start,target.end)});
    }
    if(entries.reduce((sum,e)=>sum+Buffer.byteLength(e.body),0)>2*1024*1024)throw Error('선택 내용은 최대 2 MiB입니다.');
    this.requireNode(keys[0],expectedRevision);
    return entries;
  }
  async copy({keys,expectedRevision,cut=false}){
    if(typeof cut!=='boolean')throw Error('cut must be a boolean');
    if(cut&&this.ai?.busy)throw Error('CODEX_BUSY');
    const entries=await this.clipboardNodes(keys,expectedRevision);
    if(cut){if(new Set(entries.map(e=>e.source.path)).size!==1)throw Error('잘라내기는 같은 파일의 요소만 지원합니다.');for(const e of entries)await this.structureOwner(e.node);}
    const clipId=randomUUID(),clip={rpRoot:this.project.rpRoot,entries:entries.map(({declaration,body,node})=>({declaration,body,offset:node.props.offset??[0,0],offsetBound:Array.isArray(node.props.bindings)&&node.props.bindings.some(b=>['offset','#offset'].includes(b.target_property_name))})),pastes:cut?-1:0};
    if(cut)await this.removeEntries(entries,'요소 잘라내기');
    this.clips.set(clipId,clip);if(this.clips.size>16)this.clips.delete(this.clips.keys().next().value);
    return {format:'json-ui-studio/clipboard@1',sessionId:this.id,clipId,count:entries.length,cut};
  }
  async removeEntries(entries,label){
    const source=entries[0].source;let text=source.text;const groups=new Map();
    for(const e of entries){if(e.source.path!==source.path||e.source.sha256!==source.sha256)throw Error('SOURCE_CONFLICT');const indices=groups.get(e.array)||[];indices.push(e.index);groups.set(e.array,indices);}
    for(const [pointer,indices]of [...groups].sort((a,b)=>b[0].localeCompare(a[0],undefined,{numeric:true})))text=removeArrayItems(text,pointer,indices);
    return this.commit(source,text,label);
  }
  async remove({keys,expectedRevision}){
    if(this.ai?.busy)throw Error('CODEX_BUSY');const entries=await this.clipboardNodes(keys,expectedRevision);
    if(new Set(entries.map(e=>e.source.path)).size!==1)throw Error('같은 파일의 요소만 삭제하세요.');
    for(const e of entries)await this.structureOwner(e.node);
    return this.removeEntries(entries,'요소 삭제');
  }
  async paste({clipId,sessionId,key,expectedRevision,expectedHash}){
    if(this.ai?.busy)throw Error('CODEX_BUSY');const clip=this.clips.get(clipId);if(sessionId!==this.id||!clip)throw Error('복사 내용이 만료되었습니다. 요소를 다시 복사하세요.');
    if(clip.rpRoot!==this.project?.rpRoot)throw Error('같은 리소스팩 안에서 붙여넣으세요. 다른 팩의 에셋은 자동 복사하지 않습니다.');
    const parent=this.requireNode(key,expectedRevision);if(!['panel','screen','stack_panel','grid'].includes(parent.type))throw Error('부모 패널을 선택하세요.');
    const source=await this.readSource(parent.source.path);if(source.sha256!==expectedHash||parent.source.sha256!==expectedHash)throw Error('SOURCE_CONFLICT');await this.structureOwner(parent);
    const ids=[],entries=clip.entries.map(e=>{
      const [name,...base]=e.declaration.split('@'),id=name+'_copy_'+randomUUID().slice(0,8),props=parse(e.body),offset=props.offset??e.offset;
      if(!Array.isArray(offset)||offset.length!==2||offset.some(v=>!Number.isFinite(v))||e.offsetBound)throw Error('동적 위치는 원본이나 Codex에서 복사하세요.');
      ids.push(id);return {declaration:[id,...base].join('@'),body:editObject(e.body,'',{offset:offset.map(v=>v+8*(clip.pastes+1))})};
    });
    const result=await this.commit(source,appendControlBodies(source.text,parent.source.pointer,entries),'요소 붙여넣기');clip.pastes++;
    return {...result,ids};
  }
  async add({key,expectedRevision,expectedHash,type='label',texture}) {
    if (!['label','image','panel'].includes(type)) throw Error('Unsupported element type');
    const node = this.requireNode(key,expectedRevision), source = await this.readSource(node.source.path);
    if (source.sha256 !== expectedHash) throw Error('SOURCE_CONFLICT');
    const target = spanAt(jsonSpans(source.text),node.source.pointer);
    const controls = target.members.get('controls');
    if (controls && controls.kind !== '[') throw Error('controls must be an array');
    const id = `${type}_${randomUUID().slice(0,8)}`;
    const props = {type,size:type==='label'?[120,24]:[64,64],offset:[0,0],layer:10,
      ...(type==='label'?{text:'새 텍스트',font_scale_factor:1}:{}),
      ...(type==='image'?{texture:texture || 'textures/ui/live_pixel',keep_ratio:false}:{})};
    if (type==='image') {
      if (!texture || !/^textures\/[\w/.-]+$/.test(texture) || texture.includes('..')) throw Error('이미지를 먼저 가져오거나 RP에 있는 텍스처를 지정하세요.');
      const p = await realpath(join(this.project.rpRoot,`${texture}.png`));
      if (relative(this.project.rpRoot,p).startsWith('..')) throw Error('Texture escapes RP');
    }
    let text;
    if (!controls) text = editObject(source.text,node.source.pointer,{controls:[{[id]:props}]});
    else {
      text = source.text; const last = [...controls.members.values()].at(-1);
      if (last && !controls.trailingComma) text = text.slice(0,last.end)+','+text.slice(last.end);
      const current = spanAt(jsonSpans(text),node.source.pointer+'/controls');
      text = text.slice(0,current.end-1)+'\n'+JSON.stringify({[id]:props},null,2)+'\n'+text.slice(current.end-1);
    }
    return this.commit(source,text,'요소 추가');
  }
  async history({direction}) {
    if (!['undo','redo'].includes(direction)) throw Error('Invalid history direction');
    const from = direction==='undo'?this.undoStack:this.redoStack, to = direction==='undo'?this.redoStack:this.undoStack;
    const change = from.at(-1); if (!change) return this.status();
    const source = await this.readSource(change.path), expected = direction==='undo'?change.after:change.before;
    if (source.text !== expected) throw Error('SOURCE_CONFLICT: 외부 수정이 있어 되돌리기를 중단했습니다.');
    await this.writeSource({path:change.path,text:direction==='undo'?change.before:change.after,expectedHash:source.sha256});
    from.pop(); to.push(change); return this.render();
  }
  async importImage({name,data}) {
    if (!this.project) throw Error('팩을 먼저 여세요.');
    if (typeof data!=='string' || data.length>6*1024*1024) throw Error('PNG exceeds 4 MiB');
    const bytes = Buffer.from(data.replace(/^data:image\/png;base64,/,''),'base64');
    await this.validatePng(bytes);
    const safe = String(name||'image').replace(/\.png$/i,'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,50) || 'image';
    const dir = join(this.project.rpRoot,'textures','studio'); await mkdir(dir,{recursive:true});
    const actual = await realpath(dir); if (relative(this.project.rpRoot,actual).startsWith('..')) throw Error('Texture path escapes RP');
    const stem = `${safe}_${hash(bytes).slice(0,12)}`;
    const file = join(actual,stem+'.png'); this.ownWrites.set(file,hash(bytes));
    try { await writeFile(file,bytes,{flag:'wx'}); } catch(error) { if(error.code!=='EEXIST') throw error; }
    return {texture:`textures/studio/${stem}`,path:`textures/studio/${stem}.png`};
  }
  async validatePng(bytes) {
    if(bytes.length>4*1024*1024 || bytes.length<24 || bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw Error('PNG required, max 4 MiB');
    if(bytes.readUInt32BE(16)>4096 || bytes.readUInt32BE(20)>4096) throw Error('Image exceeds 4096 pixels');
    const {loadImage} = await import('@napi-rs/canvas'); await loadImage(bytes);
  }
  async acceptFrame({data,source}) {
    if(typeof data!=='string' || data.length>6*1024*1024) throw Error('Invalid frame');
    const bytes = Buffer.from(data.replace(/^data:image\/png;base64,/,''),'base64'); await this.validatePng(bytes);
    const dir = join(this.config.runtime,'game'); await mkdir(dir,{recursive:true});
    const capturedAt = Date.now(), path = join(dir,`${this.id}.png`); await writeFile(path,bytes);
    this.gameFrame = {capturedAt,path,source:String(source||'사용자가 공유한 창').slice(0,160)};
    this.emit('game-frame',{capturedAt,source:this.gameFrame.source}); return {capturedAt};
  }
  clearFrame() { this.gameFrame=null;this.emit('game-frame',null);return {shared:false}; }
  async acceptBrowserFrame({data,revision,fontMode,captureScale=1}) {
    if(revision!==this.state.renderedRevision || this.state.stale)throw Error('PREVIEW_CONFLICT');
    if(typeof data!=='string'||data.length>6*1024*1024)throw Error('Invalid preview frame');
    const bytes=Buffer.from(data.replace(/^data:image\/png;base64,/,''),'base64');await this.validatePng(bytes);
    if(!Number.isInteger(captureScale)||captureScale<1||captureScale>4||bytes.readUInt32BE(16)!==this.project.viewport[0]*captureScale||bytes.readUInt32BE(20)!==this.project.viewport[1]*captureScale)throw Error('Preview frame dimensions must match the viewport and capture scale');
    const dir=join(this.config.runtime,'browser-preview');await mkdir(dir,{recursive:true});
    const path=join(dir,`${this.id}-${revision}.png`);await writeFile(path,bytes);
    if(revision===this.state.renderedRevision)this.browserFrame={path,revision,captureScale,fontMode:fontMode==='approximate'?'approximate-system-font':'minecraft-renderer'};
    return {saved:true,revision};
  }
  async syncWorkspace(id) {
    if (this.ai?.busy) throw Error('Codex 작업이 끝난 뒤 팩 변경을 적용하세요.');
    if (this.writeQueue) await this.writeQueue;
    const result = await this.workspace.apply(id);
    this.undoStack=[]; this.redoStack=[]; this.catalogDirty=true;
    await this.render();
    return result;
  }
  async importFixtures({directory}) {
    if(!this.project)throw Error('먼저 팩을 여세요.');
    if(this.ai?.busy)throw Error('Codex 작업이 끝난 뒤 폼 데이터를 바꾸세요.');
    const library=await importFormFixtures(directory,this.config.runtime,this.editor.views??[]);
    this.fixtureRecords=library.records;this.project.fixtureLibraryId=library.id;this.editor.fixtureRecords=fixtureSummaries(library.records);
    const view=this.editor.forms.find(view=>view.id===this.project.viewId),record=library.records.find(record=>view&&matchesView(view,record.fixture));
    if(record)await this.useFixture({id:record.id});else await writeFile(join(this.config.runtime,'last-project.json'),JSON.stringify(this.project,null,2));
    this.publish({});return {imported:library.records.length,issues:library.issues,records:this.editor.fixtureRecords};
  }
  async useFixture({id}) {
    if(this.ai?.busy)throw Error('Codex 작업이 끝난 뒤 폼 데이터를 바꾸세요.');
    const record=this.fixtureRecords?.find(record=>record.id===id),view=this.editor.forms.find(view=>view.id===this.project?.viewId);
    if(!record||!view||!matchesView(view,record.fixture))throw Error('현재 폼에 맞는 데이터가 아닙니다.');
    await this.render({fixture:structuredClone(record.fixture)});this.project.fixtureRecordId=id;
    this.project.viewFixtures[view.id]=structuredClone(record.fixture);
    await writeFile(join(this.config.runtime,'last-project.json'),JSON.stringify(this.project,null,2));this.publish({});return this.status();
  }
  close() { this.workspace.close(); super.close(); }
  async newProject(useWorkspace = false) {
    const dir = join(this.config.engineRoot,'workspace/studio-projects',randomUUID());
    await cp(join(this.config.engineRoot,'examples/studio-rp'),dir,{recursive:true,errorOnExist:true,force:false});
    const manifest = JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
    manifest.header.uuid = randomUUID(); for(const m of manifest.modules) m.uuid=randomUUID();
    await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
    return this.open({rpRoot:dir,control:'live_demo.screen',previewDevice:{presetId:'pc-fhd'},useWorkspace});
  }
}
