import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Color3, Color4, Mesh, VertexData, StandardMaterial, VertexBuffer, MeshBuilder, LinesMesh } from '@babylonjs/core';
import earcut from 'earcut';
import type { Scenario } from '../scenario';
import type { Action, BuildingStatus, Face } from '../simulation/game';

/** Render only; simulation state is owned by the worker. */
export class World {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: ArcRotateCamera;
  private readonly water: Mesh;
  private readonly flowLines: LinesMesh;
  private readonly flowPositions: Float32Array;
  private flowSamples: { x:number; y:number; height:number; vx:number; vy:number }[] = [];
  private currentDepth = new Float32Array(0);
  private currentBuildings = new Map<string,BuildingStatus>();
  private readonly land: Mesh;
  private readonly landPositions: Float32Array;
  private previewMesh?: LinesMesh;
  private damMesh?: LinesMesh;
  private surveyMesh?: LinesMesh;
  private damSignature = '';
  private terrainRevision = -1;
  private readonly waterPositions: Float32Array;
  private readonly waterColors: Float32Array;
  private zoom = 560;
  private readonly width: number;
  private readonly height: number;
  private readonly cell: number;
  private bed: number[];
  constructor(private readonly canvas: HTMLCanvasElement, private readonly scenario: Scenario) {
    this.width=scenario.grid.width; this.height=scenario.grid.height; this.cell=scenario.grid.cellSize; this.bed=scenario.bed;
    this.engine=new Engine(canvas,true,{ disableWebGL2Support:false, preserveDrawingBuffer:false });
    if (this.engine.webGLVersion < 2) { this.engine.dispose(); throw new Error('WebGL2 wird benötigt.'); }
    this.scene=new Scene(this.engine); this.scene.clearColor=new Color4(0.78,0.85,0.80,1);
    this.camera=new ArcRotateCamera('camera',-Math.PI/4,Math.PI/3,1500,new Vector3(0,0,0),this.scene);
    this.camera.mode=ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
    new HemisphericLight('sky',new Vector3(0,1,0),this.scene).intensity=0.9;
    const land=new Mesh('terrain',this.scene), landData=this.gridData(scenario.bed,false);
    this.land=land; landData.applyToMesh(land,true); this.landPositions=new Float32Array(landData.positions!);
    const landMat=new StandardMaterial('land-material',this.scene); landMat.diffuseColor=new Color3(0.61,0.68,0.52); landMat.specularColor=Color3.Black(); landMat.backFaceCulling=false; landMat.emissiveColor=new Color3(0.22,0.25,0.19); land.material=landMat;
    this.water=new Mesh('water',this.scene); this.water.isPickable=false; const waterData=this.gridData(scenario.bed,true);
    waterData.applyToMesh(this.water,true); this.water.hasVertexAlpha=true;
    this.waterPositions=new Float32Array(waterData.positions!); this.waterColors=new Float32Array(waterData.colors!);
    const waterMat=new StandardMaterial('water-material',this.scene); waterMat.diffuseColor=new Color3(0.21,0.58,0.72); waterMat.specularColor=new Color3(0.1,0.15,0.16); waterMat.backFaceCulling=false; waterMat.emissiveColor=new Color3(0.10,0.29,0.38); waterMat.useAlphaFromDiffuseTexture=false;
    this.water.material=waterMat;
    // The survey-derived face elevations affect flow, so show them on the map as well.
    this.updateSurveyRidges();
    // A fixed, bounded set of visual stream markers is updated from worker momentum.
    const count=Math.ceil(this.width/12)*Math.ceil(this.height/12);
    this.flowLines=MeshBuilder.CreateLineSystem('flow',{lines:Array.from({length:count},()=>[Vector3.Zero(),Vector3.Zero()]),updatable:true},this.scene);
    this.flowLines.color=new Color3(0.8,0.96,0.99);this.flowLines.isPickable=false;
    this.flowPositions=new Float32Array(count*6);
    const buildingMat=new StandardMaterial('buildings',this.scene); buildingMat.diffuseColor=new Color3(0.80,0.66,0.51); buildingMat.specularColor=Color3.Black(); buildingMat.backFaceCulling=false; buildingMat.emissiveColor=new Color3(0.19,0.14,0.10);
    for(const building of scenario.buildings) {
      const rings=[building.polygon.outer,...building.polygon.holes];
      const points:number[]=[]; const holes:number[]=[];
      for(const [i,ring] of rings.entries()) { if(i>0) holes.push(points.length/2); for(const p of ring.slice(0,-1)) points.push(p[0],p[1]); }
      if(points.length<6) continue;
      const cx=Math.max(0,Math.min(this.width-1,Math.floor(points[0]/this.cell))), cy=Math.max(0,Math.min(this.height-1,Math.floor(points[1]/this.cell)));
      const ground=scenario.terrain[cy*this.width+cx]; const verts:number[]=[]; const indices:number[]=[];
      for(let i=0;i<points.length;i+=2) verts.push(points[i]-this.width*this.cell/2, ground+building.height, points[i+1]-this.height*this.cell/2);
      const top=earcut(points,holes,2); for(let i=0;i<top.length;i+=3) indices.push(top[i],top[i+2],top[i+1]);
      for(const ring of rings) {
        const n=ring.length-1;
        for(let i=0;i<n;i++) { const j=(i+1)%n,a=ring[i],b=ring[j],v=verts.length/3;
          verts.push(a[0]-this.width*this.cell/2,ground,a[1]-this.height*this.cell/2,b[0]-this.width*this.cell/2,ground,b[1]-this.height*this.cell/2,a[0]-this.width*this.cell/2,ground+building.height,a[1]-this.height*this.cell/2,b[0]-this.width*this.cell/2,ground+building.height,b[1]-this.height*this.cell/2);
          indices.push(v,v+2,v+1,v+1,v+2,v+3);
        }
      }
      const mesh=new Mesh(`building-${building.id}`,this.scene); const data=new VertexData(); data.positions=verts; data.indices=indices; const normals:number[]=[]; VertexData.ComputeNormals(verts,indices,normals); data.normals=normals; data.applyToMesh(mesh); mesh.material=buildingMat; mesh.metadata={buildingId:building.id};
    }
    this.resize(); this.updateWater(new Float32Array(scenario.initialDepth));
    window.addEventListener('resize',this.resize);
    this.engine.runRenderLoop(()=>{this.animateFlow(performance.now()/1000);this.scene.render();});
  }
  private gridData(values:number[], colored:boolean): VertexData {
    const positions:number[]=[], indices:number[]=[], colors:number[]=[];
    for(let y=0;y<=this.height;y++) for(let x=0;x<=this.width;x++) {
      const i=Math.min(y,this.height-1)*this.width+Math.min(x,this.width-1);
      positions.push(x*this.cell-this.width*this.cell/2, values[i], y*this.cell-this.height*this.cell/2);
      if(colored) colors.push(1,1,1,0);
    }
    for(let y=0;y<this.height;y++) for(let x=0;x<this.width;x++) {
      const i=y*(this.width+1)+x; indices.push(i,i+1,i+this.width+1, i+1,i+this.width+2,i+this.width+1);
    }
    const data=new VertexData(); data.positions=positions; data.indices=indices; const normals:number[]=[]; VertexData.ComputeNormals(positions,indices,normals); data.normals=normals; if(colored)data.colors=colors; return data;
  }
  updateState(bed:Float32Array, buildings:BuildingStatus[], dams:[string,number][], revision:number):void {
    this.currentBuildings=new Map(buildings.map(b=>[b.id,b]));
    if(revision===this.terrainRevision) return;
    this.terrainRevision=revision;
    this.bed=Array.from(bed);
    for(let y=0;y<=this.height;y++) for(let x=0;x<=this.width;x++) {
      const i=Math.min(y,this.height-1)*this.width+Math.min(x,this.width-1), v=y*(this.width+1)+x;
      this.landPositions[v*3+1]=this.bed[i];
    }
    this.land.updateVerticesData(VertexBuffer.PositionKind,this.landPositions);
    this.updateSurveyRidges();
    for(const b of buildings) {const mesh=this.scene.getMeshByName(`building-${b.id}`); if(mesh) mesh.setEnabled(!b.demolished);}
    const signature=JSON.stringify(dams);
    if(signature!==this.damSignature) {
      this.damSignature=signature; this.damMesh?.dispose();
      const lines=dams.map(([key,crest])=>{const [axis,raw]=key.split(':'),index=Number(raw); return this.facePoints({axis:axis as 'x'|'y',index},crest+0.5);});
      if(lines.length) {this.damMesh=MeshBuilder.CreateLineSystem('confirmed-dams',{lines},this.scene);this.damMesh.color=new Color3(0.75,0.29,0.12);this.damMesh.isPickable=false;}
    }
  }
  private updateSurveyRidges():void {
    this.surveyMesh?.dispose();
    const faces=this.scenario.surveyCrests;if(!faces.length)return;
    const lines=faces.map(face=>{
      const x=face.axis==='x'?face.index%(this.width+1):face.index%this.width;
      const y=face.axis==='x'?Math.floor(face.index/(this.width+1)):Math.floor(face.index/this.width);
      const a=face.axis==='x'?y*this.width+x-1:(y-1)*this.width+x,b=face.axis==='x'?a+1:y*this.width+x;
      const depth=this.scenario.parameters.trenchDepth;
      const cut=this.scenario.bed[a]-this.bed[a]>depth-1e-4 && this.scenario.bed[b]-this.bed[b]>depth-1e-4 ? depth : 0;
      return this.facePoints(face,face.crest-cut+0.1);
    });
    this.surveyMesh=MeshBuilder.CreateLineSystem('survey-ridges',{lines},this.scene);
    this.surveyMesh.color=new Color3(0.35,0.40,0.26);this.surveyMesh.isPickable=false;
  }
  private facePoints(face:Face,height:number):Vector3[] {
    const x=face.axis==='x'?face.index%(this.width+1):face.index%this.width;
    const y=face.axis==='x'?Math.floor(face.index/(this.width+1)):Math.floor(face.index/this.width);
    const point=(px:number,py:number)=>new Vector3(px*this.cell-this.width*this.cell/2,height,py*this.cell-this.height*this.cell/2);
    return face.axis==='x'?[point(x,y),point(x,y+1)]:[point(x,y),point(x+1,y)];
  }
  pick(clientX:number,clientY:number,buildingOnly=false):{x:number;y:number;buildingId?:string}|undefined {
    const rect=this.canvas.getBoundingClientRect();
    const hit=this.scene.pick((clientX-rect.left)*this.engine.getRenderWidth()/rect.width,(clientY-rect.top)*this.engine.getRenderHeight()/rect.height,m=>buildingOnly?!!m.metadata?.buildingId:m===this.land);
    if(!hit?.hit||!hit.pickedPoint) return undefined;
    return {x:hit.pickedPoint.x+this.width*this.cell/2,y:hit.pickedPoint.z+this.height*this.cell/2,buildingId:hit.pickedMesh?.metadata?.buildingId};
  }
  showPreview(action?:Action):void {
    this.previewMesh?.dispose(); this.previewMesh=undefined;
    for(const m of this.scene.meshes) if(m.metadata?.buildingId) m.renderOverlay=false;
    if(!action)return;
    if(action.kind==='demolish') {const m=this.scene.getMeshByName(`building-${action.buildingId}`); if(m){m.renderOverlay=true;m.overlayColor=new Color3(1,0.3,0.1);m.overlayAlpha=0.55;}return;}
    let lines:Vector3[][]=[];
    if(action.kind==='dam') lines=action.faces.map(face=>{const i=face.axis==='x'?Math.floor(face.index/(this.width+1))*this.width+Math.min(this.width-1,face.index%(this.width+1)):Math.min(this.height-1,Math.floor(face.index/this.width))*this.width+face.index%this.width;return this.facePoints(face,this.bed[i]+this.scenario.parameters.damHeight+1);});
    else lines=action.cells.map(i=>{const x=i%this.width,y=Math.floor(i/this.width),h=this.bed[i]+1;return [new Vector3((x+.2)*this.cell-this.width*this.cell/2,h,(y+.5)*this.cell-this.height*this.cell/2),new Vector3((x+.8)*this.cell-this.width*this.cell/2,h,(y+.5)*this.cell-this.height*this.cell/2)];});
    if(lines.length){this.previewMesh=MeshBuilder.CreateLineSystem('preview',{lines},this.scene);this.previewMesh.color=new Color3(1,0.38,0.08);this.previewMesh.isPickable=false;}
  }
  inspect(clientX:number,clientY:number):string {
    const building=this.pick(clientX,clientY,true);
    if(building?.buildingId) {
      const b=this.currentBuildings.get(building.buildingId);
      if(b) return `Gebäude: Flutschaden ${Math.round(b.damage).toLocaleString('de-AT')} von ${Math.round(b.value).toLocaleString('de-AT')}.`;
    }
    const point=this.pick(clientX,clientY);
    if(!point) return 'Keine Stelle auf der Karte ausgewählt.';
    const x=Math.max(0,Math.min(this.width-1,Math.floor(point.x/this.cell))),y=Math.max(0,Math.min(this.height-1,Math.floor(point.y/this.cell)));
    return `Wassertiefe: ${(this.currentDepth[y*this.width+x]??0).toFixed(2)} m.`;
  }
  private animateFlow(now:number):void {
    const positions=this.flowPositions;positions.fill(0);
    for(let i=0;i<this.flowSamples.length;i++) {
      const a=this.flowSamples[i],speed=Math.hypot(a.vx,a.vy);
      if(speed<0.01)continue;
      const ux=a.vx/speed,uy=a.vy/speed,phase=((now*Math.min(speed,3)/5+i*.37)%1-.5)*this.cell*5;
      const x=a.x+ux*phase,y=a.y+uy*phase,o=i*6;
      positions[o]=x-ux*3;positions[o+1]=a.height;positions[o+2]=y-uy*3;
      positions[o+3]=x+ux*3;positions[o+4]=a.height;positions[o+5]=y+uy*3;
    }
    this.flowLines.updateVerticesData(VertexBuffer.PositionKind,positions);
  }
  updateWater(depth:Float32Array, qx?:Float32Array, qy?:Float32Array): void {
    if(depth.length!==this.width*this.height) throw new Error('Ungültiger Wasser-Snapshot');
    this.currentDepth=Float32Array.from(depth);
    if(qx && qy) {
      this.flowSamples=[];
      for(let y=0;y<this.height;y+=12) for(let x=0;x<this.width;x+=12) {
        const i=y*this.width+x,h=depth[i];
        this.flowSamples.push({x:x*this.cell-this.width*this.cell/2,y:y*this.cell-this.height*this.cell/2,height:this.bed[i]+h+0.3,vx:h>0.05?qx[i]/h:0,vy:h>0.05?qy[i]/h:0});
      }
    }
    for(let y=0;y<=this.height;y++) for(let x=0;x<=this.width;x++) {
      const i=Math.min(y,this.height-1)*this.width+Math.min(x,this.width-1), v=y*(this.width+1)+x;
      this.waterPositions[v*3+1]=this.bed[i]+depth[i]+0.08;
      this.waterColors[v*4+3]=depth[i]>0.02 ? 0.78 : 0;
    }
    this.water.updateVerticesData(VertexBuffer.PositionKind,this.waterPositions);
    this.water.updateVerticesData(VertexBuffer.ColorKind,this.waterColors);
  }
  setZoom(factor:number): void { this.zoom=Math.max(180,Math.min(950,this.zoom*factor)); this.resize(); }
  pan(dx:number,dy:number): void {
    const camera=this.camera; const scale=this.zoom/Math.max(1,this.canvas.clientHeight);
    const right=new Vector3(Math.cos(camera.alpha+Math.PI/2),0,Math.sin(camera.alpha+Math.PI/2));
    const up=new Vector3(Math.cos(camera.alpha),0,Math.sin(camera.alpha));
    camera.target.addInPlace(right.scale(-dx*scale)).addInPlace(up.scale(-dy*scale));
  }
  private resize=():void=> { this.engine.resize(); const aspect=this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight); this.camera.orthoTop=this.zoom; this.camera.orthoBottom=-this.zoom; this.camera.orthoLeft=-this.zoom*aspect; this.camera.orthoRight=this.zoom*aspect; };
  dispose():void { window.removeEventListener('resize',this.resize); this.engine.dispose(); }
}
