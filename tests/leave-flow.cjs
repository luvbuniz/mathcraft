const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
function fn(name){const a=s.indexOf('function '+name+'(');return s.slice(a,s.indexOf('\n}',a)+2);}
function fixture(result=true){
  const nodes={},queue=[],counts={save:0,reset:0,home:0};
  const document={activeElement:null,exitPointerLock(){}};
  const $=id=>nodes[id]||(nodes[id]={style:{display:'none'},disabled:false,hidden:false,textContent:'',isConnected:true,focus(){document.activeElement=this;}});
  document.activeElement=$('leaveBtn');
  const G={running:true,over:false,playerName:'Leave QA',world:'city'};
  const c=vm.createContext({$,document,G,console,keys:{KeyW:true},touch:{joyX:1,joyY:1,jump:true},popupOpen:false,
    requestAnimationFrame:f=>queue.push(f),setTimeout:f=>queue.push(f),
    saveGame(){counts.save++;if(result instanceof Error)throw result;return result;},
    closeLeoIntro(){},hideBridgeOffer(){},clearNpcs(){},updateRotateGate(){},
    resetWorld(){counts.reset++;},refreshSavedList(){counts.home++;},syncGloomyMenu(){},
    showSetupScreen(){},syncWorldPicker(){},selectedSetupWorld(){return 'meadow';}});
  vm.runInContext(s.slice(s.indexOf('let leaveBusy ='),s.indexOf('// 🆘 free a player')),c);
  return {c,$,G,counts,flush(){while(queue.length)queue.shift()();}};
}
{
 const f=fixture();f.c.requestLeave();f.c.requestLeave();
 assert.equal(f.$('leavePopup').style.display,'flex');assert.equal(f.counts.save,0);
 assert.equal(f.c.keys.KeyW,false);assert.equal(f.c.touch.jump,false);
 f.c.cancelLeave();assert(f.G.running);assert.equal(f.counts.reset,0);assert.equal(f.c.popupOpen,false);
 f.c.popupOpen=true;f.c.requestLeave();f.c.cancelLeave();assert.equal(f.c.popupOpen,true,'keep playing restores an underlying popup');
}
{
 const f=fixture();f.c.requestLeave();f.c.confirmLeave();f.c.confirmLeave();f.c.cancelLeave();
 assert.equal(f.$('leaveSaveBtn').textContent,'Saving…');assert(f.$('leaveStayBtn').disabled);
 f.flush();assert.equal(f.counts.save,1);assert.equal(f.counts.reset,1);assert.equal(f.counts.home,1);
 assert.equal(f.G.running,false);assert.equal(f.$('startScreen').style.display,'flex');
 assert.equal(f.$('leaveSavedNotice').hidden,false);f.c.confirmLeave();f.flush();assert.equal(f.counts.save,1);
}
for(const result of [false,new Error('quota')]){
 const f=fixture(result);f.c.requestLeave();f.c.confirmLeave();f.flush();
 assert(f.G.running);assert.equal(f.counts.reset,0);assert.equal(f.counts.home,0);
 assert.equal(f.$('leavePopup').style.display,'flex');assert(!f.$('leaveSaveBtn').disabled);
 assert(f.$('leaveStatus').textContent.includes('couldn’t save'));
 f.c.saveGame=()=>{f.counts.save++;return true;};f.c.confirmLeave();f.flush();assert(!f.G.running);assert.equal(f.counts.reset,1);
}
// Exercise the real local-save functions, including storage denial and profile failures.
for(const failure of ['none','world','profile','memory']){
 const stored=new Map(),profile={packMigrated:true};let cloud=0;
 const LS={blocked:failure==='memory',setItem(k,v){if((failure==='world'&&k==='world')||(failure==='profile'&&k==='profile'))throw Error('storage full');stored.set(k,v);}};
 const c=vm.createContext({LS,profile,profileDirty:false,G:{playerName:'Save QA',world:'city',blocks:5,coins:7,furniture:{bird:4},homes:[{id:'pink'}],npcHomes:{spark:[1,2]}},
   player:{pos:{x:3,y:4,z:5}},placedFood:[{x:1,z:2,kind:'bird',petName:'Fluffy',variant:3,bond:50}],
   saveKey:()=> 'world',profileKey:()=> 'profile',serializeWorld:()=>[[1,0,1,'pink']],serializeFloors:()=>[[1,1,0,0]],syncPetState(){},cloudSyncUp(){cloud++;}});
 vm.runInContext(['saveProfile','packSnapshot','persistPack','saveGame'].map(fn).join('\n'),c);
 assert.equal(c.saveGame(),failure==='none',failure);
 if(failure==='none'){
   const saved=JSON.parse(stored.get('world'));assert.equal(saved.foods[0][6],'Fluffy');
   assert.deepEqual(saved.pos,[3,4,5]);assert.deepEqual(saved.homes,[{id:'pink'}]);
   assert.equal(JSON.parse(stored.get('profile')).pack.furniture.bird,4);assert(cloud>0);
 }else assert.equal(cloud,0,'failed durable save does not schedule cloud success');
}
assert(!s.includes('leaveArmedUntil'));
assert(s.includes("$w('homeBtn').onclick = () => { Sound.click(); requestLeave(); }"));
assert(s.includes("$w('leaveBtn').onclick = () => { Sound.click(); requestLeave(); }"));
console.log('PASS visible confirmation; cancellation; repeat taps; save once before reset; failed-save retry; world/profile/storage-denial checks; pets, homes and position retained.');
