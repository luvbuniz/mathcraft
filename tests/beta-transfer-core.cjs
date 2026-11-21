require(require('path').join(__dirname,'..','beta','transfer-core.js')); const c = globalThis.StackadooTransfer, assert = require('assert');
const d = {'stackadooSave:Leo': '{"a":1}', 'stackadooSave:Leo::city': '{"b":1}', 'stackadooProfile:leo': '{"p":1}', 'mathcraftSave:Mia': '{"m":1}', 'stackadooProfile:Mia':'{}', 'other':'x'};
const s = c.fromData(d); assert.deepStrictEqual(s.names, ['leo', 'Mia']);
const one = JSON.parse(c.select(s, ['LEO'])); assert.deepStrictEqual(Object.keys(one.data).sort(), ['stackadooProfile:leo','stackadooSave:Leo','stackadooSave:Leo::city']); assert(!('origin' in one));
const cl = JSON.parse(c.select(s, ['Mia','leo'], 'cloud')); assert.strictEqual(cl.origin, 'cloud'); assert.strictEqual(Object.keys(cl.data).length, 5);
assert.throws(() => c.select(s, ['Zed'])); assert.throws(() => c.select(s, []));
const s2 = c.fromData({'stackadooSave:Bo':'{}','stackadooSave:bo':'{}'}); assert.deepStrictEqual(s2.names, ['Bo']);
assert.strictEqual(c.select(s, ['leo']), c.select(s, ['leo']));
console.log('transfer-core d15 ok');
