import { readFile, writeFile, readdir, realpath, mkdir, cp, stat } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseUiSource, DEFAULT_RUNTIME_DIALECT } from '../_lib/json-dialect.mjs';
import { LiveSession, hash } from './session.mjs';
import { editObject, jsonSpans, spanAt } from './json-edit.mjs';

const parse = text => parseUiSource(text, { kind: 'runtime', dialect:DEFAULT_RUNTIME_DIALECT }).document;
const esc = key => key.replaceAll('~', '~0').replaceAll('/', '~1');
const editableProps = new Set(['offset','size','text','font_scale_factor','color','alpha','layer','anchor_from','anchor_to','visible','texture','keep_ratio']);
export class StudioSession extends LiveSession {
  constructor(config) { super(config); this.undoStack = []; this.redoStack = []; this.selection = null; this.editor = { nodes: [], screens: [] }; }
  status() { return { ...super.status(), studio: true, selection: this.selection, history: {undo:this.undoStack.length,redo:this.redoStack.length}, studioRevision:this.editorRevision, gameFrame:this.gameFrame && {capturedAt:this.gameFrame.capturedAt,source:this.gameFrame.source} }; }
  async catalog(rpRoot) {
    const root = await realpath(rpRoot), screens = [], issues = [];
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
        for (const [declaration, value] of Object.entries(doc)) {
          if (declaration === 'namespace' || !value || typeof value !== 'object' || Array.isArray(value)) continue;
          screens.push({control:`${doc.namespace}.${declaration.split('@')[0]}`, declaration, path, type:value.type || 'inherited', base:declaration.split('@')[1], registered:defs.includes(path), pointer:`/${esc(declaration)}`});
        }
      } catch(error) { issues.push(`${path}: ${error.message}`); }
    }
    return {rpRoot:root,screens,issues};
  }
  async open(input) {
    if (this.ai?.busy) throw Error('Codex 작업이 끝난 뒤 팩이나 화면을 바꿔 주세요.');
    const catalog = await this.catalog(input.rpRoot);
    const control = input.control || catalog.screens.find(s => /screen|main|root|form|hud/i.test(s.control))?.control || catalog.screens[0]?.control;
    if (!control) throw Error('이 폴더에서 namespace가 있는 JSON UI를 찾지 못했습니다.');
    const changed = this.project?.rpRoot !== catalog.rpRoot;
    if (changed) { this.undoStack = []; this.redoStack = []; await this.ai?.reset(); }
    this.selection = null; this.catalogDirty = false; this.editor = {screens:catalog.screens,issues:catalog.issues,nodes:[]};
    const state = await super.open({...input,control});
    await mkdir(this.config.runtime,{recursive:true});
    await writeFile(join(this.config.runtime,'last-project.json'),JSON.stringify(this.project,null,2));
    this.publish({restoreError:null});
    return this.status();
  }
  async render(changes = {}) {
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
        this.editor = {...this.editor,screens:catalog.screens,issues:catalog.issues,nodes,layers:this.previewLayers,unresolved:resolved.unresolved,viewport:resolved.layout.viewport,control:resolved.control};
        this.editorRevision = revision;
        if (!nodes.some(n => n.key === this.selection)) this.selection = nodes[0]?.key || null;
        this.publish({editorError:null});
      } catch(error) { this.publish({editorError:error.message}); }
    }
    return this.status();
  }
  select({key}) {
    if (!this.editor.nodes.some(n => n.key === key)) throw Error('Element no longer exists');
    this.selection = key; this.publish({}); return this.context();
  }
  context() {
    const node = this.editor.nodes.find(n => n.key === this.selection);
    const selection = node && {...node,props:Object.fromEntries(Object.entries(node.props).filter(([k])=>editableProps.has(k)||k==='type'))};
    const fixture = this.project?.fixture;
    return {sessionId:this.id,revision:this.revision,renderedRevision:this.state.renderedRevision,stale:this.state.stale,rpRoot:this.project?.rpRoot,control:this.project?.control,viewport:this.project?.viewport,fixtureSummary:fixture?Object.fromEntries(Object.entries(fixture).map(([k,v])=>[k,Array.isArray(v)?{count:v.length}:typeof v==='string'?v.slice(0,256):typeof v])):null,selection,previewPath:this.browserFrame?.revision===this.state.renderedRevision?this.browserFrame.path:this.state.report?.outputPath,previewFontMode:this.browserFrame?.revision===this.state.renderedRevision?this.browserFrame.fontMode:'renderer',previewCaptureScale:this.browserFrame?.revision===this.state.renderedRevision?this.browserFrame.captureScale:1,diagnostics:(this.state.report?.diagnostics||[]).slice(0,12),unresolved:(this.editor.unresolved||[]).slice(0,12),gameFrame:this.gameFrame ? {path:this.gameFrame.path,capturedAt:this.gameFrame.capturedAt,source:this.gameFrame.source} : null,runtimeVerified:false};
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
  async edit({key,expectedRevision,expectedHash,patch}) {
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
    return this.commit(source,editObject(source.text,node.source.pointer,patch),'속성 수정');
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
  async newProject() {
    const dir = join(this.config.engineRoot,'workspace/studio-projects',randomUUID());
    await cp(join(this.config.engineRoot,'examples/studio-rp'),dir,{recursive:true,errorOnExist:true,force:false});
    const manifest = JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
    manifest.header.uuid = randomUUID(); for(const m of manifest.modules) m.uuid=randomUUID();
    await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
    return this.open({rpRoot:dir,control:'live_demo.screen'});
  }
}
