#!/usr/bin/env node
import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalBackend } from "./mcp-backend.mjs";
import { createMcbeUiService } from "./_lib/mcp-service.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const staticRoot = join(repoRoot, "inspector"), artifactRoot = join(repoRoot, "workspace", "inspector-output");
const portArg = process.argv.indexOf("--port"), port = Number(portArg >= 0 ? process.argv[portArg + 1] : 4177);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("--port must be between 1 and 65535");
await mkdir(artifactRoot, { recursive: true });
const backend = await createLocalBackend();
const service = createMcbeUiService(backend);
const methods = { openProject:"mcbe_ui_open_project", resolveScreen:"mcbe_ui_resolve_screen", renderScreen:"mcbe_ui_render_screen", renderStates:"mcbe_ui_render_states", inspectControl:"mcbe_ui_inspect_control", validateLayout:"mcbe_ui_validate_layout", validateStateTextures:"mcbe_ui_validate_state_textures", measureReference:"mcbe_ui_measure_reference", compareScreenshot:"mcbe_ui_compare_screenshot", proposeCorrections:"mcbe_ui_propose_corrections", calibrateRenderer:"mcbe_ui_calibrate_renderer", measureText:"mcbe_ui_measure_text", validateUpstreamCompatibility:"mcbe_ui_validate_upstream_compatibility" };
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg" };
const inside = (base, file) => { const rel = relative(resolve(base), resolve(file)); return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel)); };
const sendJson = (res,status,value) => { res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}); res.end(JSON.stringify(value)); };
async function parseBody(req) { let raw=""; for await (const chunk of req) { raw += chunk; if (raw.length > 2_000_000) throw new Error("Request too large"); } return raw ? JSON.parse(raw) : {}; }
async function importEvidence(input) {
  if (!isAbsolute(input.path ?? "")) throw new Error("Evidence path must be absolute");
  const source=resolve(input.path),info=await stat(source),extension=extname(source).toLowerCase();
  if(!info.isFile())throw new Error("Evidence path is not a file");
  if(![".png",".jpg",".jpeg"].includes(extension))throw new Error("Evidence must be PNG or JPEG");
  if(info.size>100*1024*1024)throw new Error("Evidence exceeds 100 MiB");
  const digest=createHash("sha256").update(await readFile(source)).digest("hex"),dir=join(artifactRoot,"evidence");await mkdir(dir,{recursive:true});
  const destination=join(dir,`${digest.slice(0,16)}-${basename(source).replace(/[^\w.-]+/g,"_")}`);if(!existsSync(destination))await copyFile(source,destination);
  return{ok:true,readOnly:true,kind:input.kind??"reference",sourcePath:source,artifactPath:destination,sha256:digest,bytes:info.size};
}
async function readFixture(input) {
  if (!isAbsolute(input.path ?? "")) throw new Error("Fixture path must be absolute");
  const source=resolve(input.path),info=await stat(source);
  if(!info.isFile()||extname(source).toLowerCase()!==".json")throw new Error("Fixture must be a JSON file");
  if(info.size>10*1024*1024)throw new Error("Fixture exceeds 10 MiB");
  const bytes=await readFile(source),fixture=JSON.parse(bytes);
  if(!fixture||typeof fixture!=="object"||Array.isArray(fixture))throw new Error("Fixture root must be an object");
  return{ok:true,readOnly:true,sourcePath:source,sha256:createHash("sha256").update(bytes).digest("hex"),bytes:info.size,fixture};
}
async function nudgeProposal(input){
  if(!input.projectId||!input.controlId)throw new Error("projectId and controlId are required");
  if(!["x","y","w","h"].includes(input.axis)||![-1,1].includes(Number(input.delta)))throw new Error("nudge requires axis x/y/w/h and delta -1 or 1");
  const inspected=await service.dispatch("mcbe_ui_inspect_control",{projectId:input.projectId,control:input.control,controlId:input.controlId,fixture:input.fixture});
  if(inspected.ok===false) return inspected;
  const node=inspected.control??inspected.result?.control,project=service.projects.get(input.projectId);
  const field=["x","y"].includes(input.axis)?"offset":"size",index=["x","w"].includes(input.axis)?0:1,oldValue=node.props?.[field]?.[index];
  if(!Number.isFinite(oldValue))return{ok:false,readOnly:true,rejected:[{reason:"unresolved_numeric_property",field,index,oldValue}]};
  const propertyPointer=`${node.pointer??""}/${field}/${index}`,origin=node.provenance?.[propertyPointer]??node.provenance?.[`/${field}/${index}`]??node.sourceTrace?.propertyOrigins?.[`/props/${field}`],pointer=origin?.sourcePointer??(node.sourceTrace?.definition?.jsonPointer?`${node.sourceTrace.definition.jsonPointer}/${field}/${index}`:null),sourceFile=origin?.file??node.sourceTrace?.definition?.file;
  if(!sourceFile||!pointer)return{ok:false,readOnly:true,rejected:[{reason:"unresolved_source_pointer",controlId:input.controlId,field,index}]};
  const file=isAbsolute(sourceFile)?resolve(sourceFile):resolve(project.rpRoot,sourceFile);if(!inside(project.rpRoot,file))return{ok:false,readOnly:true,rejected:[{reason:"path_escape"}]};
  const newValue=oldValue+Number(input.delta),bytes=await readFile(file),fileHash=createHash("sha256").update(bytes).digest("hex");
  return{ok:true,readOnly:true,projectRevision:project.projectRevision,proposal:{file,jsonPointer:pointer,oldValue,newValue,deltaUi:Number(input.delta),source:{fileHash,propertyOrigin:origin},preconditions:[{op:"test",path:pointer,value:oldValue}],jsonPatch:[{op:"test",path:pointer,value:oldValue},{op:"replace",path:pointer,value:newValue}],applyAllowed:false}};
}
const server = createServer(async (req,res) => { try {
  const url = new URL(req.url,`http://127.0.0.1:${port}`);
  if (req.method === "GET" && url.pathname === "/favicon.ico") { res.writeHead(204); return res.end(); }
  if (req.method === "GET" && url.pathname === "/api/capabilities") return sendJson(res,200,{ schemaVersion:2, methods:Object.keys(methods), tools:service.tools, artifactRoot });
  if(req.method==="POST"&&url.pathname==="/api/evidence/import")return sendJson(res,200,await importEvidence(await parseBody(req)));
  if(req.method==="POST"&&url.pathname==="/api/fixture/read")return sendJson(res,200,await readFixture(await parseBody(req)));
  if(req.method==="POST"&&url.pathname==="/api/nudge-proposal")return sendJson(res,200,await nudgeProposal(await parseBody(req)));
  if (req.method === "POST" && url.pathname.startsWith("/api/")) { const name=url.pathname.slice(5), tool=methods[name]; if (!tool) return sendJson(res,404,{ok:false,error:`Unsupported method: ${name}`}); const args=await parseBody(req); if ((name === "renderScreen" || name === "renderStates") && !args.outputDir) args.outputDir=artifactRoot; const result=await service.dispatch(tool,args); return sendJson(res,result.error?.code === "CAPABILITY_UNAVAILABLE" ? 501 : 200,result); }
  if (req.method === "GET" && url.pathname === "/api/artifact") { const file=resolve(url.searchParams.get("path")??""); if(!inside(artifactRoot,file)||!existsSync(file)||(await stat(file)).isFile()===false)return sendJson(res,404,{ok:false,error:"Artifact not found"}); res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream","cache-control":"no-store"}); return createReadStream(file).pipe(res); }
  const relativePath=url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1)), file=resolve(staticRoot,relativePath);
  if(!inside(staticRoot,file)||!existsSync(file)||(await stat(file)).isFile()===false)return sendJson(res,404,{ok:false,error:"Not found"}); res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream","cache-control":"no-store"}); createReadStream(file).pipe(res);
} catch(error) { sendJson(res,500,{ok:false,error:error.message}); } });
server.listen(port,"127.0.0.1",()=>console.log(`MCBE JSON UI inspector: http://127.0.0.1:${port}`));
