// 🎵 Math Meadow music asset + gating, and the King Lion intro r2 (auto-advance, no duplicate line, phone HUD).
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),s=fs.readFileSync(path.join(root,'play.html'),'utf8');
// asset: present, small, and the exact path play.html loads
const src=(s.match(/MUSIC_SRC = '([^'?]+)/)||[])[1];
assert.equal(src,'audio/music/math-meadow.m4a');
const st=fs.statSync(path.join(root,src));
assert(st.size>50e3&&st.size<400e3,'music file should be a real track under ~400 KB, is '+st.size);
// gating: no sound before the first tap, Meadow only, off switch, hidden tab, mute, duck to 25 %
function music(){
  const store={},nodes=[];let t=0;
  const gainNode=()=>({gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}},connect(){}});
  const ctx={state:'running',get currentTime(){return t;},destination:{},createGain:gainNode,
    createBufferSource(){const n={connect(){},start(){n.on=true;},stop(){n.on=false;}};nodes.push(n);return n;}};
  const doc={hidden:false,hasFocus:()=>true,addEventListener(){}};
  const c=vm.createContext({LS:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
    Sound:{ctx,muted:false},G:{running:true,world:'meadow'},Narrator:{speaking:false},document:doc,
    addEventListener(){},setInterval(){},setTimeout(){},fetch(){throw new Error('no fetch in test');}});
  vm.runInContext(s.slice(s.indexOf("const MUSIC_SRC"),s.indexOf("document.addEventListener('pointerdown', () => { if (Music.unlocked)"))+';this.Music=Music;',c);
  c.Music.buf={duration:41,sampleRate:44100,getChannelData:()=>new Float32Array(10)};
  return {c,M:c.Music,nodes,store,doc,tick(d){t+=d;}};
}
{ const f=music(); f.M.update(); assert.equal(f.nodes.length,0,'no music before the first tap');
  f.M.unlocked=true; f.M.update(); assert.equal(f.nodes.length,1); assert(f.nodes[0].on);
  assert(f.M.vol<=0.2,'quiet by default');
  f.c.Narrator.speaking=true; f.M.update(); assert.equal(f.M.gain.gain.value,f.M.vol*0.25,'ducks to 25% under King Lion');
  f.c.Narrator.speaking=false; f.M.update(); assert.equal(f.M.gain.gain.value,f.M.vol);
  f.doc.hidden=true; f.M.update(); assert(!f.nodes[0].on,'pauses on a hidden tab'); f.doc.hidden=false; f.M.update(); assert.equal(f.nodes.length,2);
  f.c.G.world='city'; f.M.update(); assert(!f.nodes[1].on,'Math Meadow only'); f.c.G.world='meadow'; f.M.update();
  f.M.toggle(); assert.equal(f.store.mc_music,'off'); assert(!f.nodes[2].on,'menu switch turns it off'); f.M.toggle(); assert.equal(f.store.mc_music,'on');
  f.c.Sound.muted=true; f.M.update(); assert(!f.nodes[3].on,'🔇 sound off silences music too'); }
assert(/\['musicBtn',/.test(s)&&/'musicBtn'\) \{[^\n]*Music\.toggle\(\)/.test(s),'☰ has a Music on/off row');
// intro r2: the line is shown once (bubble), the panel copy is screen-reader only; auto-advance wiring
assert(/<div id="leoBubble" class="srOnly"/.test(s),'panel does not repeat the bubble line');
assert(/guideAutoNext\(played \? 1700 : guideCaptionMs\(key\)\)/.test(s),'auto-advance after the line, caption timer without audio');
assert(/function closeLeoIntro\(skipped\) \{\n  if \(leoIntro\) clearTimeout\(leoIntro\.autoT\);/.test(s),'close clears the auto timer');
assert(/body\.phoneHud #leaveBtn \{ display:none !important; \}/.test(s)&&/\['homeBtn',/.test(s),'phones: Leave lives in ☰');
console.log('music-intro ok');
