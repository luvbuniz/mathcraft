/* Focused regression checks for the bounded Math Meadow selector and progression. */
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('play.html', 'utf8');
function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error('Could not find source boundary: ' + start);
  return source.slice(a, b);
}
function fn(name) {
  const start = source.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Could not find function ' + name);
  let i = source.indexOf('{', start), depth = 0;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unclosed function ' + name);
}

let seed = 20260921;
const math = Object.create(Math);
math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const context = vm.createContext({
  Math: math,
  Set,
  Date,
  console,
  profileDirty: false,
  G: { grade: 2, mathGradeCeiling: 2, mathLevel: 2, gradePin: 0 },
  profile: { mathLearning: null },
  SKILL_LABELS: { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division', round: 'Rounding', frac: 'Fractions', dec: 'Decimals' },
  kidHintHTML: () => null,
  mulHintHTML: () => null
});
vm.runInContext(`
  const usedEquations = new Set();
  function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  ${between('/*\n   Core Math Meadow questions', '/* ===================== READING CITY')}
  ${fn('safeMathGrade')}
  ${fn('initialMathBands')}
  ${fn('ensureMathLearning')}
  ${fn('setMathGradeCeiling')}
  ${fn('coreEvidence')}
  ${fn('recordCoreMathAttempt')}
`, context, { timeout: 5000 });
const run = code => vm.runInContext(code, context, { timeout: 5000 });
const assert = (ok, message) => { if (!ok) throw new Error(message); };
function reset(grade) {
  run(`G.grade=${grade}; G.mathGradeCeiling=${grade}; G.mathLevel=${grade}; G.gradePin=0; profile={mathLearning:null}; profileDirty=false; usedEquations.clear(); ensureMathLearning();`);
}
function questions(grade, count) {
  reset(grade);
  return run(`JSON.stringify(Array.from({length:${count}}, () => makeEquation()))`);
}
function numericAnswer(text) {
  const normalized = text.replace(/−/g, '-').trim();
  let m = normalized.match(/^(\d+)\s*([+\-×÷])\s*(\d+)$/);
  if (!m) return null;
  const a = +m[1], b = +m[3];
  return m[2] === '+' ? a + b : m[2] === '-' ? a - b : m[2] === '×' ? a * b : a / b;
}
function validateSet(grade, count) {
  const qs = JSON.parse(questions(grade, count));
  qs.forEach(q => {
    assert(q.curriculumGrade <= grade, `grade ${grade} emitted ${q.templateId}`);
    assert(new Set(q.options).size === 4, `duplicate options: ${q.text}`);
    assert(q.options.filter(o => String(o) === String(q.answer)).length === 1, `missing correct option: ${q.text}`);
    const answer = numericAnswer(q.text);
    if (answer != null) assert(String(answer) === String(q.answer), `wrong arithmetic: ${q.text}`);
  });
  return qs;
}

const grade2 = validateSet(2, 5000);
assert(grade2.every(q => q.skill === 'add' || q.skill === 'sub'), 'Grade 2 served a non-add/sub skill');
assert(grade2.every(q => !/[×÷/]/.test(q.text)), 'Grade 2 served multiplication, division, or fractions');
assert(grade2.every(q => Math.max(...(q.text.match(/\d+/g) || []).map(Number)) <= 100), 'Grade 2 exceeded within-100 bounds');

const grade3 = validateSet(3, 5000);
assert(grade3.every(q => q.text !== '65 × 5'), 'Grade 3 served 65 × 5');
assert(grade3.every(q => !(/×/.test(q.text) && /\d{2}/.test(q.text))), 'Grade 3 served multi-digit multiplication');
validateSet(4, 5000);
validateSet(5, 5000);

reset(2);
run(`
  var learning = ensureMathLearning();
  for (let i = 0; i < 19; i++) recordCoreMathAttempt({coreMath:true,skill:'add',difficultyBand:1,templateId:'ccss-1oa-add-10',text:'1 + ' + (i + 1)}, true);
  globalThis.afterNineteen = learning.bands.add;
  recordCoreMathAttempt({coreMath:true,skill:'add',difficultyBand:1,templateId:'ccss-1oa-add-10',text:'2 + 20'}, true);
  globalThis.afterTwenty = learning.bands.add;
  globalThis.mulBand = learning.bands.mul;
`);
assert(run('afterNineteen') === 1, 'promoted before 20 qualifying answers');
assert(run('afterTwenty') === 2, 'did not promote one add band after 20 qualifying answers');
assert(run('mulBand') === undefined, 'addition changed multiplication evidence for Grade 2');

reset(3);
run(`
  learning = ensureMathLearning(); learning.bands.mul = 2;
  recordCoreMathAttempt({coreMath:true,skill:'mul',difficultyBand:2,templateId:'ccss-3oa-mul-facts-easy',text:'2 × 3'}, false);
  recordCoreMathAttempt({coreMath:true,skill:'mul',difficultyBand:2,templateId:'ccss-3oa-mul-facts-easy',text:'2 × 4'}, false);
  globalThis.loweredBand = learning.bands.mul; globalThis.ceiling = learning.gradeCeiling;
`);
assert(run('loweredBand') === 1, 'two wrong active-band attempts did not ease one skill band');
assert(run('ceiling') === 3, 'easing changed the selected grade ceiling');

reset(3);
run(`forcedCoreQuestion={skill:'mul',band:1}; globalThis.forcedSkill=makeEquation().skill;`);
assert(run('forcedSkill') === 'mul', 'the easier-question selector changed skills');

// A legacy global math level is not evidence of mastery. Migration begins at the
// saved grade ceiling and must leave the other subject settings alone.
run(`
  G.grade=2; G.gradePin=0; G.mathGradeCeiling=0; G.mathLevel=5;
  profile={mathLearning:null,readLevel:4,spellLevel:5}; profileDirty=false;
  var migrated = ensureMathLearning();
  globalThis.migratedCeiling=migrated.gradeCeiling;
  globalThis.migratedAddBand=migrated.bands.add;
  setMathGradeCeiling(3);
  globalThis.readAfterMathOnly=profile.readLevel;
  globalThis.spellAfterMathOnly=profile.spellLevel;
`);
assert(run('migratedCeiling') === 2, 'legacy math level raised the migrated grade ceiling');
assert(run('migratedAddBand') === 1, 'legacy save did not start math at the beginner band');
assert(run('readAfterMathOnly') === 4 && run('spellAfterMathOnly') === 5, 'math-only setting changed another subject');

console.log(JSON.stringify({ passed:true, generated:{ grade2:grade2.length, grade3:grade3.length, grade4:5000, grade5:5000 } }));
