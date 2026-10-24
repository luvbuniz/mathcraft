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
const qa = html.indexOf('/* LIBQ-LOGIC-START */'), qb = html.indexOf('/* LIBQ-LOGIC-END */');
assert.ok(qa > 0 && qb > qa, 'LIBQ logic markers missing');
vm.runInContext(html.slice(qa, qb) + '\n' + html.slice(a, b) + '\nthis.WIZ_TV = WIZ_TV; this.WIZ_TV_USE_AFTER_S = WIZ_TV_USE_AFTER_S;', ctx);
const W = ctx;
const STORY_TITLES = [...html.matchAll(/\{ e: '[^']*', t: ("|')(.*?)\1/g)].map(m => m[2].replace(/\\'/g, "'"));
function session(title, opts) { return Object.assign({ story: { t: title }, qs: [{}, {}, {}, {}], qi: 4, firstRight: 4 }, opts || {}); }

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
test('first-try rule: 3 of 4 unlocks, 2 of 4 does not', () => {
  assert.equal(W.wizUnlockForSession(session('The Dragon Who Wanted to Shine', { firstRight: 3 }), {}).ep.id, 'ep7');
  const p = {}; assert.equal(W.wizUnlockForSession(session("Popcorn's Magical Journey", { firstRight: 2 }), p), null);
  assert.equal((p.wizTvUnlocked || []).length, 0);
});
test('first-try rule: 2 of 3 unlocks, 1 of 3 does not; 3 of 5 unlocks, 2 of 5 does not', () => {
  const three = { qs: [{}, {}, {}], qi: 3 }, five = { qs: [{}, {}, {}, {}, {}], qi: 5 };
  assert.ok(W.wizUnlockForSession(session("RobotCat's Big Adventure", Object.assign({ firstRight: 2 }, three)), {}));
  assert.equal(W.wizUnlockForSession(session("RobotCat's Big Adventure", Object.assign({ firstRight: 1 }, three)), {}), null);
  assert.ok(W.wizUnlockForSession(session("RobotCat's Big Adventure", Object.assign({ firstRight: 3 }, five)), {}));
  assert.equal(W.wizUnlockForSession(session("RobotCat's Big Adventure", Object.assign({ firstRight: 2 }, five)), {}), null);
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
  assert.deepEqual(JSON.parse(JSON.stringify(leo)), { wizTvUnlocked: ['ep1'], wizTvTickets: ['ep1'] });   // survives the JSON save
});
const ep = id => W.WIZ_TV.episodes.find(e => e.id === id);
function extract(name) { const s = html.indexOf('function ' + name + '('); return html.slice(s, html.indexOf('\n}', s) + 2); }
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

// ---- 🎟️ one viewing per pass (Amy, Oct 24) ----
const bronco = () => session("Bronco's Icy Escape");
const reload = p => JSON.parse(JSON.stringify(p));                 // what the profile save/load round trip does
function spendHarness(p) {                                       // the real wizMaybeSpend + logic, with a fake save
  let saves = 0;
  const c = vm.createContext({ WizTV: { open: true, used: false, ep: null, played: 0, furthest: 0, ended: false }, profile: p, profileDirty: false,
    saveProfile() { saves++; }, console });
  vm.runInContext(html.slice(qa, qb) + '\n' + html.slice(a, b) + '\n' + extract('wizMaybeSpend') + 'this.spend=wizMaybeSpend; this.WIZ_TV = WIZ_TV;', c);
  c.WizTV.ep = c.WIZ_TV.episodes.find(e => e.id === 'ep3');
  return { c, saves: () => saves };
}
test('the 20 s threshold is one named constant', () => {
  assert.equal(W.WIZ_TV_USE_AFTER_S, 20);
  assert.equal((html.match(/WIZ_TV_USE_AFTER_S\s*=/g) || []).length, 1);
});
test('pass → one ticket → watch to the end → ticket spent and Watch locked', () => {
  const p = {};
  const r = W.wizUnlockForSession(bronco(), p);
  assert.equal(r.ticket, true); assert.equal(W.wizHasTicket(ep('ep3'), p), true);
  const h = spendHarness(p); h.c.WizTV.ended = true; h.c.spend();
  assert.equal(W.wizHasTicket(ep('ep3'), p), false); assert.equal(W.wizIsUnlocked(ep('ep3'), p), true);   // watched, not forgotten
  assert.equal(h.saves(), 1); assert.equal(h.c.profileDirty, true);
  h.c.spend(); assert.equal(h.saves(), 1);                                                                // spends once
});
test('20 s of watching spends it even without reaching the end; seeking past 20 s counts too', () => {
  for (const [played, furthest] of [[20, 20], [20.4, 6], [3, 140]]) {
    const p = {}; W.wizUnlockForSession(bronco(), p);
    const h = spendHarness(p); h.c.WizTV.played = played; h.c.WizTV.furthest = furthest; h.c.spend();
    assert.equal(W.wizHasTicket(ep('ep3'), p), false, played + '/' + furthest);
  }
});
test('a reload stays locked', () => {
  let p = {}; W.wizUnlockForSession(bronco(), p);
  const h = spendHarness(p); h.c.WizTV.ended = true; h.c.spend();
  p = reload(p);
  assert.equal(W.wizHasTicket(ep('ep3'), p), false); assert.equal(W.wizIsUnlocked(ep('ep3'), p), true);
  assert.deepEqual(p.wizTvTickets, []);
});
test('passing again re-earns exactly one viewing', () => {
  let p = {}; W.wizUnlockForSession(bronco(), p);
  const h = spendHarness(p); h.c.WizTV.ended = true; h.c.spend(); p = reload(p);
  const r = W.wizUnlockForSession(bronco(), p);
  assert.equal(r.isNew, false); assert.equal(r.ticket, true);
  assert.deepEqual([...p.wizTvTickets], ['ep3']); assert.equal(W.wizHasTicket(ep('ep3'), reload(p)), true);
  // a failed re-read (1 of 4 first try) earns nothing
  const p2 = reload(p); W.wizUseTicket(ep('ep3'), p2);
  assert.equal(W.wizUnlockForSession(session("Bronco's Icy Escape", { firstRight: 1 }), p2), null);
  assert.equal(W.wizHasTicket(ep('ep3'), p2), false);
});
test('closing early (< 20 s) or a network error before playback keeps the ticket', () => {
  for (const [played, furthest] of [[0, 0], [19.9, 19.9], [5, 12]]) {
    const p = {}; W.wizUnlockForSession(bronco(), p);
    const h = spendHarness(p); h.c.WizTV.played = played; h.c.WizTV.furthest = furthest; h.c.spend();
    assert.equal(W.wizHasTicket(ep('ep3'), reload(p)), true, played + '/' + furthest); assert.equal(h.saves(), 0);
  }
});
test('a second pass while a ticket is unused does not stack', () => {
  const p = {};
  W.wizUnlockForSession(bronco(), p);
  const r2 = W.wizUnlockForSession(bronco(), p);
  assert.equal(r2.ticket, false); assert.deepEqual([...p.wizTvTickets], ['ep3']);
  const h = spendHarness(p); h.c.WizTV.ended = true; h.c.spend();
  assert.equal(W.wizHasTicket(ep('ep3'), p), false);                     // one viewing, not two
});
test('tickets are per episode and per profile; Ep6 and unpaired stories never get one', () => {
  const leo = {}, fiona = {};
  W.wizUnlockForSession(bronco(), leo);
  assert.equal(W.wizHasTicket(ep('ep3'), fiona), false); assert.equal(W.wizHasTicket(ep('ep2'), leo), false);
  W.wizUnlockForSession(session("Bonnie's Magical Meadow"), leo); W.wizUnlockForSession(session('The Lost Kite'), leo);
  assert.deepEqual([...leo.wizTvTickets], ['ep3']);
  assert.equal(W.wizGrantTicket(ep('ep6'), leo), false);
  assert.equal(W.wizHasTicket(ep('ep6'), { wizTvUnlocked: ['ep6'], wizTvTickets: ['ep6'] }), false);   // hand-edited save
  assert.equal(W.wizHasTicket(ep('ep3'), { wizTvTickets: ['ep3'] }), false);                          // ticket without an unlock
});
test('no bypass in the UI code: player needs a ticket, no Watch-again, ended blocks play, watched tiles do not open the player', () => {
  const play = extract('wizPlay');
  assert.ok(/if \(WizTV\.open \|\| !wizHasTicket\(ep, profile\)\) return;/.test(play), 'wizPlay must refuse without a ticket');
  assert.ok(!/wizTvAgain|Watch again|currentTime = 0/.test(play), 'no replay from the player');
  assert.ok(/WizTV\.ended\) \{ try \{ v\.pause\(\)/.test(play), 'play after the end must be blocked');
  assert.ok(/v\.controls = false/.test(play));
  const shelf = extract('renderWizTvShelf');
  assert.ok(/if \(ready\) cell\.onclick = \(\) => \{ Sound\.click\(\); wizPlay\(ep\); \};/.test(shelf));
  assert.equal((shelf.match(/wizPlay\(/g) || []).length, 1, 'only ready tiles call wizPlay');
  assert.ok(/Read it again to watch!/.test(shelf));
});
test('legacy save (unlocked before this rule, no tickets) shows watched, not playable', () => {
  const p = reload({ wizTvUnlocked: ['ep3'] });
  assert.equal(W.wizIsUnlocked(ep('ep3'), p), true); assert.equal(W.wizHasTicket(ep('ep3'), p), false);
});

// ---- player teardown (pause → removeAttribute src → load → remove) and render-loop resume ----
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
