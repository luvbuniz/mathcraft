// Pip QA P0-6: building walls are solid for walking; you can never get trapped inside one.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
function fn(n){const a=s.indexOf('function '+n+'(');assert(a>=0,n);return s.slice(a,s.indexOf('\n}',a)+2);}
const V=(x,y,z)=>({x,y,z,set(a,b,c){this.x=a;this.y=b;this.z=c;}});
const c=vm.createContext({G:{world:'meadow',homes:[]},FEED_WALL:{x0:2,x1:10,z0:-19,z1:-12},FAIR_POS:{x:26,z:-20},homeLotAt:()=>-1,
  performance:{now:()=>0},camBlockersWorld:'meadow',camBlockersAt:0,rebuildCamBlockers(){},
  player:{pos:V(-1,0,0.5),vel:V(0,0,0),width:.6,height:1.7,driving:null,_wasGrounded:true},
  solidAt:()=>false,walkStairSurface:()=>null,feedCeilingBlocks:()=>false});
vm.runInContext('var walkBlockers=[];'+['walkBlockerExcluded','ensureBlockers','walkBoxesHit','playerBlocked','collideAxis'].map(fn).join('\n')+'\nthis.setWB=a=>{walkBlockers=a;};',c);
// a thin shop wall from x 0..0.2 (inflated to 30 cm) standing on the ground, 2.4 m tall
c.setWB([{x0:-0.05,x1:0.25,z0:-2,z1:3,y0:0,y1:2.4,cx:.1,cz:.5,r:2.6}]);
const p=c.player;
for(let i=0;i<60;i++)c.collideAxis('x',0.05);
assert(p.pos.x+0.3<=-0.05+1e-9,'stops at the wall: '+p.pos.x);
assert.equal(p.pos.y,0,'no auto-step up and over a building wall');
// sliding along the wall still works
const z0=p.pos.z;for(let i=0;i<20;i++)c.collideAxis('z',0.05);assert(p.pos.z>z0+0.9,'slides along the wall');
// spawned overlapping a wall: can walk out either way, never stuck
p.pos.set(0.1,0,0.5);c.collideAxis('x',-0.05);assert(p.pos.x<0.1,'walks out of a wall it was placed in');
// driving ignores the boxes (cars have their own collision)
p.pos.set(-1,0,0.5);p.driving={};for(let i=0;i<60;i++)c.collideAxis('x',0.05);assert(p.pos.x>1,'cars unaffected');p.driving=null;
// walk-in places are not turned into walls
assert(c.walkBlockerExcluded(6,-15),'Stack Feed stays walk-in');assert(c.walkBlockerExcluded(26,-14),'fairground rides stay rideable');
assert(!c.walkBlockerExcluded(-21,-2),'Country Homes walls are solid');
c.G.world='city';assert(!c.walkBlockerExcluded(6,-15),'other worlds: no Stack Feed exemption');
console.log('PASS walls stop the hero, no step-over, sliding, never trapped, cars + walk-in places unaffected');
