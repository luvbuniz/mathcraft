// Pip QA P0-4 / P0-5 + tablet retest rt25–rt29, rt43–rt48: camera never shows the inside of the
// hero, "Behind me" is honoured indoors, Stack Feed has a big Exit button.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
function fn(n){const a=s.indexOf('function '+n+'(');assert(a>=0,n);return s.slice(a,s.indexOf('\n}',a)+2);}
// hero is not drawn when the camera is closer than ~1 m, and visibility is restored after the draw
let drawnWith=[];const av={visible:true};
const c=vm.createContext({CAM_HIDE_DIST:1.0,G:{firstPerson:false,birdsEye:false},player:{avatar:av,pos:{x:0,y:0,z:0},driving:null},
  camera:{position:{x:0,y:1.6,z:0.6}},renderer:{render(){drawnWith.push(av.visible);}},scene:{}});
vm.runInContext(fn('renderMainView'),c);
c.renderMainView();assert.deepEqual([...drawnWith],[false]);assert.equal(av.visible,true,'restored after drawing');
c.camera.position={x:0,y:3,z:4};c.renderMainView();assert.equal(drawnWith[1],true,'normal distance draws the hero');
av.visible=false;c.camera.position={x:0,y:1.6,z:0.5};c.renderMainView();assert.equal(av.visible,false,'a hidden hero stays hidden');
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
console.log('PASS hero hidden when camera <1 m, Behind me honoured indoors, store faces shelves, big Exit button works');
