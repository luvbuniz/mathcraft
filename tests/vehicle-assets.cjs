// Run from any directory: node tests/vehicle-assets.cjs
// Every vehicles/*.glb the game asks for must exist in the repo (no 404s on /play).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'play.html'), 'utf8').replace(/\r\n/g, '\n');

// 1. The model list.
const m = source.match(/const VEHICLE_MODEL_IDS = (\[[^\]]*\]);/);
assert.ok(m, 'VEHICLE_MODEL_IDS list exists in play.html');
const ids = JSON.parse(JSON.stringify(vm.runInNewContext(m[1])));
assert.ok(ids.length > 0, 'at least one real vehicle model is listed');
for (const id of ids) {
  const f = path.join(root, 'vehicles', id + '.glb');
  assert.ok(fs.existsSync(f), `vehicles/${id}.glb is listed but missing from the repo`);
  assert.ok(fs.statSync(f).size < 25 * 1024 * 1024, `vehicles/${id}.glb is under the 25 MiB asset limit`);
}

// 2. Any literal vehicles/<id>.glb path in the code exists too.
for (const [, id] of source.matchAll(/['"`]vehicles\/([a-z0-9_-]+)\.glb['"`]/g)) {
  assert.ok(fs.existsSync(path.join(root, 'vehicles', id + '.glb')), `play.html references missing vehicles/${id}.glb`);
}

// 3. Run the real loader: every vehicle id goes in, only listed (existing) files are fetched.
const start = source.indexOf('const VEHICLE_MODEL_IDS');
const end = source.indexOf('VEHICLES.forEach(def => maybeUpgradeVehicleToModel(def.id));', start);
assert.ok(start > 0 && end > start, 'loader section found');
const vStart = source.indexOf('const VEHICLES = [');
const allIds = [...source.slice(vStart, source.indexOf('];', vStart)).matchAll(/id:\s*'([a-z0-9_]+)'/g)].map(x => x[1]);
assert.ok(allIds.length >= 10, 'VEHICLES list parsed');
const fetched = [];
const cars = Object.fromEntries(allIds.map(id => [id, { def: { id } }]));
const ctx = vm.createContext({ cars, THREE: { GLTFLoader: class {} }, console,
  fetch: (url) => { fetched.push(url); return new Promise(() => {}); } });
vm.runInContext(source.slice(start, end) + '\nfor (const id of ' + JSON.stringify(allIds) + ') maybeUpgradeVehicleToModel(id);', ctx);
for (const url of fetched) {
  assert.ok(fs.existsSync(path.join(root, url)), `loader requests ${url}, which is not in the repo`);
}
assert.deepEqual([...fetched].sort(), ids.map(id => 'vehicles/' + id + '.glb').sort(), 'loader fetches exactly the listed models');

// 4. Every .glb in vehicles/ is listed (an unlisted file would never load).
for (const f of fs.readdirSync(path.join(root, 'vehicles')).filter(f => f.endsWith('.glb'))) {
  assert.ok(ids.includes(f.replace(/\.glb$/, '')), `vehicles/${f} exists but is not in VEHICLE_MODEL_IDS`);
}
console.log(`vehicle-assets: OK (${ids.length} models fetched, ${allIds.length - ids.length} rides stay boxy with no request)`);
