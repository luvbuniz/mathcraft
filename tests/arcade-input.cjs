// Pip QA P1-2 / P1-3: Void Drift fire label matches the real state; no text selection or
// search sheet on game UI; a 600 ms tap guard after the game closes.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
function fn(n){const a=s.indexOf('function '+n+'(');assert(a>=0,n);return s.slice(a,s.indexOf('\n}',a)+2);}
let label='';const c=vm.createContext({voidAuto:false,voidFireTimer:null,voidSteerAt:0,voidFireUI:()=>{label=c.voidAuto?'AUTO':'manual';},setInterval:()=>1,clearInterval(){},performance:{now:()=>0},$:()=>null});
vm.runInContext('var voidAuto=false,voidFireTimer=null,voidSteerAt=0,voidFireUI=null;'+fn('setVoidAuto')+';this.setUI=f=>{voidFireUI=f;};this.get=()=>voidAuto;',c);
c.setUI(()=>{label=c.get()?'AUTO':'manual';});
c.setVoidAuto(false);assert.equal(label,'manual');c.setVoidAuto(true);assert.equal(label,'AUTO','label redrawn when auto-fire switches on at game start');
assert(/body \{ -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; \}/.test(s),'game UI: no selection / callout');
assert(/input, textarea, \[contenteditable="true"\] \{ -webkit-user-select:text; user-select:text;/.test(s),'typing boxes still selectable');
// tap guard swallows taps then removes itself
let removed=false,timer=null;const evs={};
const d=vm.createContext({document:{createElement:()=>({style:{},addEventListener(t,f){evs[t]=f;},remove(){removed=true;}}),body:{appendChild(){}}},setTimeout:(f,ms)=>{timer=ms;f();}});
vm.runInContext(fn('tapGuard'),d);d.tapGuard(600);assert.equal(timer,600);assert(evs.touchstart&&evs.click,'swallows touches and clicks');assert(removed,'removed after the guard time');
assert(s.includes('tapGuard(600);'),'used when Void Drift closes');
// PR #496 retest: the tip matches the mode — manual never says "Steer your ship to fire!"
for (const touch of [true,false]) {
  const tip={style:{},textContent:''};const e=vm.createContext({$:()=>tip,isTouch:touch,setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},performance:{now:()=>0}});
  vm.runInContext('var voidAuto=true,voidFireTimer=null,voidSteerAt=0,voidFireUI=null,voidTipT=null;const VOID_TIP_AUTO="🕹️ Steer your ship to fire!";'+fn('voidManualTip')+fn('setVoidAuto'),e);
  e.setVoidAuto(false);assert(!/Steer/.test(tip.textContent),'manual tip wording');assert(touch?/AUTO/.test(tip.textContent):/SPACE/.test(tip.textContent));assert.equal(tip.style.display,'block');
  e.setVoidAuto(true);assert.equal(tip.textContent,'🕹️ Steer your ship to fire!');assert.equal(tip.style.display,'none');
}
assert(/if \(hint\) \{ hint\.textContent = VOID_TIP_AUTO;/.test(s),'idle tip only in auto');
console.log('PASS fire label tracks auto-fire, no selection/callout on game UI, 600 ms tap guard, fire tip wording per mode');
