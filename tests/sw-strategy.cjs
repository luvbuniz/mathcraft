// Run from any directory: node tests/sw-strategy.cjs
// Checks the service worker's page-load strategy: network-first with a short timeout, a fresh
// offline copy saved on success, offline fallback, and old caches cleared on activate.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const src = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function makeSW() {
  const stores = new Map();                 // cacheName -> Map(key -> body)
  const listeners = {};
  const net = { mode: 'online', body: 'B', delay: 0, calls: [] };
  const store = name => { if (!stores.has(name)) stores.set(name, new Map()); return stores.get(name); };
  const norm = k => typeof k === 'string' ? k : k.url;
  class Resp {
    constructor(body, init = {}) { this.body = body; this.status = init.status ?? 200; this.ok = this.status >= 200 && this.status < 300;
      this.type = init.type || 'basic'; this.redirected = false; this.headers = init.headers || {}; }
    text() { return Promise.resolve(this.body); }
    clone() { return new Resp(this.body, this); }
    static error() { const r = new Resp(null, { status: 0, type: 'error' }); r.ok = false; return r; }
  }
  const cacheObj = name => ({
    match: k => Promise.resolve(store(name).has(norm(k)) ? new Resp(store(name).get(norm(k))) : undefined),
    put: (k, r) => r.text().then(t => { store(name).set(norm(k), t); }),
  });
  const caches = {
    open: name => Promise.resolve(cacheObj(name)),
    keys: () => Promise.resolve([...stores.keys()]),
    delete: name => Promise.resolve(stores.delete(name)),
    match: k => { for (const m of stores.values()) if (m.has(norm(k))) return Promise.resolve(new Resp(m.get(norm(k)))); return Promise.resolve(undefined); },
  };
  const fetch = (req, init) => {
    net.calls.push({ url: norm(req), init });
    if (net.mode === 'offline') return Promise.reject(new TypeError('offline'));
    return new Promise(res => setTimeout(() => res(new Resp(net.body)), net.delay));
  };
  let claimed = 0, skipped = 0;
  const self = { addEventListener: (t, f) => { listeners[t] = f; }, skipWaiting: () => { skipped++; },
    clients: { claim: () => { claimed++; return Promise.resolve(); } } };
  const ctx = vm.createContext({ self, caches, fetch, Response: Resp, Request: class { constructor(u, i) { this.url = u; Object.assign(this, i); } },
    URL, setTimeout, clearTimeout, Promise, console });
  vm.runInContext(src, ctx);
  const CACHE = vm.runInContext('CACHE', ctx);
  const dispatch = (type, extra) => { let p = null, responded = false;
    const ev = { ...extra, waitUntil(x) { p = x; }, respondWith(x) { responded = true; p = Promise.resolve(x); } };
    listeners[type](ev); return { p, responded }; };
  const nav = url => dispatch('fetch', { request: { url, method: 'GET', mode: 'navigate', destination: 'document' } });
  return { stores, store, net, CACHE, dispatch, nav, ctx, get claimed() { return claimed; }, get skipped() { return skipped; } };
}

async function main() {
  // 1. Online: a plain reload of /play gets build B from the network even though build A is cached.
  let sw = makeSW();
  sw.store(sw.CACHE).set('play.html', 'BUILD-A');
  sw.net.body = 'BUILD-B';
  let r = await sw.nav('https://stackadoo.com/play').p;
  assert.match(await r.text(), /BUILD-B/, '/play is network-first');
  assert.equal(sw.net.calls[0].init.cache, 'no-cache', 'page fetch revalidates past the HTTP cache');
  await new Promise(res => setTimeout(res, 5));
  assert.equal(sw.store(sw.CACHE).get('play.html'), 'BUILD-B', 'offline copy refreshed after a good fetch');

  // Every page URL is handled the same way, and assets are not treated as pages.
  for (const u of ['https://stackadoo.com/', 'https://stackadoo.com/play.html', 'https://x.workers.dev/play?r2=1', 'https://stackadoo.com/play/'])
    assert.equal(vm.runInContext(`isPlayHtml({url:${JSON.stringify(u)}})`, sw.ctx), true, u);
  for (const u of ['https://stackadoo.com/sw.js', 'https://stackadoo.com/avatars/leo.glb', 'https://stackadoo.com/playground.png'])
    assert.equal(vm.runInContext(`isPlayHtml({url:${JSON.stringify(u)}})`, sw.ctx), false, u);

  // 2. Offline: the saved copy loads, for /play and for /.
  sw.net.mode = 'offline';
  r = await sw.nav('https://stackadoo.com/play').p;
  assert.match(await r.text(), /BUILD-B/, 'offline /play uses the saved copy');
  r = await sw.nav('https://stackadoo.com/').p;
  assert.match(await r.text(), /BUILD-B/, 'offline / falls back to the saved game page');

  // 3. Slow network (longer than the timeout) with a saved copy: the saved copy is used.
  sw = makeSW();
  sw.store(sw.CACHE).set('play.html', 'BUILD-A');
  sw.ctx.setTimeout = (f, ms) => setTimeout(f, ms === 3000 ? 10 : ms);   // shrink the 3 s timeout
  vm.runInContext('NAV_TIMEOUT_MS', sw.ctx) === 3000 || assert.fail('timeout is 3 s');
  sw.net.delay = 200; sw.net.body = 'BUILD-B';
  let t0 = Date.now(); r = await sw.nav('https://stackadoo.com/play').p;
  assert.match(await r.text(), /BUILD-A/, 'slow network falls back to cache after the timeout');
  assert(Date.now() - t0 < 150, 'did not wait for the slow network');

  // 4. Slow network with nothing saved: keep waiting for the network instead of failing.
  sw = makeSW();
  sw.ctx.setTimeout = (f, ms) => setTimeout(f, ms === 3000 ? 10 : ms);
  sw.net.delay = 60; sw.net.body = 'BUILD-B';
  r = await sw.nav('https://stackadoo.com/play').p;
  assert.match(await r.text(), /BUILD-B/, 'first slow load still arrives');

  // 5. Offline with nothing saved: a network error, not a hang.
  sw = makeSW(); sw.net.mode = 'offline';
  r = await sw.nav('https://stackadoo.com/play').p;
  assert.equal(r.type, 'error');

  // 6. Activate clears old caches and takes control without reloading anything.
  sw = makeSW();
  sw.store('stackadoo-v301').set('play.html', 'OLD'); sw.store(sw.CACHE).set('play.html', 'NEW');
  assert.notEqual(sw.CACHE, 'stackadoo-v301', 'cache version bumped');
  await sw.dispatch('activate', {}).p;
  assert.deepEqual([...sw.stores.keys()], [sw.CACHE]);
  assert.equal(sw.claimed, 1);
  assert.doesNotMatch(src, /\.navigate\(|location\.reload|postMessage/, 'the worker never forces a page reload');

  // 7. Non-GET requests and Google/Firebase auth URLs are left alone.
  assert.equal(sw.dispatch('fetch', { request: { url: 'https://stackadoo.com/play', method: 'POST', mode: 'navigate' } }).responded, false);
  assert.equal(sw.dispatch('fetch', { request: { url: 'https://accounts.google.com/gsi/client', method: 'GET', mode: 'no-cors' } }).responded, false);

  // 8. The page registers the same worker URL from both entry pages (no install ping-pong).
  const reg = f => (fs.readFileSync(path.join(__dirname, '..', f), 'utf8').match(/serviceWorker\.register\('([^']+)'/) || [])[1];
  assert.equal(reg('play.html'), reg('index.html'));
  console.log('sw-strategy: all checks passed');
}
main().catch(e => { console.error(e); process.exit(1); });
