// 🦁 King Lion intro backdrop (Amy, tablet): the world + HUD are covered, paused and inert while the intro is up,
// and everything (inert flags, focus, the render loop, the idle ❓ arrow) comes back exactly as it was on close.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'..','play.html'),'utf8');
function extract(name){const a=s.indexOf('function '+name+'(');assert(a>=0,'missing '+name);return s.slice(a,s.indexOf('\n}',a)+2);}
function setup(){
  const timers=[],calls={world:0,backdrop:0,guide:0,qhint:0,coach:0,seen:0};
  const el=(id,tag='DIV',vis=true)=>({id,tagName:tag,inert:false,hidden:false,isConnected:true,style:{},classList:{add(){},remove(){}},
    getClientRects(){return vis?[1]:[];},closest(sel){return sel==='[inert]'&&(this.inert||(this.parent&&this.parent.inert))?this:null;},focus(){doc.activeElement=this;}});
  const ids={};const mk=(id,tag,vis)=>(ids[id]=el(id,tag,vis));
  const hud=mk('hud'),touch=mk('touchUI'),intro=mk('leoIntro'),menu=mk('menuBtn','BUTTON'),next=mk('leoNext','BUTTON'),arrow=mk('qHintArrow'),already=mk('grownupPopup'),script=mk('s','SCRIPT');
  const canvas=el('world3d','CANVAS');already.inert=true;menu.parent=hud;next.parent=intro;
  const useBtn=mk('btnAction','BUTTON');useBtn.parent=touch;
  const cls=new Set();
  const doc={activeElement:null,body:{children:[hud,touch,canvas,intro,arrow,already,script],classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c)}}};
  doc.activeElement=doc.body;
  const c=vm.createContext({document:doc,$:id=>ids[id],renderer:{domElement:canvas,getScissorTest:()=>false,setScissorTest(){},render(sc){if(sc==='world')calls.world++;else calls.backdrop++;}},
    scene:'world',camera:{},G:{running:true,world:'meadow'},player:{pos:{x:0,z:0}},keys:{w:true},popupOpen:false,qHint:null,
    Narrator:{stop(){}},hideGuideCaption(){},startQHint(){calls.qhint++;},markIntroSeen(){calls.seen++;},startLionCoach(){calls.coach++;},
    lionWelcomeKey:()=>'welcome_meadow',prepareGuideView(){},renderLeoIntro(){},drawGuide(){calls.guide++;},clearTimeout(){},
    setTimeout(f){timers.push(f);},
    THREE:{Scene:function(){},Camera:function(){},CanvasTexture:function(){}},
    Math,Set,console});
  // the canvas gradient for the backdrop texture
  doc.createElement=()=>({getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),fillRect(){}})});
  vm.runInContext('let leoIntro=null,introBackdrop=null;const INTRO_FRAME_MS=33;'+['openLeoIntro','coverForIntro','uncoverAfterIntro','closeLeoIntro','drawIntroBackdrop','introFrame'].map(extract).join('\n')+
    ';this.get=()=>leoIntro;this.popup=()=>popupOpen;',c);
  return {c,ids,canvas,already,script,calls,timers,cls,doc,flush(){timers.splice(0).forEach(f=>f());}};
}
let n=0;const t=(name,fn)=>{fn();n++;console.log('PASS '+name);};
t('open covers everything behind the intro and focuses Next',()=>{const f=setup();f.ids.btnAction.focus();
  f.c.openLeoIntro(true);
  assert(f.cls.has('guideOpen'));assert.equal(f.ids.leoIntro.style.display,'flex');
  assert(f.ids.hud.inert&&f.ids.touchUI.inert&&f.ids.qHintArrow.inert,'HUD, touch controls and the arrow are inert (not tappable / tabbable)');
  assert(!f.ids.leoIntro.inert&&!f.canvas.inert,'the intro card and the lion canvas stay live');
  assert(!f.script.inert);assert.equal(f.ids.qHintArrow.hidden,true,'idle arrow parked');
  assert.equal(f.doc.activeElement,f.ids.leoNext);assert.equal(f.c.keys.w,false);assert(f.c.popup());});
t('render loop during the intro: backdrop + lion only, never the world, ~30 fps',()=>{const f=setup();f.c.openLeoIntro(true);
  for(let ms=0;ms<1000;ms+=1000/60)f.c.introFrame(ms);
  assert.equal(f.calls.world,0,'3D world is not rendered under the backdrop');
  assert(f.calls.backdrop>=28&&f.calls.backdrop<=32,'throttled to ~30 fps, got '+f.calls.backdrop);assert.equal(f.calls.guide,f.calls.backdrop);});
for(const [how,end] of [['Skip',c=>c.closeLeoIntro(true)],['Next on the last step',c=>{c.get().i=2;c.closeLeoIntro(false);}],['auto-advance',c=>c.closeLeoIntro(false)]])
  t('close by '+how+' restores inert flags, focus and the idle arrow',()=>{const f=setup();f.ids.btnAction.focus();f.c.openLeoIntro(true);end(f.c);
    assert(!f.cls.has('guideOpen'));assert.equal(f.ids.leoIntro.style.display,'none');assert.equal(f.c.get(),null);assert(!f.c.popup());
    assert(!f.ids.hud.inert&&!f.ids.touchUI.inert&&!f.ids.qHintArrow.inert,'covered elements are live again');
    assert.equal(f.already.inert,true,'an element that was already inert stays inert');
    assert.equal(f.doc.activeElement,f.ids.btnAction,'focus goes back where it was');
    f.flush();assert.equal(f.calls.qhint,1,'idle ❓ arrow timer restarts after the intro');});
t('focus falls back to ☰ when the old focus is gone or hidden',()=>{const f=setup();f.c.openLeoIntro(true);f.c.closeLeoIntro(true);assert.equal(f.doc.activeElement,f.ids.menuBtn);});
// wiring in the real page
assert(/if \(leoIntro\) \{ introFrame\(now\); return; \}/.test(s),'the game loop hands the frame to the intro (world paused)');
assert(/body\.guideOpen > #world3d \{ z-index:95 !important; \}/.test(s)&&/body\.guideOpen #leoIntro \{ z-index:96; \}/.test(s),'canvas backdrop sits above every HUD layer, the card above it');
assert(/renderer\.domElement\.id = 'world3d';/.test(s));
assert(/body\.guideOpen #hud, body\.guideOpen #hud \*, body\.guideOpen #touchUI/.test(s),'HUD and touch controls hidden while the intro is up');
console.log('intro-backdrop ok ('+n+')');
