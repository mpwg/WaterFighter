import {expect,it,vi} from 'vitest';
import {World} from '../src/render/world';

it('bewahrt die Wasserabfrage beim Wiederverwenden des Snapshot-Puffers und aktualisiert Strömung',()=>{
  const world={width:2,height:2,cell:4,bed:[0,0,0,0],currentDepth:new Float32Array(4),flowSamples:[],
    wetVertices:new Uint8Array(9),waterIndexBuffer:new Uint16Array(24),wetTopologyReady:false,waterPositions:new Float32Array(27),waterColors:new Float32Array(36),
    water:{setIndices:vi.fn(),updateVerticesData:vi.fn()}} as any;
  const depth=new Float32Array([1,0,0,0]),qx=new Float32Array([2,0,0,0]),qy=new Float32Array([1,0,0,0]);
  World.prototype.updateWater.call(world,depth,qx,qy);
  const samples=world.flowSamples,first=samples[0];
  depth[0]=0;qx[0]=0;qy[0]=0;
  expect(world.currentDepth[0]).toBe(1);expect(first.vx).toBe(2);expect(first.vy).toBe(1);
  World.prototype.updateWater.call(world,depth,qx,qy);
  expect(world.currentDepth[0]).toBe(0);expect(world.flowSamples).toBe(samples);expect(world.flowSamples[0]).toBe(first);
  expect(first.vx).toBe(0);expect(first.vy).toBe(0);
});

it('zeigt die Dammvorschau auf der später bestätigten Krone bei unebenem Gelände',async()=>{
  const {NullEngine}=await import('@babylonjs/core/Engines/nullEngine');
  const {Scene}=await import('@babylonjs/core/scene');
  const {VertexBuffer}=await import('@babylonjs/core/Buffers/buffer');
  const {Game}=await import('../src/simulation/game');
  const {readFileSync}=await import('node:fs');
  const base=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  const bed=[5,2,1,0];
  const scenario={...base,grid:{...base.grid,width:2,height:2},bed,terrain:bed,initialDepth:[0,0,0,0],waterMask:[0,0,0,0],buildings:[],surveyCrests:[],parameters:{...base.parameters,inflowCells:[0]}};
  const game=new Game(scenario),engine=new NullEngine(),scene=new Scene(engine);
  const faces=[{axis:'x' as const,index:1},{axis:'y' as const,index:2}];
  const world={width:2,height:2,cell:4,bed:[...bed],scenario,scene,facePoints:(World.prototype as any).facePoints} as any;
  try {
    World.prototype.showPreview.call(world,{kind:'dam',faces});
    const positions=world.previewMesh.getVerticesData(VertexBuffer.PositionKind);
    for(const [index,face] of faces.entries()){
      const result=game.apply(`dam-${index}`,{kind:'dam',faces:[face]});expect(result.ok).toBe(true);
      expect(game.damFaces.get(`${face.axis}:${face.index}`)).toBe(9);
      expect(positions[index*6+1]).toBeCloseTo(9.5);
      expect(positions[index*6+4]).toBeCloseTo(9.5);
    }
  } finally {scene.dispose();engine.dispose();}
});

it('zeichnet nur bestätigte Grabenzellen und entfernt die Markierung beim Neustart',async()=>{
  const {NullEngine}=await import('@babylonjs/core/Engines/nullEngine');
  const {Scene}=await import('@babylonjs/core/scene');
  const {StandardMaterial}=await import('@babylonjs/core/Materials/standardMaterial');
  const engine=new NullEngine(),scene=new Scene(engine),material=new StandardMaterial('trench',scene);
  const world={width:2,height:2,cell:4,bed:[0,0,0,0],scene,trenchMaterial:material} as any;
  try {
    (World.prototype as any).updateTrenches.call(world,[0,1]);
    expect(world.trenchMesh.name).toBe('confirmed-trenches');expect(world.trenchMesh.isPickable).toBe(false);
    expect(world.trenchMesh.getTotalVertices()).toBe(8);expect(world.trenchMesh.getTotalIndices()).toBe(12);
    const old=world.trenchMesh;(World.prototype as any).updateTrenches.call(world,[]);
    expect(old.isDisposed()).toBe(true);expect(world.trenchMesh).toBeUndefined();
  } finally {scene.dispose();engine.dispose();}
});
