// Pip retest rt16/rt24: after "Reading Level up — now Level 3" the HUD pill must say Level 3 in Reading Town.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const fn=n=>{const a=s.indexOf('function '+n+'(');assert(a>=0,n);return s.slice(a,s.indexOf('\n}',a)+2);};
const c=vm.createContext({G:{readLevel:3,grade:2},profile:{stars:0,readLevel:2},W:{subject:'reading'}});
vm.runInContext('function curWorld(){return W;}function levelFromScore(x){return 1+Math.floor(x/100);}'+fn('hudLevelText'),c);
assert.equal(c.hudLevelText(),'📖 Reading Level 3','Reading Town shows the reading level');
c.G.readLevel=null;assert.equal(c.hudLevelText(),'📖 Reading Level 2','falls back to the saved reading level before the library opens');
c.W.subject='math';c.profile.stars=150;assert.equal(c.hudLevelText(),'⭐ Level 2','Math Meadow keeps the star level');
assert.equal((s.match(/curWorld\(\)\.name \+ ' • ' \+ hudLevelText\(\)/g)||[]).length,2,'both HUD label writers use it');
assert(!/• ⭐ Level ' \+ levelFromScore/.test(s),'no stale star-level writer left');
const fin=fn('finishLib');const a=fin.indexOf('profile.readLevel = G.readLevel');assert(a>0);assert(/if \(levelMsg\) \{ refreshHUD\(\);/.test(fin.slice(a)),'refresh after the level changes');
console.log('PASS HUD pill shows the reading level in Reading Town and refreshes on level up');
