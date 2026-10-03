import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
process.once('message', async ({ engineRoot, operation, args }) => {
  try {
    const engine = await import(pathToFileURL(join(engineRoot, 'tools/_lib/final-rp-engine.mjs')).href);
    if (!['renderScreen', 'resolveScreen', 'openProject'].includes(operation)) throw new Error('Unknown engine operation');
    const result = await engine[operation](args);
    process.send({ result }, () => process.exit(0));
  } catch (error) {
    process.send({ error: error.stack ?? String(error) }, () => process.exit(1));
  }
});
