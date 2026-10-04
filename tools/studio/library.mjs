import { readFile, readdir, realpath, stat, mkdir, writeFile, rename } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { snapshot } from './workspace.mjs';
import { parseUiSource, DEFAULT_RUNTIME_DIALECT } from '../_lib/json-dialect.mjs';

const inside=(root,file)=>{const rel=relative(root,file);return rel!== '..'&&!rel.startsWith('..'+(process.platform==='win32'?'\\':'/'))&&!isAbsolute(rel);};
const idFor=path=>createHash('sha256').update(path).digest('hex');
const skip=new Set(['.git','node_modules','textures','font','models','sounds','animations','render_controllers','entities','blocks']);
export class ReferenceLibrary {
  constructor(root){this.root=resolve(root);this.entries=new Map();}
  async scan(){
    const entries=new Map(),issues=[],packs=new Map();let visited=0;
    const add=(file,kind,meta={})=>{const id=idFor(file);entries.set(id,{id,kind,path:file,label:relative(this.root,file).replaceAll('\\','/'),...meta});};
    const pack=async(folder,meta={})=>{
      let root;try{root=await realpath(folder);if(inside(join(this.root,'references','schemas'),root)||!(await stat(join(root,'ui'))).isDirectory())return;
        const manifest=await readFile(join(root,'manifest.json'),'utf8').then(JSON.parse).catch(()=>null);
        packs.set(root,{...packs.get(root),name:String(manifest?.header?.name||meta.name||relative(this.root,root)),...meta});}catch{return;}
    };
    for(const config of ['sources.public.json','sources.local.json']){
      try{const data=JSON.parse(await readFile(join(this.root,'config',config),'utf8'));for(const source of data.sources||[])if(source.rpRoot)await pack(resolve(this.root,'config',source.rpRoot),{sourceId:source.id,license:source.license,revision:source.revision,redistribution:source.redistribution});}catch(error){if(error.code!=='ENOENT')issues.push(`${config}: ${error.message}`);}
    }
    const walk=async(folder,depth=0)=>{
      if(depth>12||visited>=20000){if(!issues.includes('목록 한도에 도달했습니다. 검색할 자료는 sources.local.json에 등록하세요.'))issues.push('목록 한도에 도달했습니다. 검색할 자료는 sources.local.json에 등록하세요.');return;}
      for(const entry of await readdir(folder,{withFileTypes:true}).catch(()=>[])){
        if(entry.isSymbolicLink()||skip.has(entry.name))continue;
        visited++;if(visited>20000)break;
        const file=join(folder,entry.name);
        if(entry.isDirectory()){if(entry.name==='ui')await pack(folder);await walk(file,depth+1);}
        else if(entry.isFile()){
          if(entry.name==='manifest.json')await pack(dirname(file));
          if(/\.(md|jsonc?|ya?ml)$/i.test(entry.name))add(file,entry.name==='SKILL.md'?'skill':/\.md$/i.test(entry.name)?'document':'source');
        }
      }
    };
    for(const dir of ['examples','references','skills','docs'])await walk(join(this.root,dir));
    for(const [path,meta]of packs)add(path,'pack',{name:meta.name,...meta});
    this.entries=entries;this.issues=issues;this.scannedAt=Date.now();
  }
  async list({query='',kind='pack',offset=0,refresh=false}={}){
    if(typeof query!=='string'||query.length>200||!['all','pack','skill','document','source'].includes(kind)||!Number.isInteger(offset)||offset<0)throw Error('잘못된 자료 검색 조건입니다.');
    if(!this.scannedAt||refresh)await this.scan();
    const search=query.toLowerCase(),all=[...this.entries.values()].filter(e=>(kind==='all'||e.kind===kind)&&`${e.label} ${e.name??''} ${e.sourceId??''}`.toLowerCase().includes(search)).sort((a,b)=>a.label.localeCompare(b.label));
    return {total:all.length,entries:all.slice(offset,offset+60),nextOffset:offset+60<all.length?offset+60:null,issues:this.issues,counts:Object.fromEntries(['pack','skill','document','source'].map(k=>[k,[...this.entries.values()].filter(e=>e.kind===k).length]))};
  }
  async entry(id){
    if(!this.scannedAt)await this.scan();const entry=this.entries.get(id);if(!entry)throw Error('자료를 다시 검색하세요.');
    const file=await realpath(entry.path);if(file!==entry.path)throw Error('자료 경로가 바뀌었습니다. 다시 검색하세요.');
    if(entry.kind!=='pack'&&!inside(this.root,file))throw Error('Reference escapes repository');
    return entry;
  }
  async read(id){
    const entry=await this.entry(id);if(entry.kind==='pack')return entry;
    if((await stat(entry.path)).size>256*1024)throw Error('이 자료는 256 KiB를 넘습니다. 로컬 파일에서 확인하세요.');
    const text=await readFile(entry.path,'utf8');let previewControl=null,packId=null;
    if(entry.kind==='source'&&/\.jsonc?$/i.test(entry.path)){
      try{const doc=parseUiSource(text,{kind:'runtime',dialect:DEFAULT_RUNTIME_DIALECT}).document;
        if(doc.namespace){const declaration=Object.keys(doc).find(k=>k!=='namespace'&&doc[k]&&typeof doc[k]==='object'&&!doc[k].anim_type);if(declaration)previewControl=doc.namespace+'.'+declaration.split('@')[0];}
      }catch{}
      packId=[...this.entries.values()].filter(e=>e.kind==='pack'&&inside(e.path,entry.path)).sort((a,b)=>b.path.length-a.path.length)[0]?.id??null;
    }
    return {...entry,text,previewControl,packId,sha256:createHash('sha256').update(text).digest('hex')};
  }
  async prepareFragment(id,runtime){
    const entry=await this.read(id);if(entry.packId)return {rpRoot:await this.preparePack(entry.packId,runtime),control:entry.previewControl};
    if(!entry.previewControl)throw Error('이 자료는 namespace와 컨트롤이 있는 JSON UI가 아닙니다. 원문 보기로 확인하세요.');
    const base=join(runtime,'reference-sources',entry.id),rpRoot=join(base,'pack');
    if(!(await stat(join(rpRoot,'manifest.json')).catch(()=>null))){
      const staging=join(base,randomUUID()),ui=join(staging,'ui'),defs=[];await mkdir(ui,{recursive:true});
      for(const sibling of await readdir(dirname(entry.path),{withFileTypes:true})){
        if(!sibling.isFile()||! /\.jsonc?$/i.test(sibling.name))continue;
        const file=await realpath(join(dirname(entry.path),sibling.name));if(!inside(this.root,file)||(await stat(file)).size>2*1024*1024)continue;
        const text=await readFile(file,'utf8');try{if(!parseUiSource(text,{kind:'runtime',dialect:DEFAULT_RUNTIME_DIALECT}).document.namespace)continue;}catch{continue;}
        await writeFile(join(ui,sibling.name),text);defs.push('ui/'+sibling.name);
      }
      await writeFile(join(ui,'_ui_defs.json'),JSON.stringify({ui_defs:defs}));
      await writeFile(join(staging,'manifest.json'),JSON.stringify({format_version:2,header:{name:entry.label,description:'Local JSON UI fragment preview',uuid:randomUUID(),version:[1,0,0],min_engine_version:[1,21,0]},modules:[{type:'resources',uuid:randomUUID(),version:[1,0,0]}]}));
      await rename(staging,rpRoot);
    }
    return {rpRoot,control:entry.previewControl};
  }
  async preparePack(id,runtime){
    const entry=await this.entry(id);if(entry.kind!=='pack')throw Error('UI 팩을 선택하세요.');
    const base=join(runtime,'reference-sources',entry.id),target=join(base,'pack');
    try{await stat(join(target,'manifest.json'));return target;}catch{}
    const files=await snapshot(entry.path),staging=join(base,randomUUID());await mkdir(staging,{recursive:true});
    for(const [path,expected]of Object.entries(files)){
      const bytes=await readFile(join(entry.path,path));if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('참조 팩이 복사 중 변경되었습니다. 다시 여세요.');
      await mkdir(dirname(join(staging,path)),{recursive:true});await writeFile(join(staging,path),bytes);
    }
    if(!files['manifest.json'])await writeFile(join(staging,'manifest.json'),JSON.stringify({format_version:2,header:{name:entry.name,description:'Local Studio reference preview',uuid:randomUUID(),version:[1,0,0],min_engine_version:[1,21,0]},modules:[{type:'resources',uuid:randomUUID(),version:[1,0,0]}]},null,2));
    await rename(staging,target);return target;
  }
}
