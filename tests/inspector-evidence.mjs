import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const temp = await mkdtemp(join(tmpdir(), "mcbe-inspector-")), rp = join(temp, "rp"), image = join(temp, "reference.png"), fixturePath = join(temp, "fixture.json");
await mkdir(join(rp, "ui"), { recursive: true });
await writeFile(join(rp, "ui", "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/demo.json"] }));
const uiPath = join(rp, "ui", "demo.json"), original = JSON.stringify({ namespace: "demo", screen: { type: "panel", size: [100, 50], offset: [0, 0], controls: [{ instance: { type: "panel", size: [10, 10], offset: [5, 6] } }] } });
await writeFile(uiPath, original); await writeFile(image, Buffer.from("local-evidence")); await writeFile(fixturePath, JSON.stringify({title:"fixture-title",buttons:[{index:0,text:"A"}]}));
const port = 43000 + Math.floor(Math.random() * 1000), child = spawn(process.execPath, ["tools/inspector-server.mjs", "--port", String(port)], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
await new Promise((resolve, reject) => { const timer=setTimeout(()=>reject(new Error("inspector start timeout")),5000); child.stdout.on("data",chunk=>{if(String(chunk).includes("http://")){clearTimeout(timer);resolve();}}); child.once("exit",code=>reject(new Error(`inspector exited ${code}`))); });
const post = async (path, body) => { const response=await fetch(`http://127.0.0.1:${port}${path}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}); return {status:response.status,data:await response.json()}; };
try {
  const inspectorHtml=await readFile(join(process.cwd(),"inspector","index.html"),"utf8");for(const tab of ["route","binding","state","hit","source"])assert.match(inspectorHtml,new RegExp(`data-evidence="${tab}"`));
  const imported=await post("/api/evidence/import",{path:image,kind:"reference"}); assert.equal(imported.status,200); assert.equal(imported.data.readOnly,true); assert.equal(imported.data.sha256.length,64);
  const served=await fetch(`http://127.0.0.1:${port}/api/artifact?path=${encodeURIComponent(imported.data.artifactPath)}`); assert.equal(served.status,200); assert.equal(Buffer.from(await served.arrayBuffer()).toString(),"local-evidence");
  const relative=await post("/api/evidence/import",{path:"reference.png"}); assert.equal(relative.status,500);
  const fixture=await post("/api/fixture/read",{path:fixturePath}); assert.equal(fixture.status,200); assert.equal(fixture.data.readOnly,true); assert.equal(fixture.data.fixture.buttons.length,1);
  const relativeFixture=await post("/api/fixture/read",{path:"fixture.json"}); assert.equal(relativeFixture.status,500);
  const opened=await post("/api/openProject",{rpRoot:rp}); assert.equal(opened.data.ok,true);
  const resolved=await post("/api/resolveScreen",{projectId:opened.data.projectId,control:"demo.screen",viewport:[100,50]}); assert.equal(resolved.data.ok,true);
  const proposed=await post("/api/nudge-proposal",{projectId:opened.data.projectId,control:"demo.screen",controlId:"demo.screen",axis:"x",delta:1});
  assert.equal(proposed.data.ok,true,JSON.stringify(proposed.data)); assert.equal(proposed.data.proposal.applyAllowed,false); assert.deepEqual(proposed.data.proposal.jsonPatch,[{op:"test",path:"/screen/offset/0",value:0},{op:"replace",path:"/screen/offset/0",value:1}]);
  const nested=await post("/api/nudge-proposal",{projectId:opened.data.projectId,control:"demo.screen",controlId:"/controls/0",axis:"x",delta:1});
  assert.equal(nested.data.ok,true,JSON.stringify(nested.data)); assert.deepEqual(nested.data.proposal.jsonPatch,[{op:"test",path:"/screen/controls/0/instance/offset/0",value:5},{op:"replace",path:"/screen/controls/0/instance/offset/0",value:6}]);
  assert.equal(await readFile(uiPath,"utf8"),original,"nudge proposal must not modify the RP");
} finally { child.kill(); }
console.log("inspector-evidence: ok");
