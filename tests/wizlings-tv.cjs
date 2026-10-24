// 📺 Wizlings TV: unlock rules, story↔episode pairing, the pick-a-cut logic, player teardown,
// and the sw.js rule that video is never cached.  node tests/wizlings-tv.cjs
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert/strict');
const html = fs.readFileSync(process.env.WIZTV_SOURCE || path.join(__dirname, '../play.html'), 'utf8');
const swSrc = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
let passed = 0; const failures = [];
function test(name, fn) { try { fn(); console.log('PASS ' + name); passed++; } catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL ' + name + ': ' + e.message); } }
const a = html.indexOf('/* WIZTV-LOGIC-START */'), b = html.indexOf('/* WIZTV-LOGIC-END */');
assert.ok(a > 0 && b > a, 'Wizlings TV logic block markers missing from play.html');
const ctx = vm.createContext({ URLSearchParams, location: { search: '' }, console });
vm.runInContext(html.slice(a, b) + '\nthis.WIZ_TV = WIZ_TV;', ctx);
const W = ctx;
const STORY_TITLES = [...html.matchAll(/\{ e: '[^']*', t: ("|')(.*?)\1/g)].map(m => m[2].replace(/\\'/g, "'"));
function session(title, opts) { return Object.assign({ story: { t: title }, qs: [{}, {}, {}, {}], qi: 4, firstRight: 4, lastRight: true }, opts || {}); }

test('every paired episode points at a real Library story title', () => {
  for (const ep of W.WIZ_TV.episodes) assert.ok(STORY_TITLES.includes(ep.story), ep.id + ' story "' + ep.story + '" not in STORIES');
});
test('pairings match Amy’s list', () => {
  const map = Object.fromEntries(W.WIZ_TV.episodes.map(e => [e.story, e.id]));
  assert.equal(map['Scooter: From Wizard to Pomeranian'], 'ep1');
  assert.equal(map["The Wizard Dogs' Barking Brilliant Plan"], 'ep2');
  assert.equal(map["Bronco's Icy Escape"], 'ep3');
  assert.equal(map["RobotCat's Big Adventure"], 'ep4');
  assert.equal(map["Popcorn's Magical Journey"], 'ep5');
  assert.equal(map['The Dragon Who Wanted to Shine'], 'ep7');
  assert.equal(map["Bonnie's Magical Meadow"], 'ep6');
});
test('Ep6 Bonnie is hidden: not listed, not paired, never unlockable', () => {
  assert.ok(!W.wizVisibleEpisodes().some(e => e.id === 'ep6'));
  assert.equal(W.wizVisibleEpisodes().length, 6);
  assert.equal(W.wizEpisodeForStory("Bonnie's Magical Meadow"), null);
  const p = {}; assert.equal(W.wizUnlockForSession(session("Bonnie's Magical Meadow"), p), null);
  assert.deepEqual([...W.wizUnlocked(p)], []);
  const p2 = { wizTvUnlocked: ['ep6'] };                          // even a hand-edited save can't show it
  assert.equal(W.wizIsUnlocked(W.WIZ_TV.episodes.find(e => e.id === 'ep6'), p2), false);
});
test('passing the last question with 4/4 unlocks the story’s own episode, once', () => {
  const p = {};
  const r = W.wizUnlockForSession(session("Bronco's Icy Escape"), p);
  assert.equal(r.ep.id, 'ep3'); assert.equal(r.isNew, true);
  const again = W.wizUnlockForSession(session("Bronco's Icy Escape"), p);
  assert.equal(again.isNew, false); assert.deepEqual([...p.wizTvUnlocked], ['ep3']);
});
test('3 of 4 with the last one right still unlocks', () => {
  const p = {}; assert.equal(W.wizUnlockForSession(session('The Dragon Who Wanted to Shine', { firstRight: 3 }), p).ep.id, 'ep7');
});
test('missing the LAST question does not unlock', () => {
  const p = {}; assert.equal(W.wizUnlockForSession(session("Popcorn's Magical Journey", { firstRight: 3, lastRight: false }), p), null);
  assert.equal((p.wizTvUnlocked || []).length, 0);
});
test('skimming (under 3 of 4 first-try) does not unlock even if the last is right', () => {
  assert.equal(W.wizUnlockForSession(session("RobotCat's Big Adventure", { firstRight: 2 }), {}), null);
});
test('an unfinished quiz or a Library Battle does not unlock', () => {
  assert.equal(W.wizUnlockForSession(session("RobotCat's Big Adventure", { qi: 3 }), {}), null);
  assert.equal(W.wizUnlockForSession(session("RobotCat's Big Adventure", { battle: true }), {}), null);
  assert.equal(W.wizUnlockForSession(session("RobotCat's Big Adventure", { qs: [] , qi: 0 }), {}), null);
});
test('stories without an episode unlock nothing', () => {
  assert.equal(W.wizUnlockForSession(session('The Lost Kite'), {}), null);
  assert.equal(W.wizUnlockForSession(session("Bronco's Icy Reunion"), {}), null);
});
test('unlocks are per profile', () => {
  const leo = {}, fiona = {};
  W.wizUnlockForSession(session('Scooter: From Wizard to Pomeranian'), leo);
  const ep1 = W.WIZ_TV.episodes[0];
  assert.equal(W.wizIsUnlocked(ep1, leo), true); assert.equal(W.wizIsUnlocked(ep1, fiona), false);
  assert.deepEqual(JSON.parse(JSON.stringify(leo)), { wizTvUnlocked: ['ep1'] });   // survives the JSON save
});
const ep = id => W.WIZ_TV.episodes.find(e => e.id === id);
test('pick-a-cut: portrait phones get the vertical cut', () => {
  assert.equal(W.wizPickCut(ep('ep2'), 390, 844), 'v');
  assert.equal(W.wizPickCut(ep('ep7'), 360, 740), 'v');
});
test('pick-a-cut: landscape phones and tablets (either way up) get horizontal', () => {
  assert.equal(W.wizPickCut(ep('ep2'), 844, 390), 'h');
  assert.equal(W.wizPickCut(ep('ep2'), 1024, 768), 'h');
  assert.equal(W.wizPickCut(ep('ep2'), 768, 1024), 'h');
  assert.equal(W.wizPickCut(ep('ep2'), 800, 1280), 'h');
  assert.equal(W.wizPickCut(ep('ep2'), 1920, 1080), 'h');
});
test('pick-a-cut: no vertical cut → horizontal even on a portrait phone', () => {
  assert.equal(W.wizPickCut(ep('ep1'), 390, 844), 'h');
  assert.equal(W.wizPickCut(ep('ep5'), 390, 844), 'h');
});
test('only the chosen cut’s URL is built; base override is local-only', () => {
  assert.equal(W.wizSrc(ep('ep3'), 'v'), W.WIZ_TV.base + 'ep3-v.mp4');
  assert.equal(W.wizTvBase({ search: '?wiztvbase=http://127.0.0.1:8099/' }), 'http://127.0.0.1:8099/');
  assert.equal(W.wizTvBase({ search: '?wiztvbase=https://evil.example/' }), W.WIZ_TV.base);
});

// ---- player teardown (pause → removeAttribute src → load → remove) and render-loop resume ----
function extract(name) { const s = html.indexOf('function ' + name + '('); return html.slice(s, html.indexOf('\n}', s) + 2); }
test('closing the player fully tears down the video and restarts the render loop', () => {
  const log = []; let raf = 0;
  const vid = { pause() { log.push('pause'); }, removeAttribute(n) { log.push('rm:' + n); }, load() { log.push('load'); }, remove() { log.push('remove'); } };
  const el = { remove() { log.push('overlay'); } };
  const c = vm.createContext({ WizTV: { open: true, loopParked: true, el, vid, media: [], audio: false }, lastT: 0, performance: { now: () => 5 },
    requestAnimationFrame() { raf++; }, loop() {}, removeEventListener() {}, dispatchEvent() {}, Event: function () {}, wizKey() {},
    document: { fullscreenElement: null }, Sound: { ctx: null }, console });
  vm.runInContext(extract('wizResumeGame') + extract('wizClose') + 'this.close=wizClose;', c);
  c.close();
  assert.deepEqual(log.slice(0, 5), ['pause', 'rm:src', 'rm:poster', 'load', 'remove']);
  assert.equal(c.WizTV.open, false); assert.equal(c.WizTV.vid, null); assert.equal(raf, 1); assert.equal(c.WizTV.loopParked, false);
  c.close(); assert.equal(raf, 1);                                  // double close is a no-op
});
test('render loop parks itself while the player is open', () => {
  const s = html.indexOf('function loop(now) {'); const body = html.slice(s, s + 200);
  assert.ok(/if \(WizTV\.open\) \{ WizTV\.loopParked = true; return; \}[^\n]*\n\s*requestAnimationFrame\(loop\)/.test(body), 'loop() must return BEFORE requesting the next frame');
});

// ---- sw.js: video is never cached or intercepted ----
function swHarness() {
  const listeners = {};
  const self = { addEventListener(t, f) { listeners[t] = f; }, skipWaiting() {}, clients: { claim() {} } };
  const c = vm.createContext({ self, caches: { open: () => Promise.resolve({ put() {} }), match: () => Promise.resolve(null), keys: () => Promise.resolve([]) },
    fetch: () => Promise.resolve({ ok: true, type: 'basic', clone() { return this; }, text: () => Promise.resolve('') }), Response, Request: function (u) { this.url = u; }, URL, console });
  vm.runInContext(swSrc, c);
  return url => { let responded = false; const headers = new Map(); const req = { method: 'GET', url, mode: 'no-cors', destination: '', headers: { get: k => headers.get(k) } };
    return { run(dest, range) { req.destination = dest || ''; if (range) headers.set('range', range); listeners.fetch({ request: req, respondWith() { responded = true; } }); return responded; } }; };
}
test('sw.js leaves Wizlings video (R2 / media host / .mp4 / Range / video element) to the network', () => {
  const h = swHarness();
  assert.equal(h('https://media.stackadoo.com/wizlings/v1/ep3-h.mp4').run(), false);
  assert.equal(h('https://pub-abc123.r2.dev/wizlings/v1/ep3-h.jpg').run(), false);
  assert.equal(h('http://127.0.0.1:8099/ep2-v.mp4').run(), false);
  assert.equal(h('https://stackadoo.com/shots/cinema/x.MP4?v=2').run(), false);
  assert.equal(h('https://stackadoo.com/stream/clip').run('video'), false);
  assert.equal(h('https://stackadoo.com/stream/clip').run('', 'bytes=0-'), false);
});
test('sw.js still serves ordinary game assets through the cache', () => {
  const h = swHarness();
  assert.equal(h('https://stackadoo.com/textures/oak-store-v1.jpg?v=280').run('image'), true);
  assert.equal(h('https://stackadoo.com/avatars/kinglion.glb').run(), true);
});
console.log(`${passed} passed; ${failures.length} failed`); if (failures.length) process.exitCode = 1;
