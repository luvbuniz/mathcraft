// 👆 Tablet touch HUD (UI step 7a): big, few, well-spaced actions; nothing a tablet player
// needs is left only on a hidden button; touch players never read keyboard words.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const a=s.indexOf('/* 👆 Tablet touch HUD'); assert(a>0,'touch HUD block present');
const css=s.slice(a,s.indexOf('</style>',a));
assert(css.lastIndexOf('</style>')<0);
const rule=sel=>{const m=css.match(new RegExp('body\\.touchHud '+sel.replace(/[#.]/g,'\\$&')+' \\{([^}]*)\\}'));assert(m,'rule for '+sel);return m[1];};
const px=(r,k)=>{const m=r.match(new RegExp('(?:^|[;\\s])'+k+':(\\d+)px'));return m?+m[1]:null;};
const box=sel=>{const r=rule(sel);return {w:px(r,'width'),h:px(r,'height'),right:px(r,'right'),bottom:px(r,'bottom'),top:px(r,'top')};};
const use=box('#btnAction'),jump=box('#btnJump'),undo=box('#btnUndoTouch'),menu=box('#menuBtn');
assert.deepEqual([use.w,use.h],[120,96],'USE 120×96');
assert.deepEqual([jump.w,jump.h],[80,80],'Jump 80×80');
assert.deepEqual([undo.w,undo.h],[64,64],'Undo 64×64');
assert.deepEqual([menu.w,menu.h],[56,56],'☰ 56×56');
// primary ≥64, secondary ≥48
for(const b of [use,jump,undo]) assert(Math.min(b.w,b.h)>=64);
assert(Math.min(menu.w,menu.h)>=48);
// layout: Jump sits above USE, Undo to USE's left, every gap ≥ 8dp
assert(jump.bottom-(use.bottom+use.h)>=8,'Jump/USE gap');
assert(undo.right-(use.right+use.w)>=8,'Undo/USE gap');
assert(Math.abs((jump.right+jump.w/2)-(use.right+use.w/2))<1,'Jump centred over USE');
// Leave, camera, badges leave the HUD on tablets … and are all reachable from ☰
assert(/body\.touchHud #leaveBtn, body\.touchHud #camBtn, body\.touchHud #badgeBtn \{ display:none !important; \}/.test(css));
assert(/@media \(min-width:560px\) and \(min-height:560px\)/.test(css),'phones keep their compact layout');
const om=s.slice(s.indexOf('function openHudMenu('),s.indexOf('\n}',s.indexOf('function openHudMenu('))+2);
assert(om.includes("['camBtn', '🎥'"),'☰ has Camera view on touch');
assert(om.includes("['badgeBtn'")&&om.includes("['homeBtn'"),'☰ has badges and Save & go home');
assert(s.includes("(_cb.offsetParent ? _cb : $('menuBtn')).getBoundingClientRect()"),'camera menu anchors to ☰ when 🧍 is hidden');
assert(s.includes("if (isTouch) document.body.classList.add('touchHud');"));
// accessible names survive the icon-only Undo
assert(s.includes('id="btnUndoTouch" aria-label="Undo"')&&s.includes('id="btnAction" aria-label="Use"'));
// touch wording: every toast that mentions WASD has a touch branch first
for(const key of ["'🧱 Build mode — tap places a block. Drag anywhere to move.'","'🧱 Building — tap places a block. Drag anywhere to move.'","Tap ☰ → 🏠 Save & go home"]) assert(s.includes(key),key);
assert(!/joystick/.test(s.match(/toast\(isTouch\s*\n\s*\? '🌈 Calm mode![^\n]*/)[0]));
console.log('touch-hud: ok');
