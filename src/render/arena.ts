import '@babylonjs/core/Culling/ray';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3,Matrix } from '@babylonjs/core/Maths/math.vector';
import { Color3,Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { ROUTES,SLOTS,HOUSES,pointOnRoute,DEVICES } from '../core/arena';
import type {GameState,Vec2} from '../core/types';
export class ArenaView {
 engine:Engine;scene:Scene;camera:ArcRotateCamera; nodes=new Map<string,TransformNode>(); floods=new Map<string,Mesh>(); effects: {mesh:Mesh;until:number;born:number;kind:string;index:number;origin:Vector3}[]=[]; lastEvent=0; shake=true; materials=new Map<string,StandardMaterial>(); selected:string|null=null; marker:Mesh|null=null;rangeKey="";rangeMeshes:Mesh[]=[];boats=new Map<string,Mesh>();
 constructor(public canvas:HTMLCanvasElement,public select:(kind:'slot'|'house',id:string)=>void){
 this.engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});this.scene=new Scene(this.engine);this.scene.clearColor=new Color4(.045,.085,.14,1);
 this.camera=new ArcRotateCamera('camera',-Math.PI/2, .64,51,new Vector3(0,0,-2),this.scene);this.camera.mode=1;this.resize();
 new HemisphericLight('sky',new Vector3(0,1,0),this.scene).intensity=.65;const sun=new DirectionalLight('sun',new Vector3(-1,-2,1),this.scene);sun.intensity=.55;
 this.box('island',{x:0,z:-2},35,1,31,'#547a70',-.8);this.box('rim',{x:0,z:-2},36,.5,32,'#243e50',-1.4);
 // Quiet city grid and sculpted waterways.
 for(let x=-14;x<=14;x+=4) this.box('street',{x,z:-2},.18,.025,28,'#8caa94',-.26);
 for(let z=-14;z<=10;z+=4)this.box('street',{x:0,z},32,.025,.18,'#8caa94',-.25);
 for(const route of ROUTES){for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];this.segment('bank',a,b,2.2,.15,'#b5d5c2',-.12);this.segment('water',a,b,1.65,.13,'#287e9b',.01);}}
 for(const slot of SLOTS){const ring=CreateTorus('slot-'+slot.id,{diameter:1.35,thickness:.13,tessellation:32},this.scene);ring.position=new Vector3(slot.position.x,.18,slot.position.z);ring.material=this.mat('#ffe18b');ring.metadata={kind:'slot',id:slot.id};this.nodes.set(slot.id,ring);const pad=this.box('pad',slot.position,1.1,.15,1.1,'#284e56',.03);pad.metadata=ring.metadata;}
 for(const [i,h] of HOUSES.entries()){const root=new TransformNode(h.id,this.scene);root.position=new Vector3(h.position.x,0,h.position.z);const body=this.box('house', {x:0,z:0},1.3,1.35,1.25,['#f7c986','#f4af91','#f2deb3'][i%3],.7);body.parent=root;body.metadata={kind:'house',id:h.id};const roof=CreateCylinder('roof',{diameter:2,height:.65,tessellation:4},this.scene);roof.rotation.y=Math.PI/4;roof.scaling.z=.85;roof.position.y=1.68;roof.parent=root;roof.material=this.mat('#c85b52');roof.metadata=body.metadata;for(const x of [-.36,.36]){const w=this.box('window',{x,z:-.635},.23,.35,.025,'#fff1ab',.85);w.parent=root;w.metadata=body.metadata;}this.nodes.set(h.id,root);}
 // Vienna in miniature: cathedral, ferris wheel and a little park.
 const church=this.box('cathedral',{x:-9,z:-8},2.6,2.6,3.8,'#d4ceb2',1.1);church.rotation.y=.15;this.box('tower',{x:-9,z:-8},.7,5,.7,'#e7dfc1',2.5);const spire=CreateCylinder('spire',{diameterBottom:1.1,diameterTop:0,height:2,tessellation:4},this.scene);spire.position=new Vector3(-9,6,-8);spire.material=this.mat('#57998b');
 const wheel=CreateTorus('riesenrad',{diameter:3.6,thickness:.13,tessellation:40},this.scene);wheel.rotation.x=Math.PI/2;wheel.position=new Vector3(10,2.4,-9);wheel.material=this.mat('#f0d69b');for(let i=0;i<10;i++){const a=i*Math.PI/5;this.box('gondola',{x:10+Math.cos(a)*1.8,z:-9},.4,.5,.4,'#e66d56',2.4+Math.sin(a)*1.8);}this.box('support',{x:10,z:-9},.18,2.7,.18,'#d6cba9',1.2);
 for(const p of [{x:-12,z:-3},{x:-12,z:-11},{x:6,z:-11},{x:12,z:7},{x:-3,z:8},{x:7,z:8}]){this.box('trunk',p,.18,.7,.18,'#8c6852',.3);const tree=CreateSphere('tree',{diameter:1.3,segments:6},this.scene);tree.position=new Vector3(p.x,1.2,p.z);tree.material=this.mat('#39886a');}
 this.scene.onPointerObservable.add(()=>{const hit=this.scene.pick(this.scene.pointerX,this.scene.pointerY,mesh=>mesh.metadata?.kind==='slot'||mesh.metadata?.kind==='house');const data=hit?.pickedMesh?.metadata;if(data?.kind)this.select(data.kind,data.id);},1);
 window.addEventListener('resize',()=>this.resize());
 }
 mat(color:string){const cached=this.materials.get(color);if(cached)return cached;const m=new StandardMaterial(color,this.scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(0,0,0);this.materials.set(color,m);return m;}
 box(name:string,p:Vec2,w:number,h:number,d:number,color:string,y:number){const m=CreateBox(name,{width:w,height:h,depth:d},this.scene);m.position=new Vector3(p.x,y,p.z);m.material=this.mat(color);return m;}
 segment(name:string,a:Vec2,b:Vec2,width:number,height:number,color:string,y:number){const m=this.box(name,{x:(a.x+b.x)/2,z:(a.z+b.z)/2},width,height,Math.hypot(b.x-a.x,b.z-a.z)+.2,color,y);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);return m;}
 resize(){this.engine.resize();const ratio=this.canvas.clientWidth/this.canvas.clientHeight;this.camera.orthoTop=20;this.camera.orthoBottom=-20;this.camera.orthoLeft=-20*ratio;this.camera.orthoRight=20*ratio;}
 project(kind:'slot'|'house',id:string){void kind;const node=this.nodes.get(id);if(!node) return{x:0,y:0};const p=Vector3.Project(node.position,Matrix.IdentityReadOnly,this.scene.getTransformMatrix(),this.camera.viewport.toGlobal(this.engine.getRenderWidth(),this.engine.getRenderHeight()));const r=this.canvas.getBoundingClientRect();return{x:r.left+p.x/this.engine.getRenderWidth()*r.width,y:r.top+p.y/this.engine.getRenderHeight()*r.height};}
 update(s:GameState){
 const slot=SLOTS.find(x=>x.id===this.selected);const device=s.devices.find(x=>x.slotId===this.selected);const range=device?(device.level===2?DEVICES[device.kind].upgradedRange:DEVICES[device.kind].range):.17;const rangeKey=`${this.selected}:${range}`;if(rangeKey!==this.rangeKey){this.rangeKey=rangeKey;this.rangeMeshes.forEach(m=>m.dispose());this.rangeMeshes=[];if(slot){const start=Math.max(0,slot.progress-range),end=Math.min(1,slot.progress+range);for(let i=0;i<30;i++){const a=pointOnRoute(slot.routeId,start+i*(end-start)/30);const b=pointOnRoute(slot.routeId,start+(i+1)*(end-start)/30);const m=this.segment('reach',a,b,1.85,.025,'#d0b96b',.15);this.rangeMeshes.push(m);}}}
 if(this.selected){const p=SLOTS.find(x=>x.id===this.selected)?.position??HOUSES.find(x=>x.id===this.selected)?.position;if(p){if(!this.marker){this.marker=CreateTorus('selection',{diameter:2.2,thickness:.08,tessellation:48},this.scene);this.marker.material=this.mat('#fff0a9');}this.marker.position.set(p.x,.25,p.z);this.marker.isVisible=true;this.marker.rotation.y=s.time*.4;}}else if(this.marker)this.marker.isVisible=false;
 for(const d of s.devices){const key='device-'+d.slotId;if(this.nodes.has(key))continue;const p=SLOTS.find(x=>x.id===d.slotId)!.position;const root=new TransformNode(key,this.scene);root.position=new Vector3(p.x,0,p.z);const base=this.box('device', {x:0,z:0},.85,.55,.85,DEVICES[d.kind].color,.45);base.parent=root;base.metadata={kind:'slot',id:d.slotId};const top=d.kind==='pump'?CreateTorus('pump',{diameter:.65,thickness:.2},this.scene):CreateCylinder('tool',{diameter:.42,height:1.1,tessellation:d.kind==='freeze'?6:12},this.scene);top.material=this.mat(DEVICES[d.kind].color);top.position.y=.95;top.parent=root;top.metadata=base.metadata;if(d.kind==='cannon')top.rotation.z=.8;this.nodes.set(key,root);}
 for(const [id,node]of this.nodes)if(id.startsWith('device-')&&!s.devices.some(d=>'device-'+d.slotId===id)){node.dispose();this.nodes.delete(id);}
 for(const h of s.houses){if(h.evacuationAt!==null){let boat=this.boats.get(h.id);if(!boat){boat=this.box('rescue-boat',h.position,.6,.3,1.2,'#ffdc78',.6);this.boats.set(h.id,boat);}const t=Math.max(0,Math.min(1,1-(h.evacuationAt-s.time)/2));boat.position.set(h.position.x+Math.sin(s.time*6)*.1,.65,h.position.z+3*(1-t));boat.rotation.y=-.25;}else{this.boats.get(h.id)?.dispose();this.boats.delete(h.id);}const root=this.nodes.get(h.id)!;root.scaling.y=h.health===0?.25:1;root.rotation.z=h.threatened?Math.sin(s.time*9)*.015:0;}
 const used=new Set<string>();
 for(const f of s.floods){const count=Math.max(4,Math.ceil(f.length*90));for(let i=0;i<count;i++){const t=f.progress-f.length*(i/count);if(t<0||t>1)continue;const p=pointOnRoute(f.routeId,t);const frozen=f.frozenUntil>s.time;const key=f.id+'-'+i;used.add(key);let m=this.floods.get(key);if(!m){m=this.box('flood',p,1.4,.6,.62,'#39c8e4',.27);this.floods.set(key,m);}m.position.x=p.x;m.position.z=p.z;m.scaling.y=.6+f.strength/f.maxStrength*.6;m.scaling.x=1+Math.sin(i*1.4+s.time*5)*.06;m.material=this.mat(frozen?'#b7f9ff':i<2?'#d8ffff':'#39c8e4');m.rotation.y=Math.atan2(pointOnRoute(f.routeId,Math.min(1,t+.005)).x-p.x,pointOnRoute(f.routeId,Math.min(1,t+.005)).z-p.z);this.floods.set(f.id+'-'+i,m);if(frozen&&i%2===0){const iceKey=f.id+'-ice-'+i;used.add(iceKey);let ice=this.floods.get(iceKey);if(!ice){ice=CreateLines('ice-crack',{points:[new Vector3(-.65,0,-.17),new Vector3(-.23,0,.13),new Vector3(.12,0,-.1),new Vector3(.35,0,.2),new Vector3(.65,0,-.12)]},this.scene);(ice as import('@babylonjs/core/Meshes/linesMesh').LinesMesh).color=Color3.FromHexString('#25768d');this.floods.set(iceKey,ice);}ice.position.set(p.x,.27+.3*m.scaling.y+.035,p.z);ice.rotation.y=m.rotation.y;}if(i%3===0){const foamKey=f.id+'-foam-'+i;used.add(foamKey);let foam=this.floods.get(foamKey);if(!foam){foam=this.box('foam',{x:p.x-.3,z:p.z},.65,.06,.12,'#e1ffff',.7);this.floods.set(foamKey,foam);}foam.position.x=p.x-.3;foam.position.z=p.z;foam.rotation.y=m.rotation.y;this.floods.set(f.id+'-foam-'+i,foam);}}}
 for(const [id,mesh]of this.floods)if(!used.has(id)){mesh.dispose();this.floods.delete(id);}
 for(const e of s.events.filter(e=>e.id>this.lastEvent)){
 this.lastEvent=Math.max(this.lastEvent,e.id);let p=e.position;if(!p&&e.targetId)p=SLOTS.find(x=>x.id===e.targetId)?.position??HOUSES.find(x=>x.id===e.targetId)?.position;
 if(!p||!['pump','freeze','push','damage','lost','rescue','rescue-start','shield'].includes(e.type))continue;
 const duration=e.type==='shield'?6:e.type==='pump'?1:.7;if(e.time+duration<s.time)continue;
 const count=e.type==='pump'?3:e.type==='damage'||e.type==='lost'?9:e.type==='push'?5:1;
 for(let i=0;i<count;i++){
 let mesh:Mesh;
 if(e.type==='damage'||e.type==='lost')mesh=this.box('damage-splash',p,.13,.32,.13,i%2?'#ff9374':'#d5ffff',.8);
 else if(e.type==='push')mesh=this.box('push-spray',p,.18,.16,.65,'#e6ffff',.7);
 else mesh=CreateTorus('effect-'+e.type,{diameter:e.type==='shield'?3:e.type==='pump'?1.8-i*.45:1.8,thickness:e.type==='pump'?.08:.13,tessellation:e.type==='freeze'?6:28},this.scene);
 mesh.position.set(p.x,.65+i*.04,p.z);mesh.material=this.mat(e.type==='shield'?'#ffdc78':e.type==='pump'?'#f3f8d7':e.type==='rescue'?'#8ff0b8':e.type==='damage'||e.type==='lost'?i%2?'#ff9374':'#d5ffff':'#b3ffff');
 this.effects.push({mesh,until:e.time+duration,born:e.time,kind:e.type,index:i,origin:mesh.position.clone()});
 }}
 this.effects=this.effects.filter(e=>{
 if(e.until<s.time){e.mesh.dispose();return false;}const age=s.time-e.born;
 if(e.kind==='pump'){const spin=age*10+e.index*2.1;const radius=(1-age)*.24;e.mesh.position.x=e.origin.x+Math.cos(spin)*radius;e.mesh.position.z=e.origin.z+Math.sin(spin)*radius;e.mesh.position.y=.65-age*.3+e.index*.08;e.mesh.scaling.setAll(Math.max(.1,1-age*.7));e.mesh.rotation.z=Math.sin(spin)*.22;}
 else if(e.kind==='damage'||e.kind==='lost'){const a=e.index*Math.PI*2/9;e.mesh.position.x=e.origin.x+Math.cos(a)*age*2.5;e.mesh.position.z=e.origin.z+Math.sin(a)*age*2.5;e.mesh.position.y=e.origin.y+age*3-age*age*5;e.mesh.rotation.z=age*8+e.index;e.mesh.scaling.setAll(Math.max(.1,1-age));}
 else if(e.kind==='push'){e.mesh.position.x=e.origin.x+(e.index-2)*age;e.mesh.position.z=e.origin.z-age*3;e.mesh.position.y=.7+Math.sin(age*4)*.6;e.mesh.rotation.x=-.4;}
 else if(e.kind==='shield'){e.mesh.position.y=.65+Math.sin(s.time*3)*.12;e.mesh.scaling.setAll(1+Math.sin(s.time*4)*.05);}
 else{e.mesh.scaling.setAll(1+age*.7);e.mesh.rotation.y=age*2;}
 return true;});
 if(s.time===0&&this.lastEvent>0){this.lastEvent=0;this.effects.forEach(e=>e.mesh.dispose());this.effects=[];}
 this.camera.target.x=this.shake&&s.events.some(e=>e.type==='damage'&&s.time-e.time<.25)?Math.sin(s.time*100)*.08:0;
 }
 render(){this.scene.render();}
}
