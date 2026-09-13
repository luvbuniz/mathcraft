/* Shared, lightweight furnishings. No renderer, animation loop or network service of its own. */
window.StackInteriorArt = (() => {
  const T=THREE, palette=new Map();
  let timber,packaging;
  function packet(p,index,x,y,z,w,h,rot=0){
    if(!packaging){
      const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const c=cv.getContext('2d');
      const names=['TOMATOES','GARDEN PEAS','SWEET CORN','BAKED BEANS'];
      const colors=['#b74732','#52763c','#bc922e','#9b5638'];
      for(let i=0;i<4;i++){
        c.save();c.translate(i*256,0);c.fillStyle='#f3e4bd';c.fillRect(0,0,256,512);
        c.fillStyle=colors[i];c.fillRect(10,12,236,68);c.fillRect(10,415,236,84);
        c.textAlign='center';c.fillStyle='#fff8df';c.font='bold 26px Georgia';c.fillText('STACK FARMS',128,55);
        c.font='bold 23px sans-serif';c.fillText(names[i],128,451);c.font='17px sans-serif';c.fillText('GROWN WITH CARE',128,481);
        c.fillStyle=colors[i];c.font='italic 25px Georgia';c.fillText('Farm fresh',128,127);
        for(let j=0;j<7;j++){
          const x=75+(j%3)*48,y=225+Math.floor(j/3)*43;
          c.beginPath();c.ellipse(x,y,i===0?29:18,i===2?32:22,(j%3-1)*.3,0,Math.PI*2);c.fillStyle=i===2?'#e9b839':colors[i];c.fill();
          c.beginPath();c.ellipse(x-7,y-9,6,9,0,0,Math.PI*2);c.fillStyle='rgba(255,255,255,.22)';c.fill();
        }
        c.strokeStyle='#486941';c.lineWidth=8;c.beginPath();c.moveTo(91,205);c.lineTo(116,184);c.lineTo(143,206);c.stroke();c.restore();
      }
      packaging=new T.MeshBasicMaterial({map:new T.CanvasTexture(cv)});
    }
    const geo=new T.PlaneGeometry(w,h),uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+(index%4))/4);
    const front=mesh(p,geo,packaging,x,y,z);front.rotation.y=rot;return front;
  }
  function material(color) {
    if(!palette.has(color))palette.set(color,new T.MeshLambertMaterial({color,emissive:color,emissiveIntensity:.12}));
    return palette.get(color);
  }
  function wood() {
    if(!timber){
      timber=new T.MeshBasicMaterial({color:0xb99878});
      new T.TextureLoader().load('textures/oak-store-v1.jpg?v=280',t=>{
        t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearFilter;t.generateMipmaps=false;
        timber.map=t;timber.color.setHex(0xc5b69f);timber.needsUpdate=true;
      });
    }
    return timber;
  }
  function mesh(p,geo,m,x,y,z){const o=new T.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o;}
  function box(p,x,y,z,w,h,d,m){return mesh(p,new T.BoxGeometry(w,h,d),typeof m==='number'?material(m):m,x,y,z);}
  function cylinder(p,x,y,z,r,h,m){return mesh(p,new T.CylinderGeometry(r,r,h,16),material(m),x,y,z);}
  function label(p,text,sub,x,y,z,w=.7,h=.25,rot=0,bg='#28483e'){
    const cv=document.createElement('canvas');cv.width=512;cv.height=160;const c=cv.getContext('2d');
    c.fillStyle=bg;c.fillRect(0,0,512,160);c.strokeStyle='#dcc9a2';c.lineWidth=5;c.strokeRect(8,8,496,144);
    c.textAlign='center';c.fillStyle='#fff5df';c.font='bold 43px sans-serif';c.fillText(text,256,sub?67:99,475);
    if(sub){c.font='25px sans-serif';c.fillText(sub,256,117,475);}
    const m=mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),side:T.DoubleSide}),x,y,z);m.rotation.y=rot;return m;
  }
  function merge(p){
    p.updateMatrixWorld(true);const buckets=new Map();
    p.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);
      if(!buckets.has(o.material.uuid))buckets.set(o.material.uuid,{mat:o.material,geos:[]});buckets.get(o.material.uuid).geos.push(geo);o.geometry.dispose();});
    p.clear();for(const {mat,geos} of buckets.values()){
      const g=new T.BufferGeometry();for(const [name,size]of[['position',3],['normal',3],['uv',2]]){
        const arr=new Float32Array(geos.reduce((n,v)=>n+v.attributes[name].array.length,0));let n=0;
        for(const part of geos){arr.set(part.attributes[name].array,n);n+=part.attributes[name].array.length;}g.setAttribute(name,new T.BufferAttribute(arr,size));}
      g.computeBoundingSphere();p.add(new T.Mesh(g,mat));geos.forEach(g=>g.dispose());
    }return p;
  }
  function store(){
    const p=new T.Group(),o=wood(),dark=0x504538;
    // A quiet back wall replaces dozens of tiny, non-interactive tins.
    box(p,7.45,1.55,-18.31,3.1,1.45,.08,0xf3ead4);
    box(p,7.45,1.55,-18.24,2.85,1.2,.035,0xb7dce1);
    for(const x of[6.03,7.45,8.87])box(p,x,1.55,-18.20,.07,1.25,.05,0xfff5df);
    box(p,7.45,1.55,-18.19,2.85,.07,.05,0xfff5df);
    label(p,'FRESH FROM THE FARM','Pick your order from the tables',7.45,2.4,-18.15,3.3,.38);
    label(p,'FRUIT & VEG','Pick up from this table',2.72,2.24,-17,2.7,.36,Math.PI/2);
    label(p,'FEED & EGGS','Pick up from this table',10.28,2.24,-17,2.7,.36,-Math.PI/2);
    // Detailed north-facing cashier counter, within the existing collision footprint.
    box(p,8.5,.48,-12.51,1.85,.86,.78,o);box(p,8.5,.94,-12.51,1.94,.09,.84,0x645346);
    for(const x of[7.72,9.28])box(p,x,.48,-12.935,.065,.8,.035,0xb09470);
    label(p,'CHECKOUT','Count the change',8.5,.52,-12.946,1.38,.35,Math.PI);
    const register=new T.Group();box(register,0,0,0,.48,.075,.37,0x343b3b);box(register,0,.18,.1,.42,.28,.1,0x344b46);
    box(register,0,.19,.043,.32,.17,.012,0x9dc4a1);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(register,-.12+col*.11,.049,-.1+row*.08,.065,.014,.048,0xd5d2bf);
    register.position.set(8.95,1,-12.53);p.add(register);
    cylinder(p,7.91,1.014,-12.65,.12,.035,0xbba263);const bell=mesh(p,new T.SphereGeometry(.105,16,8,0,Math.PI*2,0,Math.PI/2),material(0xc8b07e),7.91,1.035,-12.65);
    // Customer basket, handles and receipt beside the register.
    box(p,8.42,1.1,-12.62,.47,.19,.31,0x95754e);
    for(const x of[8.2,8.64])box(p,x,1.22,-12.62,.02,.11,.3,dark);
    box(p,8.42,1.29,-12.62,.45,.024,.025,dark);
    box(p,8.82,.996,-12.8,.17,.009,.19,0xf4eddc);
    box(p,8.15,.4,-11.88,.48,.1,.4,o);
    for(const x of[7.98,8.32])for(const z of[-12.02,-11.74])box(p,x,.2,z,.055,.4,.055,dark);
    label(p,'1 PICK  2 PACK','3 COUNT THE CHANGE',10.21,1.7,-14.6,1.8,.65,-Math.PI/2);
    // Entry mat and lamps establish an inviting threshold.
    const matLabel=label(p,'WELCOME','Pick • pack • count',6.5,.125,-12.4,1.7,.85,0,'#4d5b45');matLabel.rotation.x=-Math.PI/2;
    for(const x of[4.6,8.3]){
      cylinder(p,x,2.34,-15.35,.012,.45,dark);
      mesh(p,new T.ConeGeometry(.22,.17,20,1,true),material(0x34574d),x,2.11,-15.35);
      mesh(p,new T.SphereGeometry(.07,12,8),new T.MeshBasicMaterial({color:0xffe9b5}),x,2.03,-15.35);
    }
    return merge(p);
  }
  return {wood,store,label,merge,box,material};
})();
