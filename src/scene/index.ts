import {WebGPUEngine,Scene,ArcRotateCamera,Vector3,Color3,Color4,HemisphericLight,DirectionalLight,ShadowGenerator,Mesh,MeshBuilder,VertexData,StandardMaterial,Matrix,RawTexture,Constants,Texture} from '@babylonjs/core';
import type {Terrain,Snapshot,Point} from '../flood/types';
import {cellGeometry,assertSnapshot,previewGeometry} from './geometry';
import {createPointerTrack} from './input';
export type Quality='low'|'high';
export interface ScenePick {point:Point;buildingId?:number;gateId?:number;button:number;originalEvent:PointerEvent}
export interface Preview {points:Point[];valid:boolean;cost:number;reason?:string}
export interface LandscapeOptions {quality?:Quality;onPointer?:(phase:'down'|'move'|'up'|'cancel',pick:ScenePick)=>void;onDeviceLost?:(message:string)=>void}
/** Call createLandscape(terrain), await initialize(canvas), then update(workerSnapshot). */
export function createLandscape(terrain:Terrain,options:LandscapeOptions={}) {
 let engine:WebGPUEngine,scene:Scene,camera:ArcRotateCamera,water:Mesh,preview:Mesh|undefined;
 let observer:ResizeObserver|undefined,disposed=false,lastTime=-1,previewState:Preview|undefined;
 const houses=new Map<number,Mesh>(),gates=new Map<number,Mesh>(),barriers=new Map<string,Mesh>();
 let shadow:ShadowGenerator;
 let latestDepths:Float32Array|undefined,removePointerListeners:(()=>void)|undefined;
 const quality=options.quality??'high',size=terrain.cellSize;
 const surface=(x:number,y:number)=>terrain.heights[Math.min(terrain.height-1,Math.max(0,Math.floor(y)))*terrain.width+Math.min(terrain.width-1,Math.max(0,Math.floor(x)))];
 const materials=new Map<string,StandardMaterial>();
 function material(name:string,color:number[],rough=true) {
  if(materials.has(name))return materials.get(name)!;
  const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromArray(color);m.specularColor=rough?new Color3(.025,.025,.025):new Color3(.65,.72,.7);materials.set(name,m);return m;
 }
 function box(name:string,x:number,z:number,w:number,d:number,h:number,mat:StandardMaterial,base=surface(x/size,z/size)) {
  const m=MeshBuilder.CreateBox(name,{width:w,depth:d,height:h},scene);m.position.set(x,base+h/2,z);m.material=mat;m.receiveShadows=true;m.isPickable=false;return m;
 }
 function geometry(mesh:Mesh,depths?:Float32Array) {
  const g=cellGeometry(terrain,depths),v=new VertexData();v.positions=g.positions;v.indices=g.indices;v.colors=g.colors;v.uvs=g.uvs;const normals:number[]=[];VertexData.ComputeNormals(g.positions,g.indices,normals);v.normals=normals;v.applyToMesh(mesh,true);
 }
 function resetCamera(){camera.setTarget(new Vector3(terrain.width*size*.5,0,terrain.height*size*.52));camera.alpha=-Math.PI/2;camera.beta=.67;camera.radius=terrain.width*size*.88;}
 function roof(name:string,x:number,z:number,w:number,d:number,base:number,height:number,mat:StandardMaterial) {
  const mesh=new Mesh(name,scene),v=new VertexData();v.positions=[-w/2,0,-d/2,w/2,0,-d/2,0,height,-d/2,-w/2,0,d/2,w/2,0,d/2,0,height,d/2];v.indices=[0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4];const n:number[]=[];VertexData.ComputeNormals(v.positions,v.indices,n);v.normals=n;v.applyToMesh(mesh);mesh.position.set(x,base,z);mesh.material=mat;mesh.isPickable=false;shadow.addShadowCaster(mesh);return mesh;
 }
 function tree(x:number,y:number,seed:number) {
  const ground=surface(x,y);if(terrain.river[Math.floor(y)*terrain.width+Math.floor(x)]||terrain.obstacles[Math.floor(y)*terrain.width+Math.floor(x)])return;
  const trunk=material('bark',[.22,.18,.12]);box('trunk',x*size,y*size,.45,.45,3.8,trunk,ground);
  const crown=MeshBuilder.CreateIcoSphere('linden canopy',{radius:2.5+(seed%3)*.3,subdivisions:quality==='high'?3:2},scene);crown.position.set(x*size,ground+4.8,y*size);crown.scaling.y=1.18;crown.material=material('leaf'+seed%4,[[.20,.31,.12],[.27,.36,.16],[.33,.42,.18],[.18,.29,.17]][seed%4]);crown.isPickable=false;shadow.addShadowCaster(crown);
 }
 async function initialize(canvas:HTMLCanvasElement) {
  if(!('gpu' in navigator))throw new Error('WebGPU is unavailable. Use a WebGPU-capable browser and adapter.');
  engine=new WebGPUEngine(canvas,{antialias:quality==='high',adaptToDeviceRatio:true});
  await engine.initAsync();if(disposed){engine.dispose();throw new Error('Scene disposed during initialization');}
  engine.setHardwareScalingLevel(quality==='low'?1.75:Math.max(1,window.devicePixelRatio/1.5));
  scene=new Scene(engine);scene.clearColor=new Color4(.72,.79,.79,1);scene.ambientColor=new Color3(.35,.38,.36);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.00038;scene.fogColor=new Color3(.72,.79,.79);
  camera=new ArcRotateCamera('fixed aerial',-Math.PI/2,.67,450,Vector3.Zero(),scene);resetCamera();camera.lowerBetaLimit=camera.upperBetaLimit=.67;camera.lowerAlphaLimit=camera.upperAlphaLimit=-Math.PI/2;camera.lowerRadiusLimit=120;camera.upperRadiusLimit=850;camera.panningSensibility=36;camera.wheelPrecision=5;camera.minZ=.1;camera.maxZ=2000;camera.attachControl(canvas,true);camera.inputs.attached.pointers && ((camera.inputs.attached.pointers as unknown as {buttons:number[]}).buttons=[2]);
  const sky=new HemisphericLight('sky',new Vector3(0,1,0),scene);sky.intensity=.82;sky.groundColor=new Color3(.35,.36,.25);
  const sun=new DirectionalLight('late afternoon',new Vector3(-.65,-1,.5),scene);sun.position=new Vector3(300,400,-120);sun.intensity=2.1;shadow=new ShadowGenerator(quality==='high'?2048:1024,sun);shadow.usePercentageCloserFiltering=true;shadow.bias=.001;
  const ground=new Mesh('hydraulic terrain',scene);geometry(ground);ground.material=material('meadow',[1,1,1]);ground.receiveShadows=true;ground.isPickable=true;
  // Vertical skirts join independent exact-height cells without smoothing hydraulic levees away.
  const skirts=new Mesh('terrain cell sides',scene),p:number[]=[],ix:number[]=[];
  for(let y=0;y<terrain.height;y++)for(let x=0;x<terrain.width;x++)for(const [dx,dy] of [[1,0],[0,1]]){
   if(x+dx>=terrain.width||y+dy>=terrain.height)continue;const h=surface(x,y),h2=surface(x+dx,y+dy);if(Math.abs(h-h2)<.025)continue;const n=p.length/3,xx=(x+dx)*size,zz=(y+dy)*size;
   if(dx)p.push(xx,h,y*size,xx,h2,y*size,xx,h2,(y+1)*size,xx,h,(y+1)*size);else p.push(x*size,h,zz,x*size,h2,zz,(x+1)*size,h2,zz,(x+1)*size,h,zz);ix.push(n,n+1,n+2,n,n+2,n+3);
  }
  const sv=new VertexData();sv.positions=p;sv.indices=ix;const sn:number[]=[];VertexData.ComputeNormals(p,ix,sn);sv.normals=sn;sv.applyToMesh(skirts);skirts.material=material('earth bank',[.39,.37,.26]);skirts.material.backFaceCulling=false;skirts.isPickable=false;
  const plaster=[[.79,.73,.59],[.89,.84,.70],[.74,.79,.74],[.85,.77,.64],[.72,.72,.67]];
  for(const b of terrain.buildings){
   const x=(b.x+b.width/2)*size,z=(b.y+b.height/2)*size,base=surface(b.x+b.width/2,b.y+b.height/2),h=5.2+(b.id%3)*.55;
   const house=box('house '+b.id,x,z,b.width*size,b.height*size,h,material('plaster'+b.id%5,plaster[b.id%5]),base);house.metadata={buildingId:b.id};house.isPickable=true;houses.set(b.id,house);shadow.addShadowCaster(house);
   const tile=material('terracotta'+b.id%3,[[.43,.20,.12],[.53,.26,.16],[.35,.29,.25]][b.id%3]);roof('pitched tiled roof',x,z,b.width*size+1,b.height*size+1,base+h,3.2,tile);
   for(let r=0;r<7;r++){const slope=r/7;for(const sign of [-1,1]){const seam=box('tile course',x+sign*(b.width*size/2+.45)*(1-slope),z,.09,b.height*size+1,.08,tile,base+h+slope*3.2+.04);seam.isPickable=false;}}
   box('chimney',x+3,z-2,1,1,3,material('chimney brick',[.43,.32,.24]),base+h+1.6);
   const glass=material('window glass',[.17,.26,.29],false),trim=material('window limestone',[.82,.80,.69]);
   for(const side of [-1,1])for(let k=0;k<3;k++){box('window frame',x-4+k*4,z+side*(b.height*size/2+.04),1.55,.13,1.8,trim,base+2);box('window',x-4+k*4,z+side*(b.height*size/2+.13),1.2,.08,1.45,glass,base+2.18);}
   box('front door',x,z+b.height*size/2+.15,1.35,.2,2.5,material('door timber',[.29,.23,.16]),base);
   // Gardens remain purely cosmetic and sit outside impermeable house footprints.
   const gardenZ=z+10;box('vegetable garden',x,gardenZ,11,4,.035,material('garden soil',[.30,.27,.17]));
   for(let k=0;k<5;k++)box('vegetable row',x-4+k*2,gardenZ,.45,3,.24,material('vegetables',[.28,.39,.16]));
   box('garden hedge',x+9,z+7,.8,13,.85,material('hedge',[.24,.34,.15]));
   tree(b.x+b.width+3,b.y+1,b.id);tree(b.x-4,b.y+8,b.id+1);
  }
  // Riparian trees, a towpath and crop rows give the large landscape a coherent scale.
  for(let x=4;x<terrain.width-3;x+=7){const y=Math.floor(terrain.height*.335);if(Math.abs(x-terrain.width*.7)>6)tree(x,y-3,x);}
  for(let y=terrain.height*.79;y<terrain.height-2;y+=3)for(let x=3;x<15;x+=3)box('field furrow',x*size,y*size,1.1,4,.06,material('field crops',[.47,.46,.23]));
  for(const gate of terrain.gates){const gx=(gate.x+.5)*size,gz=(gate.y+1)*size;const m=box('relief gate '+gate.id,gx,gz,7*size,.5,gate.sill-.25,material('gate steel',[.28,.34,.32]),.25);m.metadata={gateId:gate.id};m.isPickable=true;gates.set(gate.id,m);for(const side of [-1,1])box('gate pier',gx+side*7*size/2,gz,1.2,2,3,material('concrete',[.60,.59,.53]),.25);}
  water=new Mesh('actual hydraulic water',scene);water.isPickable=false;const wm=material('Danube water',[1,1,1],false);wm.backFaceCulling=false;wm.alpha=.89;wm.specularPower=96;water.material=wm;
  // Repeating tangent-space normal field: advected ripples, with real surface heights unchanged.
  const resolution=128,normalPixels=new Uint8Array(resolution*resolution*4);
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
   const u=x/resolution*Math.PI*2,v=y/resolution*Math.PI*2;
   const nx=.22*Math.cos(u*5+v*2)+.10*Math.cos(u*13-v*7),ny=.16*Math.cos(u*5+v*2)-.14*Math.cos(u*13-v*7),nz=Math.sqrt(Math.max(.1,1-nx*nx-ny*ny)),i=(y*resolution+x)*4;
   normalPixels[i]=(nx*.5+.5)*255;normalPixels[i+1]=(ny*.5+.5)*255;normalPixels[i+2]=(nz*.5+.5)*255;normalPixels[i+3]=255;
  }
  const ripples=new RawTexture(normalPixels,resolution,resolution,Constants.TEXTUREFORMAT_RGBA,scene,true,false,Texture.TRILINEAR_SAMPLINGMODE);ripples.wrapU=ripples.wrapV=Texture.WRAP_ADDRESSMODE;ripples.level=.45;wm.bumpTexture=ripples;

  const track=createPointerTrack<ScenePick>((phase,pick,event)=>options.onPointer?.(phase,{...pick,button:event.button,originalEvent:event}));
  const pickEvent=(e:PointerEvent)=>{
   const rect=canvas.getBoundingClientRect();const hit=scene.pick((e.clientX-rect.left)*engine.getRenderWidth()*engine.getHardwareScalingLevel()/rect.width,(e.clientY-rect.top)*engine.getRenderHeight()*engine.getHardwareScalingLevel()/rect.height,m=>m===ground||m.metadata?.buildingId!==undefined||m.metadata?.gateId!==undefined);
   return hit?.pickedPoint?{point:{x:hit.pickedPoint.x/size,y:hit.pickedPoint.z/size},buildingId:hit.pickedMesh?.metadata?.buildingId,gateId:hit.pickedMesh?.metadata?.gateId,button:e.button,originalEvent:e}:undefined;
  };
  const down=(e:PointerEvent)=>{const pick=pickEvent(e);if(pick)canvas.setPointerCapture(e.pointerId);track('down',e,pick);};
  const move=(e:PointerEvent)=>track('move',e,pickEvent(e));
  const up=(e:PointerEvent)=>track('up',e,pickEvent(e));
  const cancel=(e:PointerEvent)=>track('cancel',e);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
  removePointerListeners=()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('lostpointercapture',cancel);};
  observer=new ResizeObserver(()=>engine.resize());observer.observe(canvas);
  canvas.addEventListener('contextmenu',preventContext);
  engine.runRenderLoop(()=>{if(!disposed){ripples.uOffset=performance.now()*.000012;ripples.vOffset=Math.sin(performance.now()*.0001)*.018;scene.render();}});
  const device=(engine as unknown as {_device?:GPUDevice})._device;device?.lost.then(info=>{if(!disposed)options.onDeviceLost?.(info.message||'WebGPU device lost');});
  return diagnostics();
 }
 function preventContext(e:Event){e.preventDefault();}
 function update(snapshot:Snapshot){assertSnapshot(terrain,snapshot);latestDepths=snapshot.depths;if(!scene||disposed)return;if(snapshot.time!==lastTime){geometry(water,snapshot.depths);lastTime=snapshot.time;}
  for(const state of snapshot.buildings){const house=houses.get(state.buildingId);if(house)house.visibility=1;}
  for(const gate of snapshot.gates){const m=gates.get(gate.id);if(m)m.position.y=gate.open?3.6:1.125;}
  const keys=new Set(snapshot.barriers.map(b=>b.key));for(const [key,m] of barriers)if(!keys.has(key)){m.dispose();barriers.delete(key);}
  for(const b of snapshot.barriers){let m=barriers.get(b.key);const horizontal=Math.abs(b.a-b.b)===terrain.width;const x=(b.x+(horizontal?.5:0))*size,z=(b.y+(horizontal?0:.5))*size;
   if(!m){m=box('sandbags '+b.key,x,z,horizontal?size:.7,horizontal?.7:size,1,material('sandbags',[.65,.58,.38]));barriers.set(b.key,m);}m.scaling.y=Math.max(.12,b.height*b.progress);m.position.y=Math.max(terrain.heights[b.a],terrain.heights[b.b])+m.scaling.y/2;m.visibility=b.status==='queued'?.5:1;
  }
 }
 function setPreview(state?:Preview){previewState=state;preview?.dispose();preview=undefined;if(!scene||!state||state.points.length<2)return;const lines=previewGeometry(terrain,state.points,latestDepths).map(p=>new Vector3(p.x,p.y,p.z));preview=MeshBuilder.CreateLines('barrier preview',{points:lines},scene);(preview as import('@babylonjs/core').LinesMesh).color=state.valid?new Color3(.75,.93,.36):new Color3(1,.22,.12);preview.isPickable=false;preview.renderingGroupId=3;scene.setRenderingAutoClearDepthStencil(3,true,true,true);}
 function project(point:Point){const v=Vector3.Project(new Vector3(point.x*size,surface(point.x,point.y),point.y*size),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));const rect=engine.getRenderingCanvas()!.getBoundingClientRect();return {x:rect.left+v.x/engine.getRenderWidth()*rect.width,y:rect.top+v.y/engine.getRenderHeight()*rect.height};}
 function diagnostics(){return {backend:'WebGPU' as const,quality,adapter:engine?.getInfo()??null,limits:engine?{maxTextureDimension2D:engine.currentLimits.maxTextureDimension2D,maxBufferSize:engine.currentLimits.maxBufferSize}:null,renderWidth:engine?.getRenderWidth(),renderHeight:engine?.getRenderHeight(),preview:previewState?{valid:previewState.valid,cost:previewState.cost,reason:previewState.reason}:null};}
 function dispose(){disposed=true;removePointerListeners?.();observer?.disconnect();engine?.getRenderingCanvas()?.removeEventListener('contextmenu',preventContext);scene?.dispose();engine?.dispose();}
 return {initialize,update,dispose,setPreview,resetCamera,project,diagnostics,zoom:(factor:number)=>{camera.radius=Math.max(120,Math.min(850,camera.radius*factor));},pan:(dx:number,dy:number)=>{camera.target.addInPlace(new Vector3(dx*size,0,dy*size));}};
}
