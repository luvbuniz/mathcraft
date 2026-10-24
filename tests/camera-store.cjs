// Pip QA P0-4 / P0-5 + tablet retest rt25–rt29, rt43–rt48: camera never shows the inside of the
// hero, "Behind me" is honoured indoors, Stack Feed has a big Exit button.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
function fn(n){const a=s.indexOf('function '+n+'(');assert(a>=0,n);return s.slice(a,s.indexOf('\n}',a)+2);}
// PR #495 retest: when the camera is closer than ~1 m the hero is drawn SEE-THROUGH (never vanishes),
// with faded copies of its materials; the originals are back right after the draw
const draws=[];const mat={opacity:1,color:{copy(){}},visible:true,clone(){return {color:{copy(){}},opacity:1};}};
const mesh={isMesh:true,material:mat};const av={visible:true,traverse(fn){fn(mesh);}};
const c=vm.createContext({CAM_HIDE_DIST:1.0,HERO_FADE_OPACITY:0.35,_heroFadeMats:new WeakMap(),G:{firstPerson:false,birdsEye:false},player:{avatar:av,pos:{x:0,y:0,z:0},driving:null},
  camera:{position:{x:0,y:1.6,z:0.6}},renderer:{render(){draws.push({vis:av.visible,op:mesh.material.opacity,tr:!!mesh.material.transparent,same:mesh.material===mat});}},scene:{}});
vm.runInContext(fn('heroFadeMat')+fn('renderMainView'),c);
c.renderMainView();assert.equal(draws[0].vis,true,'hero still drawn up close');assert.equal(draws[0].same,false);assert(draws[0].tr&&Math.abs(draws[0].op-0.35)<1e-9,'drawn see-through');
assert.equal(mesh.material,mat,'original material restored');assert.equal(mat.opacity,1,'shared material untouched');assert.equal(c.G._heroFaded,true);
c.camera.position={x:0,y:3,z:4};c.renderMainView();assert(draws[1].same&&draws[1].vis,'normal distance draws the hero as is');assert.equal(c.G._heroFaded,false,'no fade state left over');
assert(!/av\.visible = false/.test(fn('renderMainView')),'hero is never hidden by the camera');
// blocked camera swings around the hero (and lifts a little) instead of parking in it; lifted views aim at the hero
assert(/CAM_SWING_YAWS = \[0, 0\.45, -0\.45, 0\.9, -0\.9, 1\.35, -1\.35\]/.test(s)&&/CAM_SWING_LIFTS = \[0, 0\.5, 0\.9\]/.test(s));
assert(s.includes('if (_sw) look.lerp('),'lifted camera looks at the hero');
assert(s.includes('player._camSwing = null; player._feedExitHush = false;'),'fresh camera state on start/Continue');
// "Behind me" sticks, and the auto first-person indoors respects it
assert(/G\.keepThird = mode === 'third';/.test(s),'menu Behind me remembered');
assert(s.includes("if (inside && allowed < 1.0 && !G.birdsEye && !G.keepThird && !inStore) {"),'store never forces first-person');
assert(!s.includes('if (inside && allowed < 2.6 && !G.birdsEye) {'),'old forced first-person rule gone');
// shop zone no longer pins the camera when you're standing in it
assert(s.includes('const zoneOk = !inShopZone(Math.floor(head.x), Math.floor(head.z));'));
// Exit button
const ex=fn('storeExitBtn');assert(/min-height:64px/.test(ex)&&/min-width:200px/.test(ex),'Exit is a big target');
const d=vm.createContext({G:{world:'meadow'},FEED_WALL:{x0:2,x1:10,z0:-19,z1:-12},_autoInterior:false,
  player:{pos:{x:6.5,y:0,z:-15,set(a,b,c){this.x=a;this.y=b;this.z=c;}},vel:{set(){}},yaw:2,camYaw:2},$:()=>null,camIcon:()=>'',Sound:{click(){}}});
vm.runInContext(fn('insideFeedStore')+fn('storeEntryCheck').replace(/storeExitBtn\(\)/,'({style:{}})')+fn('exitFeedStore'),d);
d.storeEntryCheck(true);assert.equal(d.player.yaw,0,'walking in faces the shelves');
d.exitFeedStore();assert(!d.insideFeedStore(d.player.pos.x,d.player.pos.z),'Exit puts you outside');assert.equal(d.player.yaw,Math.PI,'facing out');
assert(d.player.pos.z>=-12+4,'Exit leaves room for the camera behind');assert.equal(d.player._feedExitHush,true,'door prompt hushed after Exit');
const h=vm.createContext({G:{world:'meadow'},player:{_feedExitHush:true,pos:{x:6.5,z:-7.8}}});vm.runInContext(fn('feedExitHushed')+fn('feedDoorDist'),h);
assert.equal(h.feedExitHushed(),true,'still hushed near the door');h.player.pos.z=-5;assert.equal(h.feedExitHushed(),false,'prompt back once you walk away');
console.log('PASS hero see-through (never hidden) when camera <1 m, blocked camera swings, Exit hushes the door prompt, Behind me honoured indoors, store faces shelves, big Exit button works');
