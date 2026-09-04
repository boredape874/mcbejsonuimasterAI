import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
const SCHEMA="mcbe-jsonui-ai-kit/content-cache@1";
const digest=value=>createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");
export function contentCacheKey(parts){return digest({schema:SCHEMA,...parts});}
export async function readContentCache(path,key){try{const envelope=JSON.parse(await readFile(path,"utf8"));if(envelope.schema!==SCHEMA||envelope.key!==key||envelope.checksum!==digest(envelope.value))return{hit:false,reason:"CACHE_CORRUPT"};return{hit:true,value:envelope.value,revision:envelope.revision};}catch(error){return{hit:false,reason:error.code==="ENOENT"?"CACHE_MISS":"CACHE_CORRUPT"};}}
export async function writeContentCache(path,key,value,{revision=null}={}){await mkdir(dirname(path),{recursive:true});const envelope={schema:SCHEMA,key,revision,checksum:digest(value),value},temporary=`${path}.${process.pid}.${randomUUID()}.tmp`;await writeFile(temporary,`${JSON.stringify(envelope)}\n`,"utf8");try{for(let attempt=0;;attempt++){try{await rename(temporary,path);break;}catch(error){if(!["EEXIST","EPERM","EACCES"].includes(error.code)||attempt>=2)throw error;await unlink(path).catch(failure=>{if(failure.code!=="ENOENT")throw failure;});}}}catch(error){await unlink(temporary).catch(()=>{});throw error;}return envelope;}
