// node tests/bird-rendering.cjs /path/to/three-r128.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const THREE=require(process.argv[2] ? path.resolve(process.argv[2]) : 'three');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
const code=s.slice(s.indexOf('const matCache ='),s.indexOf('function spike('))+s.slice(s.indexOf('const BIRD_BREEDS ='),s.indexOf('function buildFishbowl('));
function context(raw){const c=vm.createContext({THREE,console});vm.runInContext(raw?code.replace('[g, head, wingL, wingR, tail].forEach(batchBirdParts);','// Unbatched reference geometry'):code,c);return c;}
const original=context(true),batched=context(false);
function vertices(g){
  g.updateMatrixWorld(true);const rows=[];
  g.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrixWorld);
    const p=geo.attributes.position,n=geo.attributes.normal,c=geo.attributes.color;
    for(let i=0;i<p.count;i++)rows.push([p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i),...(c?[c.getX(i),c.getY(i),c.getZ(i)]:[m.material.color.r,m.material.color.g,m.material.color.b])].map(v=>Math.round(v*10000)/10000).join(','));
    geo.dispose();});return rows.sort();
}
let oldMeshes=0,newMeshes=0;
const count=vm.runInContext('BIRD_BREEDS.length',batched);
for(let i=0;i<count;i++){
  const old=original.buildBirdMesh(i),a=batched.buildBirdMesh(i),b=batched.buildBirdMesh(i);
  old.traverse(m=>{if(m.isMesh)oldMeshes++;});a.traverse(m=>{if(m.isMesh)newMeshes++;});
  assert.deepEqual(vertices(a),vertices(old),'all rest-pose vertices, normals and colours retained for breed '+i);
  assert.notEqual(a.userData.wings[0],b.userData.wings[0],'wing animation is independent');
  assert.notEqual(a.userData.head,b.userData.head,'head animation is independent');
  assert.equal(a.userData.wings[0].children[0].geometry,b.userData.wings[0].children[0].geometry,'same breed shares GPU geometry');
  for(const bird of [a,old]){bird.userData.wings[0].rotation.z=.6;bird.userData.wings[1].rotation.z=-.6;bird.userData.head.rotation.y=.4;bird.userData.tail.rotation.x=.2;}
  assert.equal(Math.abs(b.userData.wings[0].rotation.z),0,'moving one bird does not move its neighbour');
  assert.deepEqual(vertices(a),vertices(old),'animated geometry still matches for breed '+i);
  const ray=new THREE.Raycaster(new THREE.Vector3(0,0,3),new THREE.Vector3(0,0,-1));
  assert(ray.intersectObject(a,true).length>0,'batched bird remains selectable');
}
assert.equal(newMeshes,count*5);assert(newMeshes<oldMeshes/2);
console.log(JSON.stringify({pass:true,breeds:count,oldMeshes,newMeshes,geometryAndColorsPreserved:true,independentAnimation:true,selectable:true},null,2));
