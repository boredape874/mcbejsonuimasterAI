import assert from "node:assert/strict";
import { mkdir, mkdtemp, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { clearFinalRpCaches, finalRpCacheStats, openProject, resolveScreen } from "../tools/_lib/final-rp-engine.mjs";

const root=await mkdtemp(join(tmpdir(),"mcbe-cache-")),target=join(root,"target"),vanilla=join(root,"vanilla");
for(const pack of [target,vanilla])await mkdir(join(pack,"ui"),{recursive:true});
await writeFile(join(vanilla,"ui","_ui_defs.json"),JSON.stringify({ui_defs:[]}));
await writeFile(join(target,"ui","_ui_defs.json"),JSON.stringify({ui_defs:["ui/screen.json"]}));
await writeFile(join(target,"ui","screen.json"),JSON.stringify({namespace:"cache",screen:{type:"panel",size:[16,16]}}));
clearFinalRpCaches();const start=performance.now();await openProject({rpRoot:target,vanillaRoot:vanilla});const coldMs=performance.now()-start,warmStart=performance.now();await openProject({rpRoot:target,vanillaRoot:vanilla});const warmMs=performance.now()-warmStart;let stats=finalRpCacheStats();assert.equal(stats.indexMisses,1);assert.equal(stats.indexHits,1);assert.equal(stats.profileMisses,1);assert.equal(stats.profileHits,1);
await resolveScreen({rpRoot:target,vanillaRoot:vanilla,control:"@cache.screen",interactionState:"default"});await resolveScreen({rpRoot:target,vanillaRoot:vanilla,control:"@cache.screen",interactionState:"hover"});stats=finalRpCacheStats();assert.ok(stats.indexHits>=3);assert.ok(stats.profileHits>=3);
await writeFile(join(target,"ui","screen.json"),JSON.stringify({namespace:"cache",screen:{type:"panel",size:[16,16]},added:{type:"panel",size:[1,1]}}));const changed=await openProject({rpRoot:target,vanillaRoot:vanilla});stats=finalRpCacheStats();assert.equal(stats.indexMisses,2);assert.equal(changed.controlCount,2);console.log(JSON.stringify({test:"final-rp-v2-cache",coldMs:Number(coldMs.toFixed(3)),warmMs:Number(warmMs.toFixed(3)),stats}));
const screenPath=join(target,"ui","screen.json"),before=await stat(screenPath),source=JSON.stringify({namespace:"cache",screen:{type:"panel",size:[16,16]},added:{type:"panel",size:[1,1]}}),sameSize=source.replace('"added"','"other"');assert.equal(Buffer.byteLength(source),Buffer.byteLength(sameSize));await writeFile(screenPath,sameSize);await utimes(screenPath,before.atime,before.mtime);const sameSizeChanged=await openProject({rpRoot:target,vanillaRoot:vanilla});stats=finalRpCacheStats();assert.equal(stats.indexMisses,3);assert.equal(sameSizeChanged.controlCount,2);
console.log(JSON.stringify({test:"final-rp-v2-cache",coldMs:Number(coldMs.toFixed(3)),warmMs:Number(warmMs.toFixed(3)),stats}));
