import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url)), repo=path.resolve(root,'../..');
const commands=[['examples/newui-codex/build-art.mjs'],['tools/run.mjs','examples/newui-codex/layout/ir.yaml'],['examples/newui-codex/build-rp.mjs'],['examples/newui-codex/build-bp.mjs'],['examples/newui-codex/build-preview.mjs'],['examples/newui-codex/verify.mjs']];
for(const args of commands){const r=spawnSync(process.execPath,args,{cwd:repo,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);}
