import { readdir, lstat, realpath, unlink, rmdir } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute } from 'node:path';

const families = ['renders','comparisons','browser-preview','game'];
const inside = (root,path) => { const rel=relative(root,path);return rel!== '..'&&!rel.startsWith('..'+(process.platform==='win32'?'\\':'/'))&&!isAbsolute(rel); };
export class StudioStorage {
  constructor(runtime,{cacheBytes=64*1024*1024,cacheRoot=runtime}={}) {
    this.root=resolve(runtime);this.cacheRoot=resolve(cacheRoot);this.pins=new Set();this.queue=Promise.resolve();
    if(this.cacheRoot!==this.root&&(inside(this.root,this.cacheRoot)||inside(this.cacheRoot,this.root)))throw Error('Studio cache must be separate from project storage');
    if(!Number.isSafeInteger(cacheBytes)||cacheBytes<1024*1024||cacheBytes>1024*1024*1024)throw Error('Studio cache budget: 1..1024 MiB');
    this.cacheBytes=cacheBytes;
  }
  async inventory(folder=this.root) {
    const files=[],dirs=[];
    const walk=async path=>{
      for(const entry of await readdir(path,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;})){
        const file=join(path,entry.name),info=await lstat(file).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
        if(!info||info.isSymbolicLink())continue;
        if(info.isDirectory()){dirs.push(file);await walk(file);}
        else if(info.isFile())files.push({path:file,bytes:info.size,modified:info.mtimeMs});
      }
    };
    await walk(folder);return {files,dirs};
  }
  async usage() {
    const {files}=await this.inventory(),groups={cache:0,workspaces:0,syncBackups:0,sourceBackups:0,references:0,other:0};
    for(const file of files){const rel=relative(this.root,file.path).replaceAll('\\','/'),family=rel.split('/')[0];
      const group=families.includes(family)?'cache':family==='workspaces'?(rel.includes('/sync-backups/')?'syncBackups':'workspaces'):family==='backups'?'sourceBackups':family==='reference-sources'?'references':'other';groups[group]+=file.bytes;
    }
    if(this.cacheRoot!==this.root){const cached=await this.inventory(this.cacheRoot);files.push(...cached.files);groups.cache+=cached.files.reduce((n,f)=>n+f.bytes,0);}
    return {bytes:files.reduce((n,f)=>n+f.bytes,0),fileCount:files.length,groups,cacheLimitBytes:this.cacheBytes,cacheLocation:this.cacheRoot};
  }
  prune(keep=()=>[]) {
    const task=this.queue.catch(()=>{}).then(()=>this.pruneNow(keep));this.queue=task;return task;
  }
  async pruneNow(keep) {
    const files=[],dirs=[];
    for(const candidate of new Set([this.root,this.cacheRoot])){const root=await realpath(candidate).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(!root)continue;
      for(const family of families){const folder=join(root,family);const info=await lstat(folder).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(!info||info.isSymbolicLink()||!info.isDirectory())continue;
        const inventory=await this.inventory(folder);files.push(...inventory.files.map(file=>({...file,family,cacheFamilyRoot:folder})));dirs.push(...inventory.dirs.map(path=>({path,root:folder})));
      }
    }
    const protectedFile=path=>[...this.pins,...keep()].filter(Boolean).some(pin=>inside(resolve(pin),path));
    const recent=new Set();
    for(const family of families){const count=family==='comparisons'?0:family==='game'?1:2;
      files.filter(f=>f.family===family&&f.path.endsWith('.png')).sort((a,b)=>b.modified-a.modified).slice(0,count).forEach(f=>recent.add(f.path));
    }
    const candidates=files.filter(f=>/\.png$|\.report\.json$/i.test(f.path)).sort((a,b)=>a.modified-b.modified);
    let remaining=files.reduce((n,f)=>n+f.bytes,0),freedBytes=0,removedFiles=0;
    for(const file of candidates){
      if(protectedFile(file.path))continue;
      if(file.path.endsWith('.png')&&recent.has(file.path)&&remaining<=this.cacheBytes)continue;
      // Only generated previews/reports in the four cache directories are disposable.
      const actual=await realpath(file.path).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
      if(!actual||!inside(file.cacheFamilyRoot,actual)||!(await lstat(file.path)).isFile())continue;
      await unlink(file.path).catch(e=>{if(e.code!=='ENOENT')throw e;});freedBytes+=file.bytes;remaining-=file.bytes;removedFiles++;
    }
    for(const dir of dirs.sort((a,b)=>b.path.length-a.path.length)){
      const actual=await realpath(dir.path).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
      if(!actual||!inside(dir.root,actual)||protectedFile(dir.path))continue;
      await rmdir(dir.path).catch(e=>{if(!['ENOENT','ENOTEMPTY','EEXIST'].includes(e.code))throw e;});
    }
    return {freedBytes,removedFiles,remainingCacheBytes:remaining,cacheLimitBytes:this.cacheBytes};
  }
}
