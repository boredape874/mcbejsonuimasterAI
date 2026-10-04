import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { compactStudioRender } from './render-transfer.mjs';
let queue = Promise.resolve();
process.on('message', message => {
  queue = queue.then(async () => {
  const { id, engineRoot, operation, args } = message;
  try {
    const engine = await import(pathToFileURL(join(engineRoot, 'tools/_lib/final-rp-engine.mjs')).href);
    if (!['renderScreen', 'resolveScreen', 'openProject'].includes(operation)) throw new Error('Unknown engine operation');
    const result = await engine[operation](args);
    process.send({ id, result:operation==='renderScreen' ? compactStudioRender(result) : result });
  } catch (error) {
    process.send({ id, error: error.stack ?? String(error) });
  }
  });
});
process.on('disconnect', () => process.exit(0));
