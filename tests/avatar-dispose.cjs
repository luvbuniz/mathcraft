// Pip retest rt04 (tab crash in Reading Town): heroes / town friends we replace must be freed.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const fn=n=>{const a=s.indexOf('function '+n+'(');assert(a>=0,n);return s.slice(a,s.indexOf('\n}',a)+2);};
const log=[];const mk=(name,extra)=>Object.assign({name,dispose(){log.push(name);}},extra||{});
const shared=mk('sharedMat',{isMaterial:true}),blk=mk('BLK',{isMaterial:true}),ink=mk('INK',{isMaterial:true}),face=mk('faceMat',{isMaterial:true});
const tex=mk('modelTex',{isTexture:true}),own=mk('modelMat',{isMaterial:true,map:tex});
const node=(geo,material,extra)=>Object.assign({geometry:geo,material},extra||{});
const kids=[node(mk('g1'),shared),node(mk('g2'),blk),node(mk('g3'),[own,face],{skeleton:mk('skel')}),node(null,ink)];
const root={parent:{remove(o){log.push('removed');}},traverse(f){kids.forEach(f);}};
const mixer={stopAllAction(){log.push('stop');},uncacheRoot(){log.push('uncache');},getRoot(){return 1;}};
const c=vm.createContext({matCacheSet:new Set([shared]),BLK_MAT:blk,BLK_LINE_MAT:ink,PIXEL_FACE_CACHE:{k:{smile:face}},console});
vm.runInContext(fn('sharedAvatarMats')+fn('disposeAvatarObject'),c);
c.disposeAvatarObject(root,{mixer});
for(const x of ['removed','stop','uncache','g1','g2','g3','modelTex','modelMat','skel'])assert(log.includes(x),'missing '+x);
for(const x of ['sharedMat','BLK','INK','faceMat'])assert(!log.includes(x),'disposed shared '+x);
// every place that drops a hero/friend frees it
assert(!/scene\.remove\(player\.avatar\)/.test(s),'setAvatar frees the old hero');
assert(/for \(const n of npcs\) disposeAvatarObject\(n\.group, n\.d\)/.test(s),'clearNpcs frees friends');
assert(/disposeAvatarObject\(old, player\.avatarData\)/.test(s),'model upgrade frees the stand-in hero');
assert(/disposeAvatarObject\(n\.group, n\.d\);\s+\/\/ 🧹 the boxy stand-in/.test(s),'friend model upgrade frees the stand-in');
console.log('PASS replaced heroes/friends free geometry, own materials/textures, skeletons and mixers; shared colours kept');
