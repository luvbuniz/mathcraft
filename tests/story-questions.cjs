// Pip QA P0-3: library questions must be answerable from the text variant the reader is shown.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync(require('path').join(__dirname,'../play.html'),'utf8');
function block(startMarker,endMarker){const a=s.indexOf(startMarker);assert.ok(a>=0,'missing '+startMarker);return s.slice(a,s.indexOf(endMarker,a)+endMarker.length);}
const stories=block('const STORIES = [','\n];');
const fit=block('const STORY_Q_MIN_VARIANT = {','function libStoryHTML(').replace(/function libStoryHTML\($/,'');
const st=block('function storyText(s) {','\n}');
const c=vm.createContext({G:{readLevel:1},console});
vm.runInContext(stories+'\nfunction readLevelNow(){return G.readLevel;}\n'+st+'\n'+fit+';this.STORIES=STORIES;this.MIN=STORY_Q_MIN_VARIANT;',c);
let passed=0;const failures=[];
function test(name,fn){try{fn();console.log('PASS '+name);passed++;}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name+': '+e.message);}}
const asked=(title,lvl)=>{c.G.readLevel=lvl;return c.storyFitQs(c.STORIES.find(x=>x.t===title)).map(q=>q.q);};
test('Arty at Level 2 (grade-1 text) skips misty mountains and the castle question',()=>{const q=asked("Arty's High-Flying Heist",2);
 assert.ok(!q.includes('Where did Arty the dragon live?'));assert.ok(!q.includes('Who did Arty become friends with at the castle?'));assert.ok(q.length>=3);});
test('Arty at Level 3 (richer text) can ask where Arty lived',()=>{assert.ok(asked("Arty's High-Flying Heist",3).includes('Where did Arty the dragon live?'));});
test('Scooter at Level 2 never asks who chased Scooter',()=>{assert.ok(!asked('Scooter: From Wizard to Pomeranian',2).includes('Who chased Scooter into the new world?'));});
test('every story has at least 3 answerable questions at every reading level',()=>{const thin=[];
 for(const st of c.STORIES)for(let l=1;l<=5;l++){const n=asked(st.t,l).length;if(n<3)thin.push(st.t+' L'+l+': '+n);}assert.deepEqual(thin,[]);});
test('every hand-checked question exists in the story bank',()=>{const all=new Set(c.STORIES.flatMap(x=>x.qs.map(q=>q.q)));const missing=Object.keys(c.MIN).filter(k=>!all.has(k));assert.deepEqual([...missing],[]);});
console.log(`${passed} passed; ${failures.length} failed`);if(failures.length)process.exitCode=1;
