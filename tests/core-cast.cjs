const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const section=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const G={avatarIndex:0,npcHomes:{}},player={pos:{x:0,z:0}};
const body={innerHTML:'',querySelectorAll:()=>[]};
const c=vm.createContext({G,player,$:()=>body});
vm.runInContext(section('const AVATARS =','/* ============================ 🎨 REAL 3D CHARACTER MODELS'),c);
const ids=Array.from(vm.runInContext('AVATARS.map(a=>a.id)',c));
assert.deepEqual(ids,['queenfox','princess','peacock','unicorn','tiger','dragon','deer','kinglion','piratecat','ninjadog','robot','astronaut','wizard','panda','penguin','bunny','superhero','spark','knight','trex','leo','fiona'],'saved avatar indexes remain unchanged');
assert.deepEqual(Array.from(vm.runInContext('AVATARS.filter(a=>!a.hidden).map(a=>a.id)',c)).sort(),['queenfox','kinglion','dragon','bunny','leo','fiona'].sort());
vm.runInContext(section('const NPC_CAST =','const NPC_ACT_LINES'),c);
for(let i=0;i<ids.length;i++){
  G.avatarIndex=i;const chosen=c.npcPickCast();
  assert.equal(chosen.length,2);assert.equal(new Set(chosen.map(n=>n.id)).size,2);
  assert(chosen.every(n=>n.id!==ids[i]),'no duplicate of the player');
}
G.avatarIndex=0;G.npcHomes={spark:[1,1],robot:[10,10],unicorn:[30,30],panda:[40,40]};
const before=JSON.stringify(G.npcHomes);
assert.deepEqual(Array.from(c.npcPickCast(),n=>n.id),['spark','robot'],'nearby saved residents keep priority');
player.pos={x:40,z:40};assert.deepEqual(Array.from(c.npcPickCast(),n=>n.id),['panda','unicorn']);
assert.equal(JSON.stringify(G.npcHomes),before,'all assignments survive even when only two residents appear');
vm.runInContext(section('function renderHeroMirror()','function openHeroMirror()'),c);
G.avatarIndex=ids.indexOf('spark');c.renderHeroMirror();
assert(body.innerHTML.includes('Spark the Fairy'),'legacy current hero remains visible in the mirror');
assert.equal((body.innerHTML.match(/class="mirrorHero"/g)||[]).length,7);
G.avatarIndex=0;c.renderHeroMirror();assert.equal((body.innerHTML.match(/class="mirrorHero"/g)||[]).length,6);
console.log('PASS: six core choices, 22 stable legacy indexes, two distinct friends for every hero, nearest saved residents prioritized without changing assignments, current legacy hero retained in mirror.');
