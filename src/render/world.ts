// Babylon registers picking and mesh overlays through these side-effect modules.
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Rendering/outlineRenderer';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { LinesMesh } from '@babylonjs/core/Meshes/linesMesh';
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { roofIndices } from './roof';
import { visibleWaterIndices } from './water-indices';
import { damCrest } from '../simulation/dam-height';
import { groundRoads, terrainHeight } from './roads';
import { buildingCondition } from './building-status';
import { boundaryArrowLines, boundaryArrows } from './boundary-arrows';
import { MAX_TRENCH_FLOW_SAMPLES, trenchFlowCells } from './trench-flow';
import { flowArrowLength, writeFlowArrow } from './flow-arrow';
import { FlowClock } from './flow-clock';
import type { Scenario } from '../scenario';
import type { Action, BuildingStatus, Face } from '../simulation/game';

const INITIAL_ALPHA=-Math.PI/4, INITIAL_BETA=Math.PI/3, INITIAL_RADIUS=1500;

/** Render only; simulation state is owned by the worker. */
export class World {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: ArcRotateCamera;
  private readonly water: Mesh;
  private readonly flowLines: LinesMesh;
  private readonly flowClock = new FlowClock();
  private readonly flowPositions: Float32Array;
  private readonly flowSamples: { x:number; y:number; height:number; vx:number; vy:number }[] = [];
  private flowTrenchCells:number[] = [];
  private readonly currentDepth: Float32Array;
  private currentBuildings = new Map<string,BuildingStatus>();
  private readonly buildingMaterials: Record<ReturnType<typeof buildingCondition>,StandardMaterial>;
  private readonly roads?: LinesMesh;
  private readonly roadPositions?: Float32Array;
  private readonly land: Mesh;
  private readonly landPositions: Float32Array;
  private previewMesh?: LinesMesh;
  private previewStart?: {x:number;y:number};
  private damMesh?: LinesMesh;
  private trenchMesh?: Mesh;
  private readonly trenchMaterial: StandardMaterial;
  private surveyMesh?: LinesMesh;
  private damSignature = '';
  private terrainRevision = -1;
  private readonly waterPositions: Float32Array;
  private readonly waterColors: Float32Array;
  private readonly wetVertices: Uint8Array;
  private readonly waterIndexBuffer: Uint16Array|Uint32Array;
  private wetTopologyReady = false;
  private zoom = 560;
  private readonly width: number;
  private readonly height: number;
  private readonly cell: number;
  private bed: number[];
  constructor(private readonly canvas: HTMLCanvasElement, private readonly scenario: Scenario) {
    this.width=scenario.grid.width; this.height=scenario.grid.height; this.cell=scenario.grid.cellSize; this.bed=scenario.bed;
    this.currentDepth=new Float32Array(this.width*this.height);
    this.engine=new Engine(canvas,true,{ disableWebGL2Support:false, preserveDrawingBuffer:false });
    if (this.engine.webGLVersion < 2) { this.engine.dispose(); throw new Error('WebGL2 wird benötigt.'); }
    this.scene=new Scene(this.engine); this.scene.clearColor=new Color4(0.78,0.85,0.80,1);
    this.camera=new ArcRotateCamera('camera',INITIAL_ALPHA,INITIAL_BETA,INITIAL_RADIUS,new Vector3(0,0,0),this.scene);
    this.camera.mode=ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
    new HemisphericLight('sky',new Vector3(0,1,0),this.scene).intensity=0.9;
    const land=new Mesh('terrain',this.scene), landData=this.gridData(scenario.bed,false);
    this.land=land; landData.applyToMesh(land,true); this.landPositions=new Float32Array(landData.positions!);
    const landMat=new StandardMaterial('land-material',this.scene); landMat.diffuseColor=new Color3(0.61,0.68,0.52); landMat.specularColor=Color3.Black(); landMat.backFaceCulling=false; landMat.emissiveColor=new Color3(0.22,0.25,0.19); land.material=landMat;
    this.trenchMaterial=new StandardMaterial('trench-material',this.scene);this.trenchMaterial.diffuseColor=new Color3(0.68,0.39,0.16);this.trenchMaterial.emissiveColor=new Color3(0.25,0.12,0.04);this.trenchMaterial.specularColor=Color3.Black();this.trenchMaterial.backFaceCulling=false;
    this.water=new Mesh('water',this.scene); this.water.isPickable=true; const waterData=this.gridData(scenario.bed,true);
    waterData.applyToMesh(this.water,true); this.water.hasVertexAlpha=true;
    this.waterPositions=new Float32Array(waterData.positions!); this.waterColors=new Float32Array(waterData.colors!);
    this.wetVertices=new Uint8Array((this.width+1)*(this.height+1));
    this.waterIndexBuffer=this.wetVertices.length<=65536?new Uint16Array(this.width*this.height*6):new Uint32Array(this.width*this.height*6);
    const waterMat=new StandardMaterial('water-material',this.scene); waterMat.diffuseColor=new Color3(0.21,0.58,0.72); waterMat.specularColor=new Color3(0.1,0.15,0.16); waterMat.backFaceCulling=false; waterMat.emissiveColor=new Color3(0.10,0.29,0.38); waterMat.useAlphaFromDiffuseTexture=false;
    this.water.material=waterMat;
    // These schematic arrows identify model boundaries, not guaranteed real-world flow paths.
    for(const kind of ['inflow','outflow'] as const){
      const lines=boundaryArrows(scenario).filter(a=>a.kind===kind).flatMap(arrow=>{
        const segments=boundaryArrowLines(arrow,this.width,this.height,this.cell);
        const [a,b]=segments[0],height=terrainHeight((a[0]+b[0])/2,(a[1]+b[1])/2,this.width,this.height,this.cell,this.bed)+12;
        return segments.map(segment=>segment.map(([x,y])=>new Vector3(x-this.width*this.cell/2,height,y-this.height*this.cell/2)));
      });
      if(lines.length){const mesh=CreateLineSystem(`boundary-${kind}`,{lines},this.scene);mesh.color=kind==='inflow'?new Color3(0.04,0.26,0.56):new Color3(0.55,0.12,0.48);mesh.isPickable=false;mesh.renderingGroupId=1;}
    }
    // OSM road paths follow the rendered terrain; elevated crossings are omitted.
    const roadLines=groundRoads(scenario).map(points=>points.map(([x,y])=>new Vector3(x-this.width*this.cell/2,terrainHeight(x,y,this.width,this.height,this.cell,this.bed)+0.05,y-this.height*this.cell/2)));
    if(roadLines.length){
      this.roads=CreateLineSystem('roads',{lines:roadLines,updatable:true},this.scene);
      this.roads.color=new Color3(0.46,0.43,0.34);this.roads.isPickable=false;
      this.roadPositions=new Float32Array(roadLines.flatMap(line=>line.flatMap(p=>[p.x,p.y,p.z])));
    }
    // The survey-derived face elevations affect flow, so show them on the map as well.
    this.updateSurveyRidges();
    // A fixed, bounded set of visual stream markers is updated from worker momentum.
    const count=Math.ceil(this.width/12)*Math.ceil(this.height/12)+MAX_TRENCH_FLOW_SAMPLES;
    this.flowLines=CreateLineSystem('flow',{lines:Array.from({length:count*3},()=>[Vector3.Zero(),Vector3.Zero()]),updatable:true},this.scene);
    this.flowLines.color=new Color3(0.8,0.96,0.99);this.flowLines.isPickable=false;
    // Dynamic markers start at the origin; their initial bounds do not follow updates.
    this.flowLines.alwaysSelectAsActiveMesh=true;
    this.flowPositions=new Float32Array(count*18);
    const material=(name:string,color:Color3)=>{const m=new StandardMaterial(name,this.scene);m.diffuseColor=color;m.specularColor=Color3.Black();m.backFaceCulling=false;m.emissiveColor=color.scale(0.23);return m;};
    this.buildingMaterials={unbeschädigt:material('buildings',new Color3(0.80,0.66,0.51)),gefährdet:material('buildings-at-risk',new Color3(0.92,0.72,0.27)),beschädigt:material('buildings-damaged',new Color3(0.80,0.34,0.18)),verloren:material('buildings-lost',new Color3(0.30,0.22,0.21))};
    for(const building of scenario.buildings) {
      const rings=[building.polygon.outer,...building.polygon.holes];
      const points:number[]=[]; const holes:number[]=[];
      for(const [i,ring] of rings.entries()) { if(i>0) holes.push(points.length/2); for(const p of ring.slice(0,-1)) points.push(p[0],p[1]); }
      if(points.length<6) continue;
      const cx=Math.max(0,Math.min(this.width-1,Math.floor(points[0]/this.cell))), cy=Math.max(0,Math.min(this.height-1,Math.floor(points[1]/this.cell)));
      const ground=scenario.terrain[cy*this.width+cx]; const verts:number[]=[]; const indices:number[]=[];
      for(let i=0;i<points.length;i+=2) verts.push(points[i]-this.width*this.cell/2, ground+building.height, points[i+1]-this.height*this.cell/2);
      indices.push(...roofIndices(points,holes));
      for(const ring of rings) {
        const n=ring.length-1;
        for(let i=0;i<n;i++) { const j=(i+1)%n,a=ring[i],b=ring[j],v=verts.length/3;
          verts.push(a[0]-this.width*this.cell/2,ground,a[1]-this.height*this.cell/2,b[0]-this.width*this.cell/2,ground,b[1]-this.height*this.cell/2,a[0]-this.width*this.cell/2,ground+building.height,a[1]-this.height*this.cell/2,b[0]-this.width*this.cell/2,ground+building.height,b[1]-this.height*this.cell/2);
          indices.push(v,v+2,v+1,v+1,v+2,v+3);
        }
      }
      const mesh=new Mesh(`building-${building.id}`,this.scene); const data=new VertexData(); data.positions=verts; data.indices=indices; const normals:number[]=[]; VertexData.ComputeNormals(verts,indices,normals); data.normals=normals; data.applyToMesh(mesh); mesh.material=this.buildingMaterials.unbeschädigt; mesh.metadata={buildingId:building.id};
    }
    this.resize(); this.updateWater(new Float32Array(scenario.initialDepth));
    window.addEventListener('resize',this.resize);
    this.engine.runRenderLoop(()=>{this.animateFlow(this.flowClock.tick(performance.now()/1000));this.scene.render();});
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
  updateState(bed:Float32Array, buildings:BuildingStatus[], dams:[string,number][], revision:number, trenches:number[]):void {
    this.currentBuildings=new Map(buildings.map(b=>[b.id,b]));
    for(const b of buildings) {const mesh=this.scene.getMeshByName(`building-${b.id}`);if(mesh)mesh.material=this.buildingMaterials[buildingCondition(b)];}
    if(revision===this.terrainRevision) return;
    this.terrainRevision=revision;
    const bedChanged=this.bed.length!==bed.length || bed.some((value,i)=>value!==this.bed[i]);
    if(bedChanged) {
      this.bed=Array.from(bed);
      for(let y=0;y<=this.height;y++) for(let x=0;x<=this.width;x++) {
        const i=Math.min(y,this.height-1)*this.width+Math.min(x,this.width-1), v=y*(this.width+1)+x;
        this.landPositions[v*3+1]=this.bed[i];
      }
      this.land.updateVerticesData(VertexBuffer.PositionKind,this.landPositions,true);
      if(this.roads && this.roadPositions){
        for(let i=0;i<this.roadPositions.length;i+=3) {
          const x=this.roadPositions[i]+this.width*this.cell/2,y=this.roadPositions[i+2]+this.height*this.cell/2;
          this.roadPositions[i+1]=terrainHeight(x,y,this.width,this.height,this.cell,this.bed)+0.05;
        }
        this.roads.updateVerticesData(VertexBuffer.PositionKind,this.roadPositions,true);
      }
      this.updateSurveyRidges();
    }
    this.updateTrenches(trenches);
    for(const b of buildings) {const mesh=this.scene.getMeshByName(`building-${b.id}`); if(mesh) mesh.setEnabled(!b.demolished);}
    const signature=JSON.stringify(dams);
    if(signature!==this.damSignature) {
      this.damSignature=signature; this.damMesh?.dispose();
      const lines=dams.map(([key,crest])=>{const [axis,raw]=key.split(':'),index=Number(raw); return this.facePoints({axis:axis as 'x'|'y',index},crest+0.5);});
      if(lines.length) {this.damMesh=CreateLineSystem('confirmed-dams',{lines},this.scene);this.damMesh.color=new Color3(0.75,0.29,0.12);this.damMesh.isPickable=false;}
    }
  }
  private updateTrenches(cells:number[]):void {
    this.flowTrenchCells=trenchFlowCells(cells);
    this.trenchMesh?.dispose();this.trenchMesh=undefined;
    if(!cells.length)return;
    const positions:number[]=[],indices:number[]=[];
    for(const i of cells){
      const x=i%this.width,y=Math.floor(i/this.width),base=positions.length/3;
      for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]){
        const px=(x+dx)*this.cell,py=(y+dy)*this.cell;
        positions.push(px-this.width*this.cell/2,terrainHeight(px,py,this.width,this.height,this.cell,this.bed)+0.15,py-this.height*this.cell/2);
      }
      indices.push(base,base+1,base+2,base+1,base+3,base+2);
    }
    const mesh=new Mesh('confirmed-trenches',this.scene),data=new VertexData();data.positions=positions;data.indices=indices;
    const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);data.normals=normals;data.applyToMesh(mesh);
    mesh.material=this.trenchMaterial;mesh.isPickable=false;this.trenchMesh=mesh;
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
    this.surveyMesh=CreateLineSystem('survey-ridges',{lines},this.scene);
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
    // Babylon applies the engine hardware scaling itself when constructing the picking ray.
    const hit=this.scene.pick(clientX-rect.left,clientY-rect.top,m=>m.isEnabled()&&m.isVisible&&m.isPickable&&(buildingOnly?!!m.metadata?.buildingId:m===this.land||m===this.water));
    if(!hit?.hit||!hit.pickedPoint) return undefined;
    return {x:hit.pickedPoint.x+this.width*this.cell/2,y:hit.pickedPoint.z+this.height*this.cell/2,buildingId:hit.pickedMesh?.metadata?.buildingId};
  }
  showStart(point:{x:number;y:number}):void {
    this.showPreview();
    this.previewStart=point;
    const x=point.x-this.width*this.cell/2,y=point.y-this.height*this.cell/2;
    const h=this.startHeight(point),r=this.cell*1.5;
    this.previewMesh=CreateLineSystem('preview-start',{lines:[
      [new Vector3(x-r,h,y),new Vector3(x+r,h,y)],
      [new Vector3(x,h,y-r),new Vector3(x,h,y+r)],
    ],updatable:true},this.scene);
    this.previewMesh.color=new Color3(1,0.38,0.08);this.previewMesh.isPickable=false;
    this.previewMesh.alwaysSelectAsActiveMesh=true;
  }
  private startHeight(point:{x:number;y:number}):number {
    const cx=Math.max(0,Math.min(this.width-1,Math.floor(point.x/this.cell))),cy=Math.max(0,Math.min(this.height-1,Math.floor(point.y/this.cell)));
    let surface=terrainHeight(point.x,point.y,this.width,this.height,this.cell,this.bed);
    for(const dx of [0,1]) for(const dy of [0,1]) {
      const i=Math.min(cy+dy,this.height-1)*this.width+Math.min(cx+dx,this.width-1);
      surface=Math.max(surface,this.bed[i]+this.currentDepth[i]);
    }
    return surface+1.5;
  }
  showPreview(action?:Action):void {
    this.previewMesh?.dispose(); this.previewMesh=undefined;this.previewStart=undefined;
    for(const m of this.scene.meshes) if(m.metadata?.buildingId) m.renderOverlay=false;
    if(!action)return;
    if(action.kind==='demolish') {const m=this.scene.getMeshByName(`building-${action.buildingId}`); if(m){m.renderOverlay=true;m.overlayColor=new Color3(1,0.3,0.1);m.overlayAlpha=0.55;}return;}
    let lines:Vector3[][]=[];
    if(action.kind==='dam') lines=action.faces.map(face=>this.facePoints(face,damCrest(face,this.width,this.height,this.bed,this.scenario.parameters.damHeight)+0.5));
    else lines=action.cells.map(i=>{const x=i%this.width,y=Math.floor(i/this.width),h=this.bed[i]+1;return [new Vector3((x+.2)*this.cell-this.width*this.cell/2,h,(y+.5)*this.cell-this.height*this.cell/2),new Vector3((x+.8)*this.cell-this.width*this.cell/2,h,(y+.5)*this.cell-this.height*this.cell/2)];});
    if(lines.length){this.previewMesh=CreateLineSystem('preview',{lines},this.scene);this.previewMesh.color=new Color3(1,0.38,0.08);this.previewMesh.isPickable=false;}
  }
  inspect(clientX:number,clientY:number):string {
    const building=this.pick(clientX,clientY,true);
    if(building?.buildingId) {
      const b=this.currentBuildings.get(building.buildingId);
      if(b) return `Gebäude ${buildingCondition(b)}: Flutschaden ${Math.round(b.damage).toLocaleString('de-AT')} von ${Math.round(b.value).toLocaleString('de-AT')}; Wassertiefe am Rand ${b.exposure.toFixed(2)} m.`;
    }
    const point=this.pick(clientX,clientY);
    if(!point) return 'Keine Stelle auf der Karte ausgewählt.';
    const x=Math.max(0,Math.min(this.width-1,Math.floor(point.x/this.cell))),y=Math.max(0,Math.min(this.height-1,Math.floor(point.y/this.cell)));
    const i=y*this.width+x,depth=this.currentDepth[i]??0;
    return depth>0.02?`Wassertiefe: ${depth.toFixed(2)} m · Wasserspiegel: ${(this.bed[i]+depth).toFixed(2)} m über Wiener Null.`:`Wassertiefe: ${depth.toFixed(2)} m (trocken oder sehr flach).`;
  }
  private animateFlow(now:number):void {
    const positions=this.flowPositions;positions.fill(0);
    const regularCount=Math.ceil(this.width/12)*Math.ceil(this.height/12);
    const length=flowArrowLength(this.zoom,this.canvas.clientHeight);
    for(let i=0;i<this.flowSamples.length;i++) {
      const a=this.flowSamples[i],speed=Math.hypot(a.vx,a.vy);
      if(speed<0.01)continue;
      // Keep trench markers near their narrow sampled cell instead of drifting onto dry land.
      const ux=a.vx/speed,uy=a.vy/speed,phase=((now*Math.min(speed,3)/5+i*.37)%1-.5)*this.cell*(i<regularCount?5:0.75);
      const x=a.x+ux*phase,y=a.y+uy*phase;
      writeFlowArrow(positions,i*18,x,y,a.height,ux,uy,i<regularCount?length:Math.min(length,this.cell*1.5));
    }
    this.flowLines.updateVerticesData(VertexBuffer.PositionKind,positions);
  }
  updateWater(depth:Float32Array, qx?:Float32Array, qy?:Float32Array): void {
    if(depth.length!==this.width*this.height) throw new Error('Ungültiger Wasser-Snapshot');
    this.currentDepth.set(depth);
    if(this.previewStart && this.previewMesh) {
      const positions=this.previewMesh.getVerticesData(VertexBuffer.PositionKind),height=this.startHeight(this.previewStart);
      if(positions) {for(let i=1;i<positions.length;i+=3)positions[i]=height;this.previewMesh.updateVerticesData(VertexBuffer.PositionKind,positions);}
    }
    if(qx && qy) {
      let sampleIndex=0;
      for(let y=0;y<this.height;y+=12) for(let x=0;x<this.width;x+=12) {
        const i=y*this.width+x,h=depth[i];
        const sample=this.flowSamples[sampleIndex++]??(this.flowSamples[this.flowSamples.length]={x:x*this.cell-this.width*this.cell/2,y:y*this.cell-this.height*this.cell/2,height:0,vx:0,vy:0});
        sample.height=this.bed[i]+h+0.3;sample.vx=h>0.05?qx[i]/h:0;sample.vy=h>0.05?qy[i]/h:0;
      }
      for(const i of this.flowTrenchCells) {
        const x=i%this.width,y=Math.floor(i/this.width),h=depth[i];
        const sample=this.flowSamples[sampleIndex++]??(this.flowSamples[this.flowSamples.length]={x:0,y:0,height:0,vx:0,vy:0});
        sample.x=(x+.5)*this.cell-this.width*this.cell/2;sample.y=(y+.5)*this.cell-this.height*this.cell/2;
        // The centre lies on the water mesh's diagonal between its east and south vertices.
        const east=y*this.width+Math.min(x+1,this.width-1),south=Math.min(y+1,this.height-1)*this.width+x;
        sample.height=(this.bed[east]+depth[east]+this.bed[south]+depth[south])/2+0.5;
        sample.vx=h>0.05?qx[i]/h:0;sample.vy=h>0.05?qy[i]/h:0;
      }
      this.flowSamples.length=sampleIndex;
    }
    let topologyChanged=!this.wetTopologyReady;
    for(let y=0;y<=this.height;y++) for(let x=0;x<=this.width;x++) {
      const i=Math.min(y,this.height-1)*this.width+Math.min(x,this.width-1), v=y*(this.width+1)+x;
      const wet=depth[i]>0.02?1:0;
      if(this.wetVertices[v]!==wet){this.wetVertices[v]=wet;topologyChanged=true;}
      this.waterPositions[v*3+1]=this.bed[i]+depth[i]+0.08;
      this.waterColors[v*4+3]=depth[i]>0.02 ? 0.78 : 0;
    }
    if(topologyChanged){this.water.setIndices(visibleWaterIndices(this.width,this.height,this.wetVertices,this.waterIndexBuffer),undefined,true);this.wetTopologyReady=true;}
    this.water.updateVerticesData(VertexBuffer.PositionKind,this.waterPositions,true);
    this.water.updateVerticesData(VertexBuffer.ColorKind,this.waterColors);
  }
  setFlowRunning(running:boolean,speed:1|2):void {this.flowClock.setRate(running?speed:0,performance.now()/1000);}
  resetView():void { this.flowClock.reset(performance.now()/1000);this.zoom=560; this.camera.setTarget(Vector3.Zero()); this.camera.alpha=INITIAL_ALPHA; this.camera.beta=INITIAL_BETA; this.camera.radius=INITIAL_RADIUS; this.resize(); }
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
