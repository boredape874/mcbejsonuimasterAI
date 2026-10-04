import { readFile, writeFile, mkdir, readdir, lstat, realpath, rename, unlink } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, resolve, relative, isAbsolute, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sameHashes = (a,b) => digest(JSON.stringify(Object.entries(a).sort())) === digest(JSON.stringify(Object.entries(b).sort()));
const key = path => process.platform === 'win32' ? path.toLowerCase() : path;
const inside = (root, file) => { const rel = relative(root, file); return rel !== '..' && !rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) && !isAbsolute(rel); };
async function atomicJSON(path, value) {
  await mkdir(dirname(path), {recursive:true});
  const temp = path + '.' + randomUUID() + '.tmp';
  await writeFile(temp, JSON.stringify(value, null, 2));
  await rename(temp, path);
}

// Never follow a pack symlink/junction into a different project or game directory.
export async function snapshot(root) {
  const files = {};
  async function walk(dir) {
    for (const entry of (await readdir(join(root, dir), {withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
      if (entry.name === '.git') continue;
      const rel = dir ? dir + '/' + entry.name : entry.name;
      const info = await lstat(join(root, rel));
      if (info.isSymbolicLink()) throw Error(`WORKSPACE_LINK: ${rel} 링크를 제거한 팩 사본을 사용하세요.`);
      if (info.isDirectory()) await walk(rel);
      else if (info.isFile()) files[rel] = digest(await readFile(join(root, rel)));
      else throw Error(`WORKSPACE_FILE: ${rel}`);
    }
  }
  await walk('');
  return files;
}

export function planChanges(base, source, destination) {
  const changes = [], conflicts = [], retained = [], converged = [];
  for (const path of [...new Set([...Object.keys(base), ...Object.keys(source), ...Object.keys(destination)])].sort()) {
    const before = base[path] ?? null, from = source[path] ?? null, to = destination[path] ?? null;
    if (from === to) { converged.push({path, hash:from}); continue; }
    if (from === before) { retained.push(path); continue; }
    if (to !== before) { conflicts.push({path, base:before, source:from, destination:to}); continue; }
    changes.push({path, kind:from === null ? 'delete' : to === null ? 'add' : 'update', source:from, destination:to});
  }
  return {changes, conflicts, retained, converged};
}

export class PackWorkspace {
  constructor(runtime, onChange = () => {}) { this.root = join(runtime,'workspaces'); this.onChange = onChange; this.plans = new Map(); }
  summary() {
    if (!this.meta) return null;
    return {id:this.meta.id, originRpRoot:this.meta.originRpRoot, workingRpRoot:this.meta.workingRpRoot,
      originChanged:!!this.originChanged, busy:!!this.busy, lastSync:this.meta.lastSync ?? null};
  }
  async save() { await atomicJSON(join(this.root,this.meta.id,'workspace.json'),this.meta); }
  async open(rpRoot, id) {
    if (this.busy) throw Error('WORKSPACE_BUSY');
    this.busy=true;
    try { const result=await this.openPack(rpRoot,id); return {...result,busy:false}; }
    finally { this.busy=false; this.onChange(this.summary()); }
  }
  async openPack(rpRoot, id) {
    const requested = await realpath(rpRoot);
    if (this.meta && [this.meta.originRpRoot,this.meta.workingRpRoot].some(path=>key(path) === key(requested))) return this.summary();
    await mkdir(this.root,{recursive:true});
    let registry;
    try { registry = JSON.parse(await readFile(join(this.root,'registry.json'),'utf8')); }
    catch(error) { if (error.code !== 'ENOENT') throw error; registry = {}; }
    id ??= registry[key(requested)];
    let meta;
    if (id) {
      if (!/^[0-9a-f-]{36}$/.test(id)) throw Error('Invalid workspace id');
      meta = JSON.parse(await readFile(join(this.root,id,'workspace.json'),'utf8'));
      if (![meta.originRpRoot,meta.workingRpRoot].some(path=>key(path) === key(requested))) throw Error('WORKSPACE_MISMATCH');
      const expectedWorking = await realpath(join(this.root,id,'pack'));
      if (key(expectedWorking) !== key(meta.workingRpRoot)) throw Error('WORKSPACE_PATH');
      await realpath(meta.originRpRoot);
    } else {
      // Hash first, copy from checked regular files, then verify the origin did not change mid-copy.
      const baseline = await snapshot(requested);
      if (!baseline['manifest.json']) throw Error('manifest.json이 있는 리소스팩을 선택하세요.');
      id = randomUUID();
      const workingRpRoot = join(this.root,id,'pack');
      if (inside(requested,workingRpRoot) || inside(workingRpRoot,requested)) throw Error('WORKSPACE_NESTED');
      await mkdir(workingRpRoot,{recursive:true});
      let copied=0;const total=Object.keys(baseline).length;
      for (const [path, expected] of Object.entries(baseline)) {
        const bytes = await readFile(join(requested,path));
        if (digest(bytes) !== expected) throw Error('WORKSPACE_SOURCE_CHANGED: 원본이 복사 중 변경되었습니다. 다시 여세요.');
        await mkdir(dirname(join(workingRpRoot,path)),{recursive:true});
        await writeFile(join(workingRpRoot,path),bytes);
        if(++copied%250===0 || copied===total)this.onChange({progress:{copied,total}});
      }
      if (digest(JSON.stringify(await snapshot(requested))) !== digest(JSON.stringify(baseline))) throw Error('WORKSPACE_SOURCE_CHANGED: 원본이 복사 중 변경되었습니다. 다시 여세요.');
      meta = {schema:'studio.workspace.v1',id,originRpRoot:requested,workingRpRoot:await realpath(workingRpRoot),baseline,createdAt:new Date().toISOString()};
      await atomicJSON(join(this.root,id,'workspace.json'),meta);
      registry[key(requested)] = id;
      await atomicJSON(join(this.root,'registry.json'),registry);
    }
    this.watcher?.close(); clearTimeout(this.timer); this.plans.clear();
    this.meta = meta; this.originChanged = !sameHashes(await snapshot(meta.originRpRoot),meta.baseline);
    this.watcher = watch(meta.originRpRoot,{recursive:true},()=>{
      if(this.busy)return;
      clearTimeout(this.timer);
      this.originChanged=true;this.onChange(this.summary());
      this.timer = setTimeout(async()=>{
        if(this.checkingOrigin)return;
        this.checkingOrigin=true;
        try { this.originChanged = !sameHashes(await snapshot(meta.originRpRoot),meta.baseline); } catch { this.originChanged=true; }
        finally { this.checkingOrigin=false; }
        if (this.meta === meta) this.onChange(this.summary());
      },250);
    });
    this.watcher.on('error',()=>{this.originChanged = true; this.onChange(this.summary());});
    return this.summary();
  }
  async preview(direction) {
    if (!this.meta) throw Error('작업용 팩 B를 먼저 여세요.');
    if (this.busy) throw Error('WORKSPACE_BUSY');
    if (!['pull','push'].includes(direction)) throw Error('direction: pull or push');
    const [a,b] = await Promise.all([snapshot(this.meta.originRpRoot),snapshot(this.meta.workingRpRoot)]);
    const source = direction === 'pull' ? a : b, destination = direction === 'pull' ? b : a;
    const result = planChanges(this.meta.baseline,source,destination);
    const id = randomUUID();
    this.plans.clear();
    this.plans.set(id,{id,workspaceId:this.meta.id,direction,a,b,...result});
    return {id,direction,workspace:this.summary(),changes:result.changes,conflicts:result.conflicts,retainedCount:result.retained.length,
      message:direction === 'pull' ? '원본 A의 변경을 작업 B로 가져옵니다.' : '작업 B의 변경을 원본 A에 적용합니다.'};
  }
  async checkedPath(root, path) {
    const target = resolve(root,path);
    if (!inside(root,target) || target === root || path.split('/').some(p=>p === '..' || p === '.git')) throw Error('WORKSPACE_PATH');
    let parent = dirname(target);
    while (parent !== root) {
      try { if ((await lstat(parent)).isSymbolicLink() || !inside(root,await realpath(parent))) throw Error('WORKSPACE_LINK'); }
      catch(error) { if (error.code !== 'ENOENT') throw error; }
      parent = dirname(parent);
    }
    try { if ((await lstat(target)).isSymbolicLink()) throw Error('WORKSPACE_LINK'); }
    catch(error) { if (error.code !== 'ENOENT') throw error; }
    return target;
  }
  async replace(root,path,bytes,expected) {
    const target = await this.checkedPath(root,path);
    const current = await readFile(target).catch(error=>{if(error.code === 'ENOENT')return null;throw error;});
    if ((current === null ? null : digest(current)) !== expected) throw Error(`WORKSPACE_STALE: ${path} 변경됨. 목록을 다시 확인하세요.`);
    if (bytes === null) { if(current !== null) await unlink(target); return; }
    await mkdir(dirname(target),{recursive:true});
    const temp = target + '.' + randomUUID() + '.studio-tmp';
    await writeFile(temp,bytes);
    try {
      await this.checkedPath(root,path);
      const fresh = await readFile(target).catch(error=>{if(error.code === 'ENOENT')return null;throw error;});
      if ((fresh === null ? null : digest(fresh)) !== expected) throw Error(`WORKSPACE_STALE: ${path}`);
      await rename(temp,target);
    } finally { await unlink(temp).catch(error=>{if(error.code !== 'ENOENT')throw error;}); }
  }
  async apply(id) {
    const plan = this.plans.get(id);
    if (!plan || plan.workspaceId !== this.meta?.id) throw Error('WORKSPACE_PLAN: 변경 목록을 다시 확인하세요.');
    if (this.busy) throw Error('WORKSPACE_BUSY');
    if (plan.conflicts.length) throw Error('WORKSPACE_CONFLICT: 양쪽에서 수정한 파일이 있습니다. 원본 또는 작업 사본에서 충돌을 먼저 해결하세요.');
    this.busy = true; this.onChange(this.summary());
    const destinationRoot = plan.direction === 'pull' ? this.meta.workingRpRoot : this.meta.originRpRoot;
    const sourceRoot = plan.direction === 'pull' ? this.meta.originRpRoot : this.meta.workingRpRoot;
    const backupRoot = join(this.root,this.meta.id,'sync-backups',plan.id);
    const staged = [], applied = [];
    const previousBaseline = {...this.meta.baseline}, previousSync = this.meta.lastSync;
    try {
      const [a,b] = await Promise.all([snapshot(this.meta.originRpRoot),snapshot(this.meta.workingRpRoot)]);
      if (digest(JSON.stringify(a)) !== digest(JSON.stringify(plan.a)) || digest(JSON.stringify(b)) !== digest(JSON.stringify(plan.b))) throw Error('WORKSPACE_STALE: 목록 확인 후 팩이 변경되었습니다. 다시 확인하세요.');
      for (const change of plan.changes) {
        const bytes = change.source === null ? null : await readFile(await this.checkedPath(sourceRoot,change.path));
        const previous = change.destination === null ? null : await readFile(await this.checkedPath(destinationRoot,change.path));
        if ((bytes === null ? null : digest(bytes)) !== change.source || (previous === null ? null : digest(previous)) !== change.destination) throw Error(`WORKSPACE_STALE: ${change.path}`);
        if (previous !== null) { await mkdir(dirname(join(backupRoot,'before',change.path)),{recursive:true}); await writeFile(join(backupRoot,'before',change.path),previous); }
        if (bytes !== null) { await mkdir(dirname(join(backupRoot,'after',change.path)),{recursive:true}); await writeFile(join(backupRoot,'after',change.path),bytes); }
        staged.push({...change,bytes,previous});
      }
      await atomicJSON(join(backupRoot,'transaction.json'),{...plan,destinationRoot,createdAt:new Date().toISOString(),status:'prepared'});
      for (const change of staged) { await this.replace(destinationRoot,change.path,change.bytes,change.destination); applied.push(change); }
      for (const row of [...plan.converged,...plan.changes.map(change=>({path:change.path,hash:change.source}))]) {
        if (row.hash === null) delete this.meta.baseline[row.path]; else this.meta.baseline[row.path] = row.hash;
      }
      this.meta.lastSync = {direction:plan.direction,fileCount:applied.length,at:new Date().toISOString(),backupRoot};
      await this.save();
      await atomicJSON(join(backupRoot,'transaction.json'),{...plan,destinationRoot,status:'applied',completedAt:new Date().toISOString()});
      const currentA = {...plan.a};
      if(plan.direction === 'push') {
        for(const change of plan.changes) { if(change.source===null)delete currentA[change.path];else currentA[change.path]=change.source; }
      }
      this.originChanged = !sameHashes(currentA,this.meta.baseline);
      this.plans.clear();
      return {applied:true,fileCount:applied.length,workspace:{...this.summary(),busy:false},backupRoot};
    } catch(error) {
      const rollbackErrors = [];
      for (const change of applied.reverse()) try { await this.replace(destinationRoot,change.path,change.previous,change.source); } catch(failure) { rollbackErrors.push(`${change.path}: ${failure.message}`); }
      this.meta.baseline = previousBaseline; this.meta.lastSync = previousSync;
      await this.save().catch(failure=>rollbackErrors.push(failure.message));
      if(staged.length)await atomicJSON(join(backupRoot,'transaction.json'),{...plan,destinationRoot,status:rollbackErrors.length?'recovery-needed':'rolled-back',error:error.message,rollbackErrors}).catch(failure=>rollbackErrors.push(failure.message));
      throw Error(error.message + (rollbackErrors.length ? `; 일부 복구 실패. 백업: ${backupRoot}; ${rollbackErrors.join('; ')}` : ''));
    } finally { this.busy = false; this.onChange(this.summary()); }
  }
  close() { this.watcher?.close(); clearTimeout(this.timer); }
}
