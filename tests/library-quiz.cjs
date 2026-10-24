// 👂 Library anti-guessing: first-try scoring, the rapid-tap detector, the per-attempt shuffle,
// and the listen-first unlock timing.  node tests/library-quiz.cjs
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert/strict');
const html = fs.readFileSync(process.env.LIBQ_SOURCE || path.join(__dirname, '../play.html'), 'utf8');
let passed = 0; const failures = [];
function test(name, fn) { try { fn(); console.log('PASS ' + name); passed++; } catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL ' + name + ': ' + e.message); } }
const a = html.indexOf('/* LIBQ-LOGIC-START */'), b = html.indexOf('/* LIBQ-LOGIC-END */');
assert.ok(a > 0 && b > a, 'LIBQ logic markers missing from play.html');
const Q = vm.createContext({ Math });
vm.runInContext(html.slice(a, b) + '\nthis.LIBQ = LIBQ;', Q);
function seeded(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }

test('first-try bar: 2 of 3', () => {
  assert.equal(Q.libFirstTryNeed(3), 2);
  assert.equal(Q.libFirstTryPassed(2, 3), true); assert.equal(Q.libFirstTryPassed(1, 3), false);
});
test('first-try bar: 60 % for other counts (4 → 3, 5 → 3, 2 → 2, 1 → 1, 10 → 6)', () => {
  assert.deepEqual([1, 2, 4, 5, 10].map(n => Q.libFirstTryNeed(n)), [1, 2, 3, 3, 6]);
  assert.equal(Q.libFirstTryPassed(3, 4), true); assert.equal(Q.libFirstTryPassed(2, 4), false);
  assert.equal(Q.libFirstTryPassed(3, 5), true); assert.equal(Q.libFirstTryPassed(2, 5), false);
});
test('first-try bar: empty or missing counts never pass', () => {
  assert.equal(Q.libFirstTryPassed(0, 0), false); assert.equal(Q.libFirstTryPassed(undefined, 4), false);
});
test('rapid taps: 3 inside 1 s trips the detector, then it resets', () => {
  const d = Q.makeTapBurst(1000, 3);
  assert.equal(d(0), false); assert.equal(d(300), false); assert.equal(d(650), true);
  assert.equal(d(700), false);                       // fresh window after a trip
});
test('rapid taps: calm tapping (> 1 s spread) never trips', () => {
  const d = Q.makeTapBurst(1000, 3);
  for (let t = 0; t < 10000; t += 600) assert.equal(d(t), false);
});
test('rapid taps: 3 taps spanning exactly 1 s do not trip; just inside does', () => {
  const d = Q.makeTapBurst(1000, 3); d(0); d(500); assert.equal(d(1000), false);
  const e = Q.makeTapBurst(1000, 3); e(0); e(500); assert.equal(e(999), true);
});
test('rapid taps: defaults are 3 taps / ~1 s', () => { assert.equal(Q.LIBQ.tapBurst, 3); assert.equal(Q.LIBQ.tapWindowMs, 1000); });
test('shuffle keeps exactly the same answers', () => {
  const o = ['red', 'blue', 'green', 'gold'];
  for (let s = 1; s < 50; s++) assert.deepEqual([...Q.shuffleOptions(o, null, seeded(s))].sort(), [...o].sort());
  assert.deepEqual(o, ['red', 'blue', 'green', 'gold']);       // input untouched
});
test('shuffle: every new attempt gets a different order than the last one', () => {
  const o = ['a', 'b', 'c', 'd']; let prev = null;
  const r = seeded(7);
  for (let i = 0; i < 200; i++) { const n = Q.shuffleOptions(o, prev, r); if (prev) assert.notEqual(n.join(), prev.join()); prev = n; }
  const two = ['x', 'y']; let p2 = ['x', 'y'];
  for (let i = 0; i < 20; i++) { const n = Q.shuffleOptions(two, p2, () => 0.99); assert.notEqual(n.join(), p2.join()); p2 = n; }
});
test('shuffle spreads the right answer across positions', () => {
  const o = ['RIGHT', 'b', 'c', 'd'], pos = [0, 0, 0, 0], r = seeded(3);
  for (let i = 0; i < 4000; i++) pos[Q.shuffleOptions(o, null, r).indexOf('RIGHT')]++;
  for (const n of pos) assert.ok(n > 800 && n < 1200, 'position counts ' + pos);
});
test('listen-first fallback: ~2 s + a little per word, capped', () => {
  assert.equal(Q.libReadDelay(''), 2000);
  assert.equal(Q.libReadDelay('Why did Bronco slide?'), 2000 + 4 * 150);
  assert.ok(Q.libReadDelay('word '.repeat(200)) <= 6000);
});
test('play.html wiring: answers start locked, taps go through the detector, misses grey out, reshuffle on replay', () => {
  assert.match(html, /className = 'libBtn libOpt libLocked'/);
  assert.match(html, /b\.onclick = \(\) => libTap\(opt, q, b\)/);
  assert.match(html, /lib\.tapBurst\(performance\.now\(\)\)\) \{ libReadTogether\(q\); return; \}/);
  assert.match(html, /btn\.classList\.add\('libShake', 'libGone'\)/);
  assert.match(html, /function libReadTogether[\s\S]{0,900}libRenderOptions\(q\);[\s\S]{0,600}libReadQuestion\(q,/);
  assert.match(html, /audio\/intro\/lion-read_together\.mp3/);
  assert.ok(fs.existsSync(path.join(__dirname, '../audio/intro/lion-read_together.mp3')), 'lion clip missing');
  assert.match(html, /id="libRetryBtn">📖 Let’s read the story again!/);
});
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
