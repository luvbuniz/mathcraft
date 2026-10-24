// 👆 Touch-first detection + hint copy (Amy, Oct 24: no WASD/keyboard copy on anything tablet-like).
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const vd=fs.readFileSync(path.join(__dirname,'../arcade/voiddrift.html'),'utf8');
const a=s.indexOf('/*TOUCH_FIRST_START*/'),b=s.indexOf('/*TOUCH_FIRST_END*/');
assert(a>0&&b>a,'touch-first block lives in <head>');
const block=s.slice(a,b);
function boot({coarse=false,hover=false,touchPoints=0,noMM=false}){
  const cls=new Set();
  const win={navigator:{maxTouchPoints:touchPoints},
    matchMedia:noMM?undefined:(q=>({matches:q==='(pointer: coarse)'?coarse:q==='(hover: hover)'?hover:false}))};
  const ctx=vm.createContext({window:win,document:{documentElement:{classList:{toggle(c,on){on?cls.add(c):cls.delete(c);}}}}});
  vm.runInContext(block+';this.TF=touchFirst;this.kb=kbOr;this.detect=detectTouchFirst;',ctx);
  return {tf:ctx.TF,kb:ctx.kb,cls,detect:ctx.detect};
}
const cases=[
  ['iPad / Android tablet',{coarse:true,hover:false,touchPoints:5},true],
  ['phone',{coarse:true,hover:false,touchPoints:5},true],
  ['iPad + Magic Keyboard trackpad (primary still coarse)',{coarse:true,hover:true,touchPoints:5},true],
  ['touch, no hover, odd browser without coarse',{coarse:false,hover:false,touchPoints:10},true],
  ['desktop with mouse',{coarse:false,hover:true,touchPoints:0},false],
  ['touch laptop with mouse/trackpad',{coarse:false,hover:true,touchPoints:10},false],
  ['no matchMedia but touch points',{noMM:true,touchPoints:5},true],
  ['no matchMedia, no touch',{noMM:true,touchPoints:0},false],
];
for(const [name,env,want] of cases){
  const r=boot(env);
  assert.equal(r.tf,want,name);
  assert.equal(r.cls.has('touchFirst'),want,name+' html class');
}
console.log('PASS detectTouchFirst: tablets/phones touch-first, desktops + touch laptops with a mouse keep keyboard hints');
// kbOr picks the right copy
assert.equal(boot({coarse:true,touchPoints:5}).kb('press L','tap ⭐ USE'),'tap ⭐ USE');
assert.equal(boot({hover:true}).kb('press L','tap ⭐ USE'),'press L');
// _useTxt / lionText follow touchFirst
function fn(n){const i=s.indexOf('function '+n+'(');return s.slice(i,s.indexOf('\n}',i)+2);}
const useTxt=fn('_useTxt').split('\n')[0];
for(const tf of [true,false]){
  const c=vm.createContext({touchFirst:tf,isTouch:true,LION_LINES:{go_block:{text:'Drag to walk to the ❓ box!'},at_block:{text:'Tap ⭐ USE!'},build:{text:'Tap the grass!'}}});
  vm.runInContext(useTxt+'\n'+fn('lionText'),c);
  const u=c._useTxt('to open Stack Mart!','to open Stack Mart!'), g=c.lionText('go_block'), at=c.lionText('at_block');
  const kbd=/WASD|arrow keys|\(or E\)|\bE key\b|press [A-Z]\b/i;
  if(tf){ assert(!kbd.test(u+g+at),'touch copy has no keys: '+u+' | '+g+' | '+at); assert(/Tap/.test(u)); }
  else { assert(/\(or E\)/.test(u)); assert(/WASD/.test(g)); }
}
console.log('PASS USE hint + coach lines: touch wording on tablets, keyboard wording on desktop (even a touch laptop)');
// Static audit: every keyboard hint in kid-facing copy is desktop-gated.
const KEYHINT=/WASD|[Aa]rrow keys|\b[Pp]ress [A-Z]\b|\(or [A-Z]\)|\(E\)|\(E key\)|Space \/ N/;
const allowed=/kbOr\(|touchFirst|kbdOnly|e\.code|^\s*(\/\/|\/\*|\*)|!isTouch && G\.buildMode/;
const desktopOnlyFns=['freeMouse','syncMouseWalkUI','lionText'];  // early-return / desktop-only legend / checked above
const lines=s.split('\n'); const bad=[];
let inDesk=null;
lines.forEach((ln,i)=>{
  const m=ln.match(/^function (\w+)\(/); if(m) inDesk=desktopOnlyFns.includes(m[1])?m[1]:null;
  const code=ln.replace(/\s\/\/.*$/,'');
  if(!/['"`>]/.test(code)) return;                 // comment prose, not copy
  if(!KEYHINT.test(code)||allowed.test(code)||inDesk) return;
  if(/title="[^"]*\((?:[A-Z]|[A-Z] key|Space \/ N)\)"/.test(ln)) return;   // tooltips are stripped on touch-first at boot
  if(/<span class="kbd">|Move with the arrow keys \/ WASD\.<\/p>/.test(ln)) return;   // inside <div class="kbdOnly">
  if(/\.textContent = '🧱 Click places a block • WASD/.test(ln)) return;             // under !isTouch (mouse build)
  if(/TOUCH_FIRST|shouldn't be on anything/.test(ln)) return;
  bad.push((i+1)+': '+ln.trim().slice(0,140));
});
assert.deepEqual(bad,[],'ungated keyboard hints:\n'+bad.join('\n'));
assert(/<div class="kbdOnly">\s*\n\s*<span class="kbd">Arrows<\/span>/.test(s),'help-screen key legend is desktop only');
assert(/el\.title = el\.title\.replace\(/.test(s),'tooltips drop key names on touch-first');
console.log('PASS every WASD / arrow / press-key hint in play.html is desktop-gated');
// Void Drift arcade: tap prompts + tap to launch/reboot on touch
assert(/say\('PRESS SPACE TO REBOOT', 'TAP TO REBOOT'\)/.test(vd));
assert(/overlay\.addEventListener\('pointerdown'/.test(vd),'tap restarts a lost Void Drift run');
console.log('PASS Void Drift says TAP and restarts on tap on touch-first devices');
