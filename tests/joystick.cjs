// Pip QA P0-6 + tablet retest rt32–rt35: joystick dead zone, speed curve, no camera swing.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../play.html'),'utf8');
function fn(n){const a=s.indexOf('function '+n+'(');return s.slice(a,s.indexOf('\n}',a)+2);}
const dead=+s.match(/const JOY_DEAD = ([\d.]+);/)[1],top=eval(s.match(/const JOY_TOP = ([\d. *]+);/)[1]);
assert(dead>=0.08&&dead<=0.10,'dead zone is 8–10% of the stick');
assert(Math.abs(top/0.85-0.6)<0.01,'full push is ~60% of the old top speed');
assert(s.includes('speed * JOY_TOP * Math.min(1, (jmag - JOY_DEAD) / (1 - JOY_DEAD))'),'speed is linear in the push');
// stick dead zone, through the real touch handlers
const start=s.indexOf('const touch = {'),end=s.indexOf('/* ============================ START MENU',start);
const handlers={},nodes={},canvas={style:{},addEventListener(n,f){handlers[n]=f;}};
function node(id){return nodes[id]||(nodes[id]={style:{},classList:{add(){},remove(){},contains(){return false;}},events:{},addEventListener(n,f){this.events[n]=f;}});}
const input=vm.createContext({isTouch:true,canvas,$:node,player:{yaw:0},G:{running:true},popupOpen:false,performance:{now:()=>100},clearTimeout(){},setTimeout(){return 1;},innerWidth:960,innerHeight:600,interact(){},navigator:{},liveRace:false});
vm.runInContext(s.slice(start,end)+'\nthis.inputState=touch;',input);
const ev=(type,x,y)=>({type,changedTouches:[{identifier:1,clientX:x,clientY:y}],preventDefault(){}});
handlers.touchstart(ev('touchstart',180,500));handlers.touchmove(ev('touchmove',180,495));
assert.equal(input.inputState.joyY,0,'a 5 px wobble (8%) does not walk');
handlers.touchmove(ev('touchmove',180,490));assert(input.inputState.joyY<0,'a 10 px push (17%) walks');
handlers.touchend(ev('touchend',180,490));
// camera: holds while the stick is held, never swings 180° after stopping
let now=0;const c=vm.createContext({performance:{now:()=>now},isTouch:true,G:{firstPerson:false},touch:{joyX:0,joyY:0},player:{yaw:0,camYaw:0,pos:{x:0,z:0},vel:{x:0,z:0},driving:false}});
vm.runInContext(fn('shortAngle')+'\n'+fn('camFollowYaw'),c);
c.player.yaw=1.2;c.player.vel.x=3;c.touch.joyX=1;for(let i=0;i<30;i++){now+=50;c.camFollowYaw(.05);}
assert.equal(c.player.camYaw,0,'no camera swing while steering');
c.touch.joyX=0;c.touch.joyY=0;c.player.vel.x=0;c.player.yaw=Math.PI;for(let i=0;i<80;i++){now+=50;c.camFollowYaw(.05);}
assert.equal(c.player.camYaw,0,'hero facing the camera: no 180° spin after stopping');
c.player.yaw=0.8;for(let i=0;i<80;i++){now+=50;c.camFollowYaw(.05);}
assert(c.player.camYaw>0.5,'small turns still settle in behind the hero');
// pulling down backs up instead of turning round
assert(s.includes('const backing = touch.joyY > 0 && Math.abs(touch.joyX) < touch.joyY * 0.8;'));
console.log('PASS 9% dead zone, linear ~60% top speed, camera holds while steering, no 180° spin, pull-down backs up');
