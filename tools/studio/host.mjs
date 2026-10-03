import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { configuration, root } from './config.mjs';
import { StudioSession } from './editor.mjs';
import { CodexBridge } from './codex.mjs';

export async function startHost(config) {
  config ??= await configuration();
  const session = new StudioSession(config), token = randomBytes(32).toString('hex'), clients = new Set();
  const codex = session.ai = new CodexBridge(session);
  const dispatch = async (name, args = {}) => {
    switch (name) {
      case 'catalog': return session.catalog(args.rpRoot || session.project?.rpRoot);
      case 'studio': return { ...session.status(), editor:session.editor, codex:codex.status() };
      case 'studio_context': return session.context();
      case 'select': return session.select(args);
      case 'edit': return session.edit(args);
      case 'add': return session.add(args);
      case 'history': return session.history(args);
      case 'import_image': return session.importImage(args);
      case 'new_project': return session.newProject();
      case 'game_frame': return session.acceptFrame(args);
      case 'game_stop': return session.clearFrame();
      case 'browser_frame': return session.acceptBrowserFrame(args);
      case 'codex_status': return codex.status();
      case 'codex_connect': return codex.connect();
      case 'codex_message': return codex.message(args);
      case 'codex_interrupt': return codex.interrupt();
      case 'codex_reply': return codex.reply(args);
      case 'open': return session.open(args);
      case 'render': return session.render(args);
      case 'status': return session.status();
      case 'inspect': return session.inspect();
      case 'read_source': return session.readSource(args.path);
      case 'write_source': return session.writeSource(args);
      case 'native_status': return session.nativeStatus();
      case 'native_reload': return session.nativeReload();
      case 'review': return session.review(args);
      case 'native_action': return session.nativeAction(args);
      case 'patch_source': return session.patchSource(args);
      default: throw new Error('Unknown operation');
    }
  };
  const server = http.createServer(async (req, res) => {
    const fail = (status, message) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: message })); };
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.headers.host !== `127.0.0.1:${server.address().port}`) return fail(403, 'Invalid host');
      const origin = req.headers.origin;
      if (origin && origin !== `http://127.0.0.1:${server.address().port}`) return fail(403, 'Invalid origin');
      if (url.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'" });
        return res.end((await readFile(join(root, 'studio/index.html'), 'utf8')).replace('__TOKEN__', token));
      }
      if (['/app.js','/style.css'].includes(url.pathname) && req.method === 'GET') {
        res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8'});
        return res.end(await readFile(join(root,'studio',url.pathname.slice(1))));
      }
      if ((req.headers.authorization ?? `Bearer ${url.searchParams.get('token')}`) !== `Bearer ${token}`) return fail(401, 'Authentication required');
      if (url.pathname === '/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
        res.write(`data: ${JSON.stringify(session.status())}\n\n`); clients.add(res); req.on('close', () => clients.delete(res)); return;
      }
      if (url.pathname === '/game-image') {
        if(!session.gameFrame) return fail(404,'No shared game window');
        res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});return res.end(await readFile(session.gameFrame.path));
      }
      if (url.pathname === '/image') {
        const state = session.status();
        if (!state.report?.outputPath) return fail(404, 'No preview');
        if (url.searchParams.get('revision') && Number(url.searchParams.get('revision')) !== state.renderedRevision) return fail(409, 'Preview revision changed');
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }); return res.end(await readFile(state.report.outputPath));
      }
      if (url.pathname.startsWith('/api/') && req.method === 'POST') {
        let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 8 * 1024 * 1024) return fail(413, 'Request too large'); }
        const result = await dispatch(url.pathname.slice(5), body ? JSON.parse(body) : {});
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(result));
      }
      fail(404, 'Not found');
    } catch (error) { fail(400, error.message); }
  });
  session.on('state', state => { for (const client of clients) client.write(`data: ${JSON.stringify(state)}\n\n`); });
  codex.on('state', state => { for(const client of clients)client.write(`event: codex\ndata: ${JSON.stringify(state)}\n\n`); });
  session.on('game-frame', state => { for(const client of clients)client.write(`event: game\ndata: ${JSON.stringify(state)}\n\n`); });
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(config.port, '127.0.0.1', accept); });
  const connection = { url: `http://127.0.0.1:${server.address().port}`, token, pid: process.pid, sessionId: session.id };
  await mkdir(config.runtime, { recursive: true });
  await writeFile(join(config.runtime, 'connection.json'), JSON.stringify(connection, null, 2));
  try { await session.open(JSON.parse(await readFile(join(config.runtime,'last-project.json'),'utf8'))); }
  catch(error) { if(error.code !== 'ENOENT') session.publish({restoreError:error.message}); }
  return { session, server, connection, codex, async close() { codex.close(); session.close(); for (const client of clients) client.end(); server.closeAllConnections(); await new Promise(r => server.close(r)); } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = await startHost();
  console.log(`JSON UI Live: ${host.connection.url}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => host.close().then(() => process.exit(0)));
}
