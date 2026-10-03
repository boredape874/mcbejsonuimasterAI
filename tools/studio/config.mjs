import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export async function configuration() {
  let local = {};
  try { local = JSON.parse(await readFile(join(root, 'workspace/studio-config.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { ...local, engineRoot: root, runtime: process.env.JSONUI_STUDIO_RUNTIME || join(root, 'workspace/studio-runtime'),
    bridgeRoot: local.bridgeRoot || join(root, 'workspace/studio-native'),
    port: Number(process.env.JSONUI_STUDIO_PORT || local.port || 47832) };
}
