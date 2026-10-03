import { EventEmitter } from 'node:events';
import { watch } from 'node:fs';
import { readFile, writeFile, mkdir, realpath, stat } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { fork } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { nativeStatus, requestNativeReload, requestNativeAction } from './native.mjs';
import { Reviewer, patchText } from './review.mjs';

export const hash = text => createHash('sha256').update(text).digest('hex');
export class LiveSession extends EventEmitter {
  constructor(config) {
    super(); this.config = config; this.id = randomUUID(); this.revision = 0; this.state = { status: 'idle', runtimeVerified: false }; this.reviewer = new Reviewer();
  }
  status() { return { sessionId: this.id, revision: this.revision, project: this.project, ...this.state, runtimeVerified: false }; }
  publish(patch) { this.state = { ...this.state, ...patch }; this.emit('state', this.status()); }
  async engine(operation, args) {
    return new Promise((accept, reject) => {
      const child = fork(fileURLToPath(new URL('./worker.mjs', import.meta.url)), [], { cwd: this.config.engineRoot, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
      let settled = false, stderr = '';
      const finish = (error, result) => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : accept(result); };
      const timer = setTimeout(() => { child.kill(); finish(new Error('Renderer timeout (60 seconds)')); }, 60000);
      child.stderr.on('data', b => { stderr = (stderr + b).slice(-4000); });
      child.once('error', e => finish(e));
      child.once('exit', code => finish(new Error(`Renderer exited ${code}: ${stderr}`)));
      child.once('message', m => finish(m.error ? new Error(m.error) : null, m.result));
      child.send({ engineRoot: this.config.engineRoot, operation, args });
    });
  }
  async open(input) {
    const rpRoot = await realpath(input.rpRoot);
    if (!(await stat(rpRoot)).isDirectory()) throw new Error('rpRoot must be a directory');
    const viewport = input.viewport ?? [480, 270];
    if (!Array.isArray(viewport) || viewport.length !== 2 || viewport.some(n => !Number.isInteger(n) || n < 16 || n > 2048)) throw new Error('viewport: two integers, 16..2048');
    if (typeof input.control !== 'string' || !input.control.includes('.')) throw new Error('control must be namespace.control');
    this.watcher?.close(); clearTimeout(this.debounce);
    this.project = { rpRoot, control: input.control, viewport, fixture: input.fixture ?? {}, interactionState: input.interactionState ?? 'default', ...(input.vanillaRoot ? { vanillaRoot: await realpath(input.vanillaRoot) } : {}) };
    this.watcher = watch(rpRoot, { recursive: true }, (_, name) => {
      if (!name || /\.(json|jsonc|png|tga|txt|lang)$/i.test(name)) {
        clearTimeout(this.debounce);
        ++this.revision;
        this.publish({ stale: true });
        this.debounce = setTimeout(() => this.render().catch(() => {}), 200);
      }
    });
    this.watcher.on('error', e => this.publish({ watchError: e.message }));
    return this.render();
  }
  async render(changes = {}) {
    if (!this.project) throw new Error('Open a resource pack first');
    clearTimeout(this.debounce);
    if (changes.fixture !== undefined) this.project.fixture = changes.fixture;
    if (changes.interactionState !== undefined) {
      if (!['default','hover','pressed','focused','selected','locked'].includes(changes.interactionState)) throw new Error('Unsupported state');
      this.project.interactionState = changes.interactionState;
    }
    const revision = ++this.revision;
    this.publish({ status: 'rendering', stale: true, error: null });
    // Serialize expensive renders. Intermediate requests are discarded before invoking the engine.
    const previous = this.pending;
    const task = (async () => {
      await previous?.catch(() => {});
      if (revision !== this.revision) return this.status();
      try {
        const outputDir = join(this.config.runtime, 'renders', this.id, String(revision));
        const report = await this.engine('renderScreen', { ...this.project, outputDir });
        if (revision === this.revision) this.publish({ status: 'ready', stale: false, renderedRevision: revision, report, error: null });
      } catch (error) {
        if (revision === this.revision) this.publish({ status: 'error', stale: true, error: error.message });
      }
      return this.status();
    })();
    this.pending = task;
    return task;
  }
  async inspect() { if (!this.project) throw new Error('Open a resource pack first'); return this.engine('resolveScreen', this.project); }
  async sourcePath(name) {
    if (!this.project || typeof name !== 'string' || isAbsolute(name) || !/\.(json|jsonc)$/i.test(name)) throw new Error('Use a relative JSON/JSONC file in the open RP');
    const file = await realpath(resolve(this.project.rpRoot, name));
    const rel = relative(this.project.rpRoot, file);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Source path escapes RP');
    if ((await stat(file)).size > 2 * 1024 * 1024) throw new Error('Source exceeds 2 MiB');
    return file;
  }
  async readSource(name) { const text = await readFile(await this.sourcePath(name), 'utf8'); return { path: name, text, sha256: hash(text) }; }
  async writeSource({ path, text, expectedHash }) {
    const previous = this.writeQueue;
    let unlock;
    this.writeQueue = new Promise(r => { unlock = r; });
    await previous;
    try {
    if (typeof text !== 'string' || Buffer.byteLength(text) > 2 * 1024 * 1024) throw new Error('Source must be text <= 2 MiB');
    const file = await this.sourcePath(path), original = await readFile(file, 'utf8');
    if (!expectedHash || hash(original) !== expectedHash) throw new Error('SOURCE_CONFLICT: reread the file before saving');
    await mkdir(join(this.config.runtime, 'backups'), { recursive: true });
    await writeFile(join(this.config.runtime, 'backups', `${hash(original)}.json`), original);
    await writeFile(file, text, 'utf8');
    return { path, sha256: hash(text), saved: true };
    } finally { unlock(); }
  }
  async nativeStatus() {
    return nativeStatus(this.config.bridgeRoot);
  }
  async review(args) { return this.reviewer.review(await this.nativeStatus(), this.status(), args); }
  async nativeAction(args) { return requestNativeAction(this.config.bridgeRoot, args); }
  async patchSource({ path, expectedHash, find, replace }) {
    const source = await this.readSource(path);
    return this.writeSource({ path, expectedHash, text: patchText(source, {expectedHash,find,replace}) });
  }
  async nativeReload() {
    if (this.nativeReloadPending) throw new Error('NATIVE_RELOAD_BUSY');
    this.nativeReloadPending = true;
    try { return await requestNativeReload(this.config.bridgeRoot); }
    finally { this.nativeReloadPending = false; }
  }
  close() { this.watcher?.close(); clearTimeout(this.debounce); }
}
