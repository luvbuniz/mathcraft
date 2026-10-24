// Pip QA P0-2: reels with no clip must never be unlocked/shown, and fullscreen waits for `playing`.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync(require('path').join(__dirname,'../play.html'),'utf8');
function extract(name){const start=s.indexOf('function '+name+'(');assert.ok(start>=0,'missing '+name);const eol=s.indexOf('\n',start);if(s.slice(start,eol).trim().endsWith('}'))return s.slice(start,eol);return s.slice(start,s.indexOf('\n}',start)+2);}
const cs=s.indexOf('const CARTOONS = [');const cartoons=s.slice(cs,s.indexOf('];',cs)+2);
let passed=0;const failures=[];
function test(name,fn){try{fn();console.log('PASS '+name);passed++;}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name+': '+e.message);}}
function setup(){
 const nodes={},calls={fs:0};
 const listeners={};
 const video={muted:true,loop:true,isConnected:true,error:null,currentTime:0,play(){return Promise.resolve();},pause(){},load(){},removeAttribute(){},
  addEventListener(t,f){(listeners[t]=listeners[t]||[]).push(f);},removeEventListener(t,f){listeners[t]=(listeners[t]||[]).filter(x=>x!==f);},
  requestFullscreen(){calls.fs++;return Promise.resolve();}};
 const node=()=>({style:{},innerHTML:'',textContent:'',children:[],appendChild(c){this.children.push(c);},classList:{add(){}}});
 const $=id=>id==='cvid2'?video:(nodes[id]||(nodes[id]=node()));
 const c=vm.createContext({$,document:{createElement:node,getElementById:id=>id==='cvid2'?video:null,fullscreenElement:null},profile:{},profileDirty:false,lib:null,
  saveProfile(){},Sound:{click(){}},renderLib(){c.rendered=(c.rendered||0)+1;},mountMoviePlayer(){},fetch:undefined,Math,console});
 vm.runInContext(cartoons+';\nconst CARTOON_FOUND = {};\n'+['cartoonReady','readyCartoons','unlockNextCartoon','unlockedCartoons','rewatchCartoon','exitVideoFullscreen','stopLibVideo','renderCartoonShelf','renderCartoonWatch'].map(extract).join('\n')+';this.CARTOONS=CARTOONS;this.CARTOON_FOUND=CARTOON_FOUND;',c);
 return {c,nodes,video,listeners,calls};
}
test('only reels with a clip unlock; then rewatch is offered',()=>{const {c}=setup();
 const ready=[...c.CARTOONS.filter(x=>x.ready).map(x=>x.id)];assert.ok(ready.length>=1);
 const got=[];let r;while((r=c.unlockNextCartoon()))got.push(r.id);
 assert.deepEqual(got,ready);assert.equal(c.unlockNextCartoon(),null);assert.ok(ready.includes(c.rewatchCartoon().id));});
test('a clip found by the HEAD probe becomes unlockable',()=>{const {c}=setup();while(c.unlockNextCartoon());c.CARTOON_FOUND.firetruck=true;assert.equal(c.unlockNextCartoon().id,'firetruck');});
test('shelf hides reels without a clip, even if an old save unlocked them',()=>{const {c,nodes}=setup();c.profile.cartoonsUnlocked=['icecream','waterslide','firetruck'];c.lib={phase:'movies'};c.renderCartoonShelf();
 const grid=nodes.libChoices.children[0];assert.equal(grid.children.length,c.CARTOONS.filter(x=>x.ready).length);assert.ok(!/COMING SOON/i.test(JSON.stringify(nodes)));});
test('watch does not go fullscreen until the clip is playing',()=>{const {c,calls,listeners}=setup();c.lib={phase:'watch',watch:c.CARTOONS[0]};c.renderCartoonWatch();
 assert.equal(calls.fs,0);listeners.playing.forEach(f=>f());assert.equal(calls.fs,1);});
test('a missing clip never goes fullscreen',()=>{const {c,calls,listeners,video}=setup();c.lib={phase:'watch',watch:c.CARTOONS[0]};c.renderCartoonWatch();video.error={code:4};listeners.error.forEach(f=>f());(listeners.playing||[]).forEach(f=>f());assert.equal(calls.fs,0);});
test('opening a reel with no clip bounces back to the collection',()=>{const {c,calls}=setup();c.lib={phase:'watch',watch:c.CARTOONS.find(x=>!x.ready)};c.renderCartoonWatch();assert.equal(c.lib.phase,'movies');assert.equal(calls.fs,0);});
test('back to collection always leaves the player',()=>{const {c,nodes}=setup();c.lib={phase:'watch',watch:c.CARTOONS[0]};c.renderCartoonWatch();const back=nodes.libChoices.children[0];back.onclick();assert.equal(c.lib.phase,'movies');});
console.log(`${passed} passed; ${failures.length} failed`);if(failures.length)process.exitCode=1;
