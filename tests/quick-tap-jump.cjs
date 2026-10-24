// Ticket C: a quick Jump tap (press+release before the next frame) must still jump — exactly once.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const a=s.indexOf('function wantJumpNow(');assert(a>=0,'wantJumpNow');
const c=vm.createContext({});vm.runInContext(s.slice(a,s.indexOf('\n}',a)+2),c);
const W=c.wantJumpNow;
// simulate frames: each frame reads held/tap, jump spends the latch; one jump = leaves the ground for ~0.5 s
function run(events,{frames=60,dt=16,ground=true}={}){
  let tapAt=0,held=false,onGround=ground,air=ground?0:99,jumps=0;
  for(let f=0;f<frames;f++){const now=1000+f*dt;
    for(const e of events.filter(e=>e.f===f)){ if(e.down){held=true;tapAt=now-dt/2;} if(e.up)held=false; }
    const r=W(held,tapAt,onGround,now);tapAt=r.tapAt;
    if(r.jump){jumps++;onGround=false;air=30;} else if(!onGround&&--air<=0)onGround=true;
  }
  return jumps;
}
assert.equal(run([{f:5,down:1,up:1}]),1,'tap inside one frame jumps once');
assert.equal(run([{f:5,down:1},{f:6,up:1}]),1,'normal short tap jumps once');
assert.equal(run([{f:5,down:1,up:1},{f:5,down:1,up:1}]),1,'double-fired touchstart in one frame = one jump');
assert.equal(run([{f:5,down:1,up:1},{f:8,down:1,up:1}]),1,'second tap mid-air does not double-jump');
assert.equal(run([{f:2,down:1,up:1}],{ground:false,frames:4}),0,'tap in the air: no jump while airborne');
// stale tap never fires a surprise jump
assert.deepEqual({...W(false,1000,false,1300)},{jump:false,tapAt:0},'old mid-air tap expires');
assert.deepEqual({...W(false,1000,true,1400)},{jump:true,tapAt:0},'slow frame: tap still read by the next step on the ground');
assert.deepEqual({...W(false,1000,false,1100)},{jump:false,tapAt:1000},'fresh tap mid-air is kept briefly');
assert.equal(W(false,1000,true,1120).jump,true,'tap just before landing jumps on touchdown');
assert.equal(W(true,0,true,5000).jump,true,'holding still jumps (unchanged)');
assert(/touch\.jumpTapAt = performance\.now\(\)/.test(s),'Jump button latches the press');
console.log('PASS quick Jump taps are latched: one tap = one jump, no double jumps, no stale jumps');
