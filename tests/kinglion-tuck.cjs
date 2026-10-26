// node tests/kinglion-tuck.cjs — on phones King Lion only shows while talking; tablets keep the head
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const cut=(a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);};
const code=cut('function showCoachLine(','function coachPulseUse(')+cut('function lionCoachTick()','function lionCoachEvent(');
function el(){return {hidden:true,textContent:'',classList:{_s:new Set(),toggle(k,on){on?this._s.add(k):this._s.delete(k);},add(k){this._s.add(k);},remove(k){this._s.delete(k);}},offsetWidth:1};}
function ctx(phone){
  const els={lionCoach:el(),lionCoachBubble:el(),lionCoachText:el(),lionCoachProg:el()};
  const timers=[];const c=vm.createContext({$:id=>els[id],isPhone:()=>phone,lionText:k=>'line '+k,lionCoach:null,popupOpen:false,G:{running:true,over:false},
    Narrator:{speaking:false},performance:{now:()=>0},nearestStation:()=>({st:null,dist:99}),ensureCoachBeacon:()=>({}),coachBeacon:null,setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length;},clearTimeout:()=>{},console});
  vm.runInContext(code+';var _set=v=>{lionCoach=v};',c);return {c,els,timers};
}
// phone, coach running: shows while talking, tucks after, never mid-sentence
{const {c,els,timers}=ctx(true);c._set({stage:'go'});
 c.lionCoachTick();assert.equal(els.lionCoach.hidden,true,'phone: no idle bubble over the TRAVEL sign');
 c.showCoachLine('go_block');c.lionCoachTick();assert.equal(els.lionCoach.hidden,false,'phone: shows while he talks');
 const t=timers.pop();assert(t.ms>=7000,'stays up at least 7 s');
 c.Narrator.speaking=true;t.f();assert.equal(els.lionCoachBubble.hidden,false,'not cut off mid-sentence');
 c.Narrator.speaking=false;timers.pop().f();c.lionCoachTick();assert.equal(els.lionCoach.hidden,true,'phone: tucks away when done');
 c.popupOpen=true;c.lionCoachTick();assert.equal(els.lionCoach.hidden,false,'popup mini head unchanged');}
// tablet/desktop: head stays as a help button, coach line stays up
{const {c,els,timers}=ctx(false);c._set({stage:'go'});
 c.lionCoachTick();assert.equal(els.lionCoach.hidden,false,'tablet: head always there');
 c.showCoachLine('go_block');assert.equal(timers.length,0,'tablet: coach line not auto-hidden');}
assert(/lionTuck\(\) \? \[\['lionCoachHead', '🦁'/.test(s),'☰ menu offers Ask King Lion on phones');
assert(s.includes('id="lionCoach"')&&s.includes('kinglion.webp'),'King Lion still there');
console.log(JSON.stringify({pass:true,phoneTalkOnly:true,tabletUnchanged:true,menuRow:true}));
