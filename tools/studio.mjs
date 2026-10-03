import { startHost } from './studio/host.mjs';
const host = await startHost();
console.log(`JSON UI Studio: ${host.connection.url}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => host.close().then(() => process.exit(0)));
