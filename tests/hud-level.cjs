// Pip retest rt16/rt24: after "Reading Level up — now Level 3" the HUD pill must say Level 3 in Reading Town.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const fn=n=>{const a=s.indexOf('function '+n+'(');assert(a>=0,n);return s.slice(a,s.indexOf('\n}',a)+2);};
const c=vm.createContext({G:{readLevel:3,grade:2},profile:{stars:0,readLevel:2},W:{subject:'reading'}});
vm.runInContext('function curWorld(){return W;}function levelFromScore(x){return 1+Math.floor(x/100);}'+fn('hudLevelText'),c);
assert.equal(c.hudLevelText(),'📖 Level 3','Reading Town shows the reading level');
c.G.readLevel=null;assert.equal(c.hudLevelText(),'📖 Level 2','falls back to the saved reading level before the library opens');
c.W.subject='math';c.profile.stars=150;assert.equal(c.hudLevelText(),'⭐ Level 2','Math Meadow keeps the star level');
assert.equal((s.match(/curWorld\(\)\.name \+ ' • ' \+ hudLevelText\(\)/g)||[]).length,2,'both HUD label writers use it');
assert(!/• ⭐ Level ' \+ levelFromScore/.test(s),'no stale star-level writer left');
const fin=fn('finishLib');const a=fin.indexOf('profile.readLevel = G.readLevel');assert(a>0);assert(/if \(levelMsg\) \{ refreshHUD\(\);/.test(fin.slice(a)),'refresh after the level changes');
// PR #500 retest: the Continue card shows the same Reading Level as the pill (not "Grade 2")
{ const store={'p:Mia':JSON.stringify({badges:[],readLevel:3})};
  const d=vm.createContext({LS:{getItem:k=>store[k]??null},profileKey:n=>'p:'+n});vm.runInContext(fn('saveLevelLabel'),d);
  assert.equal(d.saveLevelLabel({name:'Mia',grade:2},{subject:'reading'}),'📖 Reading Level 3','card matches the pill');
  assert.equal(d.saveLevelLabel({name:'Zed',grade:2},{subject:'reading'}),'📖 Reading Level 2','same fallback as the pill');
  assert.equal(d.saveLevelLabel({name:'Mia',grade:4},{subject:'math'}),'Grade 4','other worlds keep Grade');
  assert(s.includes("w.name + ' • ' + saveLevelLabel(s, w)"),'used by the saved-games list'); }
console.log('PASS HUD pill shows the reading level in Reading Town and refreshes on level up; Continue card shows the same Reading Level');
