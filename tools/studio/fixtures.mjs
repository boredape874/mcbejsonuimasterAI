import { readFile, readdir, stat, realpath, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { matchesView } from './views.mjs';
export const fixtureSummaries = records => records.map(({id,name,fixture,sourceHash,viewIds})=>({id,name,title:fixture.title,buttonCount:fixture.buttons?.length??0,sourceHash,viewIds}));
export async function importFormFixtures(directory,runtime,views) {
  const root=await realpath(directory),records=[],issues=[];
  for(const entry of (await readdir(root,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))) {
    if(!entry.isFile()||!entry.name.endsWith('.json')||entry.name.endsWith('.report.json'))continue;
    if(records.length>=128){issues.push('128개까지만 가져왔습니다.');break;}
    try {
      const file=join(root,entry.name);if((await stat(file)).size>256*1024)throw Error('256 KiB 초과');
      const text=await readFile(file,'utf8'),fixture=JSON.parse(text);
      if(typeof fixture.title!=='string'||!Array.isArray(fixture.buttons))continue;
      if(fixture.buttons.length>256||fixture.buttons.some(b=>!b||typeof b.text!=='string'))throw Error('버튼 데이터 형식 오류');
      const viewIds=views.filter(view=>view.kind==='form'&&matchesView(view,fixture)).map(view=>view.id);
      if(!viewIds.length)continue;
      const sourceHash=createHash('sha256').update(text).digest('hex');
      records.push({id:randomUUID(),name:entry.name,sourcePath:file,sourceHash,viewIds,fixture:{...fixture,hoveredIndex:null,pressedIndex:null,focusedIndex:null}});
    }catch(error){issues.push(`${entry.name}: ${error.message}`);}
  }
  if(!records.length)throw Error('title과 buttons가 있는 폼 데이터 JSON이 없습니다.');
  const id=randomUUID();await mkdir(join(runtime,'fixture-libraries'),{recursive:true});
  await writeFile(join(runtime,'fixture-libraries',id+'.json'),JSON.stringify({schema:'studio.fixtures.v1',id,records}));
  return {id,records,issues};
}
export async function loadFormFixtures(id,runtime) {
  if(!id)return [];
  if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Invalid fixture library id');
  return JSON.parse(await readFile(join(runtime,'fixture-libraries',id+'.json'),'utf8')).records;
}
