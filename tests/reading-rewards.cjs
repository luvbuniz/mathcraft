const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=process.env.READING_SOURCE||require('path').join(__dirname,'../play.html');
const s=fs.readFileSync(source,'utf8');
const names=['restoreReadingProgress','finishLib','finishBattle','libAnswer','finishSpell','spellAnswer','quizAnswer','finishWordQuiz','cinemaAnswer','finishCinema'];
function extract(name){const start=s.indexOf('function '+name+'(');if(start<0)return '';return s.slice(start,s.indexOf('\n}',start)+2);}
let passed=0;const failures=[];
function test(name,fn){try{fn();console.log('PASS '+name);passed++;}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name+': '+e.message);}}
function setup(){
 const nodes={},timers=[],counts={solve:0,wrong:0,practice:0,cartoon:0,render:0};
 const node=()=>({style:{},classList:{add(){}},innerHTML:'',textContent:'',appendChild(){},querySelectorAll(){return[];}});
 const $=id=>id==='cvid'?null:(nodes[id]||(nodes[id]=node()));
 const c=vm.createContext({$,document:{createElement:node},G:{coins:0,solved:0,grade:2,readLevel:2,spellLevel:2},profile:{},profileDirty:false,lib:null,spell:null,cinema:null,arcade:null,
  Sound:{correct(){},wrong(){},fanfare(){}},Narrator:{stop(){},cinemaLine(){},spellWord(){}},
  saveProfile(){},refreshHUD(){},bumpHud(){},awardToken(){},recordSolve(){counts.solve++;},recordWrong(){counts.wrong++;},recordPractice(){counts.practice++;},
  disableChoices(){},markCorrectChoice(){},deviceDef(){return null;},readLevelNow(){return c.G.readLevel;},
  unlockNextCartoon(){counts.cartoon++;return null;},closeLibrary(){c.lib=null;},openLibrary(){},closePost(){c.spell=null;},openPost(){},
  noteGrammarConcept(){},saveCinemaProgress(){},arcadeWallet(){},arcadeGameOver(){c.arcade.kind='over';},
  renderLib(){counts.render++;c.lib.attempted=false;},renderSpell(){counts.render++;c.spell.attempted=false;},renderScene(){counts.render++;c.cinema.attempted=false;},nextQuizQ(){counts.render++;},
  setTimeout(f){timers.push(f);},console});
 vm.runInContext(names.map(extract).join('\n'),c);
 return {c,nodes,timers,counts,btn:node(),flush(){const tasks=timers.splice(0);tasks.forEach(f=>f());}};
}
function book(c,right=4){c.lib={level:c.G.readLevel,qs:Array.from({length:4},()=>({g:2,a:'yes'})),qi:4,firstRight:right,right,story:{t:'QA story'}};}
function bee(c,right=5){c.spell={level:c.G.spellLevel,words:Array.from({length:5},()=>['cat','A cat.']),qi:5,firstRight:right,right};}
test('all-wrong library earns zero coins and no cartoon',()=>{const {c,counts}=setup();book(c,0);c.finishLib();assert.equal(c.G.coins,0);assert.equal(counts.cartoon,0);});
test('library payout and difficulty apply once',()=>{const {c}=setup();book(c);c.finishLib();const before=c.G.coins;c.finishLib();assert.equal(c.G.coins,before);assert.equal(c.G.readLevel,2);});
test('two perfect books level up across restart; cap five',()=>{const {c}=setup();book(c);c.finishLib();c.G.readLevel=null;c.G.readStreak=0;c.restoreReadingProgress('read');book(c);c.finishLib();assert.equal(c.G.readLevel,3);c.G.readLevel=5;book(c);c.finishLib();book(c);c.finishLib();assert.equal(c.G.readLevel,5);});
test('two difficult books ease level; floor one',()=>{const {c}=setup();book(c,1);c.finishLib();c.G.readLevel=null;c.restoreReadingProgress('read');book(c,1);c.finishLib();assert.equal(c.G.readLevel,1);book(c,0);c.finishLib();book(c,0);c.finishLib();assert.equal(c.G.readLevel,1);});
test('library one answer per question and no stale callback',()=>{const {c,btn,counts,flush}=setup();book(c);c.lib.qi=0;c.lib.firstRight=0;const q=c.lib.qs[0];c.libAnswer('no',q,btn);c.libAnswer('yes',q,btn);assert.equal(counts.solve,0);assert.equal(c.lib.qi,1);book(c);flush();assert.equal(counts.render,0);assert.equal(c.G.coins,0);});
test('all-wrong spelling zero coins; duplicate finish cannot pay',()=>{const {c}=setup();bee(c,0);c.finishSpell();assert.equal(c.G.coins,0);bee(c);c.finishSpell();const before=c.G.coins;c.finishSpell();assert.equal(c.G.coins,before);});
test('perfect spelling levels up; two strong rounds survive restart',()=>{const {c}=setup();bee(c);c.finishSpell();assert.equal(c.G.spellLevel,3);bee(c,4);c.finishSpell();c.G.spellLevel=null;c.G.spellStreak=0;c.restoreReadingProgress('spell');bee(c,4);c.finishSpell();assert.equal(c.G.spellLevel,4);c.G.spellLevel=5;bee(c);c.finishSpell();assert.equal(c.G.spellLevel,5);});
test('spelling struggles ease level across sessions',()=>{const {c}=setup();bee(c,1);c.finishSpell();c.G.spellLevel=null;c.restoreReadingProgress('spell');bee(c,2);c.finishSpell();assert.equal(c.G.spellLevel,1);});
test('spelling one answer; old timer cannot finish new round',()=>{const {c,btn,counts,flush}=setup();bee(c);c.spell.qi=0;c.spell.firstRight=0;c.spellAnswer('kat','cat',btn);c.spellAnswer('cat','cat',btn);assert.equal(counts.solve,0);bee(c);flush();assert.equal(c.G.coins,0);assert.equal(counts.render,0);});
test('arcade rapid correct taps earn only one ticket',()=>{const {c,btn}=setup();c.arcade={kind:'quiz',q:{answer:'noun'},qNum:0,total:5,right:0,ticketsWon:0};for(let i=0;i<10;i++)c.quizAnswer('noun',btn);assert.equal(c.G.prizeTickets,1);assert.equal(c.arcade.qNum,1);});
test('arcade wrong then correct earns no tickets',()=>{const {c,btn}=setup();c.arcade={kind:'quiz',q:{answer:'noun'},qNum:0,total:5,right:0,ticketsWon:0};c.quizAnswer('verb',btn);c.quizAnswer('noun',btn);assert.equal(c.G.prizeTickets||0,0);});
test('arcade old timer cannot advance replacement quiz',()=>{const {c,btn,counts,flush}=setup();c.arcade={kind:'quiz',q:{answer:'noun'},qNum:0,total:5,right:0,ticketsWon:0};c.quizAnswer('noun',btn);c.arcade={kind:'quiz'};flush();assert.equal(counts.render,0);});
test('cinema retry is practice without learning stars or coins',()=>{const {c,btn,counts,flush}=setup();const sc={correct:'A cat.',why:'Use a capital.'};c.cinema={movie:{id:'qa',title:'QA',scenes:[sc]},queue:[0],tried:{},firstRight:0};c.cinemaAnswer('no',sc,btn,0);flush();c.cinemaAnswer(sc.correct,sc,btn,0);flush();assert.equal(counts.solve,0);assert.equal(c.G.solved,0);assert.equal(c.G.coins,0);assert.equal(counts.practice,1);c.finishCinema();});
test('cinema first-try correct still earns reward once',()=>{const {c,btn,counts,flush}=setup();const sc={correct:'A cat.',why:'Use a capital.'};c.cinema={movie:{id:'qa',title:'QA',scenes:[sc]},queue:[0],tried:{},firstRight:0};c.cinemaAnswer(sc.correct,sc,btn,0);c.cinemaAnswer(sc.correct,sc,btn,0);flush();assert.equal(counts.solve,1);assert.equal(c.G.coins,7);c.finishCinema();assert.equal(c.G.coins,7);});
test('cinema old timer cannot finish replacement session',()=>{const {c,btn,counts,flush}=setup();const sc={correct:'A cat.',why:'Use a capital.'};c.cinema={movie:{id:'qa',scenes:[sc]},queue:[0],tried:{},firstRight:0};c.cinemaAnswer('no',sc,btn,0);c.cinema={queue:[]};flush();assert.equal(counts.render,0);});
test('library battle pays once and resets prior level streak',()=>{const {c}=setup();book(c);c.lib.battle=true;c.lib.battleLevel=3;c.G.readStreak=1;c.finishLib();assert.equal(c.G.coins,42);assert.equal(c.G.readLevel,3);assert.equal(c.profile.readStreak,0);c.finishLib();assert.equal(c.G.coins,42);});
test('incomplete rounds cannot cash out',()=>{const {c}=setup();book(c);c.lib.qi=1;c.finishLib();bee(c);c.spell.qi=1;c.finishSpell();assert.equal(c.G.coins,0);});
test('legacy profiles start at their existing level without a streak',()=>{const {c}=setup();c.profile={readLevel:4,spellLevel:3};c.G.readLevel=c.G.spellLevel=null;c.restoreReadingProgress('read');c.restoreReadingProgress('spell');assert.equal(c.G.readLevel,4);assert.equal(c.G.spellLevel,3);assert.equal(c.G.readStreak,0);assert.equal(c.G.spellSlip,0);});
console.log(`${passed} passed; ${failures.length} failed`);if(failures.length)process.exitCode=1;
