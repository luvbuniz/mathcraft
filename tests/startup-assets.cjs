// Run from any directory: node tests/startup-assets.cjs
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'play.html'), 'utf8').replace(/\r\n/g,'\n');
const section = (a,b) => source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));

async function main() {
  let calls=0, finish;
  const parsedBuffers=[];
  const ctx=vm.createContext({Map, Promise, console, AVATAR_MODEL_DIR:'avatars/',
    fetch:()=>{calls++; return new Promise(resolve=>{finish=resolve;});},
    THREE:{GLTFLoader:class {parse(buf,_path,done){parsedBuffers.push(buf); done({buf});}}},
    prepareAvatarModel:(_id,gltf)=>gltf});
  vm.runInContext(section('const glbBytes =','/* Normalize a loaded model:'),ctx);
  const a=ctx.parseAvatarModel('leo'), b=ctx.parseAvatarModel('leo');
  assert.equal(calls,1,'simultaneous hero/NPC requests share one download');
  finish({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
  const [hero,npc]=await Promise.all([a,b]);
  assert.notEqual(hero,npc,'each animated character receives its own model instance');
  assert.notEqual(parsedBuffers[0],parsedBuffers[1],'parser buffers remain independent');
  await ctx.parseAvatarModel('leo'); assert.equal(calls,1,'completed bytes are reused');
  const failure=ctx.fetchAvatarBytes('missing'); finish({ok:false});
  assert.equal(await failure,null); assert.equal(await ctx.fetchAvatarBytes('missing'),null);
  assert.equal(calls,2,'missing model falls back without a request loop');

  const images=[],cards=[];
  function element(tag){
    const e={tag,dataset:{},children:[],attributes:{},className:'',
      appendChild(x){this.children.push(x);},
      getAttribute(k){return k==='src'?this.src:this.attributes[k];}};
    e.classList={remove(){e.className=e.className.replace(' selected','');},add(){e.className+=' selected';}};
    if(tag==='img')images.push(e);
    return e;
  }
  const grid={appendChild(e){cards.push(e);},querySelectorAll(){return cards;}};
  let classic=false;
  const menuContext=vm.createContext({
    AVATARS:[{id:'queenfox',name:'Fox'},{id:'leo',name:'Leo'},{id:'old',hidden:true}],
    G:{avatarIndex:1}, Sound:{click(){}}, classicHeroes:()=>classic,
    $:()=>grid,document:{createElement:element,querySelectorAll:()=>images}});
  vm.runInContext(section('function refreshAvatarPreviews()','function buildMenu()'),menuContext);
  const menu=section('  // Small pre-rendered pictures','\n}\ntry { buildMenu();');
  // No renderer, loader, fetch or avatar builder is supplied: cards must work without any of them.
  vm.runInContext(menu,menuContext);
  assert.equal(cards.length,2);assert.equal(images.length,2);
  assert(cards[1].className.includes('selected'));
  assert(images.every(img=>img.loading==='lazy'&&img.decoding==='async'));
  assert(images[0].src.endsWith('queenfox.webp?v=284'));
  cards[0].onclick();assert.equal(menuContext.G.avatarIndex,0);
  classic=true;menuContext.refreshAvatarPreviews();assert(images[1].src.includes('leo-classic.webp'));
  classic=false;menuContext.refreshAvatarPreviews();images[1].onerror();
  assert(images[1].src.includes('leo-classic.webp'));assert.equal(images[1].onerror,null);

  const ids=[...section('const AVATARS =','/* ============================ 🎨 REAL').matchAll(/id: '([^']+)'/g)].map(m=>m[1]);
  let normalBytes=0,allBytes=0,modelBytes=0;
  for(const id of ids){
    for(const suffix of ['', '-classic']){
      const buf=fs.readFileSync(path.join(root,'avatars/previews',id+suffix+'.webp'));
      assert.equal(buf.toString('ascii',0,4),'RIFF');assert.equal(buf.toString('ascii',8,12),'WEBP');
      allBytes+=buf.length;if(!suffix)normalBytes+=buf.length;
    }
    const model=path.join(root,'avatars',id+'.glb');
    if(fs.existsSync(model))modelBytes+=fs.statSync(model).size;
  }
  assert(normalBytes<250000,'entire standard picker remains below 250 KB');
  console.log(JSON.stringify({pass:true,avatars:ids.length,normalBytes,allBytes,previousMenuModelBytes:modelBytes},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
