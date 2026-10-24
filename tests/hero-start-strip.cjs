// 🦸 Hero picker Start strip (UI step 7b / tablet QA av01): solid strip, big buttons, tapped card scrolls clear.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const a=s.indexOf('/* 🦸 Hero picker Start strip'); assert(a>0);
const css=s.slice(a,s.indexOf('</style>',a));
const nav=css.match(/#setupCard #screenHero \.stepNav \{([^}]*)\}/)[1];
assert(/position:sticky/.test(nav)&&/bottom:0/.test(nav),'pinned strip');
assert(/background:#fff/.test(nav)&&!/gradient/.test(nav),'solid, no see-through fade');
assert(/#screenHero \.stepNav \.btn \{ min-height:64px; \}/.test(css),'buttons ≥64 tall');
assert(/#screenHero #startBtn \{ min-width:240px;/.test(css),'Start ≥240 wide');
const m=css.match(/scroll-margin-bottom:(\d+)px/); assert(m&&+m[1]>=104,'card scroll margin clears the strip');
assert(s.includes("card.scrollIntoView({ block: 'nearest' })"),'tapped card scrolls into view');
// touch: keyboard tips hidden, tablet tip kept
assert(/@media \(hover:none\) and \(pointer:coarse\) \{\s*#setupCard \.howtoBody \.deskOnly/.test(css));
assert(s.includes('<span class="deskOnly"><span class="kbd">Arrows</span>'));
assert(/<p><b>Phone or tablet:<\/b>/.test(s),'tablet tip not hidden');
console.log('hero-start-strip: ok');
