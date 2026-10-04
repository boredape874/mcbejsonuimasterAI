import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export async function configuration() {
  let local = {};
  try { local = JSON.parse(await readFile(join(root, 'workspace/studio-config.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const runtime=process.env.JSONUI_STUDIO_RUNTIME || join(root, 'workspace/studio-runtime');
  const cacheRoot=local.cacheRoot || (process.platform==='win32'&&process.env.LOCALAPPDATA?join(process.env.LOCALAPPDATA,'MCBEJSONUIStudio','cache',createHash('sha256').update(resolve(runtime)).digest('hex').slice(0,16)):runtime);
  return { ...local, engineRoot: root, runtime,cacheRoot,cacheRootRuntime:runtime,
    bridgeRoot: local.bridgeRoot || join(root, 'workspace/studio-native'),
    port: Number(process.env.JSONUI_STUDIO_PORT || local.port || 47832) };
}
