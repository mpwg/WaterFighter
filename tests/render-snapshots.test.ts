import {expect,it,vi} from 'vitest';
import {World} from '../src/render/world';

it('markiert ein kleines Abrissziel und entfernt die Markierung beim Verwerfen',async()=>{
  const {NullEngine}=await import('@babylonjs/core/Engines/nullEngine');
  const {Scene}=await import('@babylonjs/core/scene');
  const {CreateBox}=await import('@babylonjs/core/Meshes/Builders/boxBuilder');
  const engine=new NullEngine(),scene=new Scene(engine),mesh=CreateBox('small',{size:2},scene);
  mesh.metadata={buildingId:'small'};mesh.computeWorldMatrix(true);
  const world={scene,cell:4,scenario:{buildings:[{id:'small',area:4}]},buildingMeshes:new Map([['small',mesh]])} as any;
  try {
    World.prototype.showPreview.call(world,{kind:'demolish',buildingId:'small'});
    const marker=world.previewMesh;expect(marker.name).toBe('preview-building-marker');expect(marker.isPickable).toBe(false);expect(mesh.renderOverlay).toBe(true);
    World.prototype.showPreview.call(world);expect(marker.isDisposed()).toBe(true);expect(mesh.renderOverlay).toBe(false);
  } finally {scene.dispose();engine.dispose();}
});

it('bewahrt die Wasserabfrage beim Wiederverwenden des Snapshot-Puffers und aktualisiert Strömung',()=>{
  const world={width:2,height:2,cell:4,bed:[0,0,0,0],currentDepth:new Float32Array(4),flowSamples:[],flowTrenchCells:[],
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
    const positions=world.previewDamMesh.getVerticesData(VertexBuffer.PositionKind);
    expect(world.previewDamMesh.isPickable).toBe(false);expect(world.previewDamMesh.renderingGroupId).toBe(2);
    expect(Math.abs(positions[0]-positions[3])+Math.abs(positions[2]-positions[5])).toBeCloseTo(4);
    for(const [index,face] of faces.entries()){
      const result=game.apply(`dam-${index}`,{kind:'dam',faces:[face]});expect(result.ok).toBe(true);
      expect(game.damFaces.get(`${face.axis}:${face.index}`)).toBe(9);
      expect(positions[index*12+1]).toBeCloseTo(9.5);
      expect(positions[index*12+4]).toBeCloseTo(9.5);
    }
  } finally {scene.dispose();engine.dispose();}
});

it('zeichnet nur bestätigte Grabenzellen und entfernt die Markierung beim Neustart',async()=>{
  const {NullEngine}=await import('@babylonjs/core/Engines/nullEngine');
  const {Scene}=await import('@babylonjs/core/scene');
  const {StandardMaterial}=await import('@babylonjs/core/Materials/standardMaterial');
  const engine=new NullEngine(),scene=new Scene(engine),material=new StandardMaterial('trench',scene);
  const world={width:2,height:2,cell:4,bed:[0,0,0,0],currentDepth:new Float32Array(4),scene,trenchMaterial:material,scenario:{parameters:{outflowEdges:[]}},
    wetVertices:new Uint8Array(9),waterIndexBuffer:new Uint16Array(24),wetTopologyReady:false,waterPositions:new Float32Array(27),waterColors:new Float32Array(36),
    water:{setIndices:vi.fn(),updateVerticesData:vi.fn()}} as any;
  try {
    (World.prototype as any).updateTrenches.call(world,[0,1]);
    expect(world.flowTrenchCells).toEqual([0]);
    expect(world.trenchMesh.name).toBe('confirmed-trenches');expect(world.trenchMesh.isPickable).toBe(false);
    expect(world.trenchMesh.getTotalVertices()).toBe(8);expect(world.trenchMesh.getTotalIndices()).toBe(12);
    expect(world.trenchRouteMesh.name).toBe('trench-route-overlay');expect(world.trenchRouteMesh.isPickable).toBe(false);
    expect(world.trenchRouteMesh.renderingGroupId).toBe(1);expect(world.trenchRouteCells).toEqual([0,0,1,1]);
    expect(world.trenchRouteMesh.getTotalVertices()).toBe(4);expect(world.trenchRouteMesh.getTotalIndices()).toBe(6);
    World.prototype.updateWater.call(world,new Float32Array([3,3,3,3]));
    expect(world.trenchRoutePositions[1]).toBeCloseTo(3.65);expect(world.trenchRoutePositions[4]).toBeCloseTo(3.65);
    World.prototype.updateWater.call(world,new Float32Array([1,2,3,4]));
    expect(world.trenchRoutePositions[1]).toBeCloseTo(3.15);expect(world.trenchRoutePositions[4]).toBeCloseTo(3.15);expect(world.trenchRoutePositions[7]).toBeCloseTo(3.65);
    const old=world.trenchMesh,oldRoute=world.trenchRouteMesh;(World.prototype as any).updateTrenches.call(world,[]);
    expect(old.isDisposed()).toBe(true);expect(world.trenchMesh).toBeUndefined();expect(oldRoute.isDisposed()).toBe(true);expect(world.trenchRouteMesh).toBeUndefined();
    expect(world.flowTrenchCells).toEqual([]);
    world.scenario.parameters.outflowEdges=['left'];(World.prototype as any).updateTrenches.call(world,[0,1]);
    expect(world.trenchRouteMesh.getTotalVertices()).toBe(8);
    expect(world.trenchRoutePositions[6*3]).toBeCloseTo(-4);
    expect(world.trenchOutletMesh.name).toBe('trench-outlet');expect(world.trenchOutletMesh.isPickable).toBe(false);
    expect(world.trenchOutletCells).toEqual([0,0,0,0,0,0]);
    World.prototype.updateWater.call(world,new Float32Array([3,3,3,3]));
    expect(world.trenchOutletMesh.getVerticesData('position')[1]).toBeCloseTo(5);
    const outlet=world.trenchOutletMesh;(World.prototype as any).updateTrenches.call(world,[]);expect(outlet.isDisposed()).toBe(true);
  } finally {scene.dispose();engine.dispose();}
});

it('hält die Graben-Vorschau zusammenhängend über steigendem Wasser',async()=>{
  const {NullEngine}=await import('@babylonjs/core/Engines/nullEngine');
  const {Scene}=await import('@babylonjs/core/scene');
  const engine=new NullEngine(),scene=new Scene(engine);
  const world={width:2,height:2,cell:4,bed:[0,0,0,0],currentDepth:new Float32Array(4),scene,previewTrenchCells:[],
    wetVertices:new Uint8Array(9),waterIndexBuffer:new Uint16Array(24),wetTopologyReady:false,waterPositions:new Float32Array(27),waterColors:new Float32Array(36),water:{setIndices:vi.fn(),updateVerticesData:vi.fn()}} as any;
  try {
    World.prototype.showPreview.call(world,{kind:'trench',cells:[0,1]});
    expect(world.previewMesh.isPickable).toBe(false);expect(world.previewMesh.renderingGroupId).toBe(2);
    expect(world.previewTrenchCells).toEqual([0,1,0,1,0,1]);
    World.prototype.updateWater.call(world,new Float32Array([3,3,3,3]));
    const positions=world.previewMesh.getVerticesData('position');expect(positions[1]).toBeCloseTo(4.5);expect(positions[4]).toBeCloseTo(4.5);
    World.prototype.showPreview.call(world);expect(world.previewMesh).toBeUndefined();expect(world.previewTrenchCells).toEqual([]);
  } finally {scene.dispose();engine.dispose();}
});

it('zeigt Strömung in bestätigten Grabenzellen und entfernt ihre Marker nach Neustart',()=>{
  const world={width:2,height:2,cell:4,zoom:180,canvas:{clientHeight:800},bed:[0,0,0,0],currentDepth:new Float32Array(4),flowSamples:[],flowTrenchCells:[1],
    wetVertices:new Uint8Array(9),waterIndexBuffer:new Uint16Array(24),wetTopologyReady:false,waterPositions:new Float32Array(27),waterColors:new Float32Array(36),
    flowPositions:new Float32Array(36),flowLines:{updateVerticesData:vi.fn()},water:{setIndices:vi.fn(),updateVerticesData:vi.fn()}} as any;
  const depth=new Float32Array([0,1,0,0]),qx=new Float32Array([0,-2,0,0]),qy=new Float32Array(4);
  World.prototype.updateWater.call(world,depth,qx,qy);
  expect(world.flowSamples).toHaveLength(2);expect(world.flowSamples[1]).toMatchObject({x:2,y:-2,height:1,vx:-2,vy:0});
  (World.prototype as any).animateFlow.call(world,1);expect([...world.flowPositions.slice(18)]).not.toEqual(Array(18).fill(0));
  for(const t of [0,1,2,3,4]){
    (World.prototype as any).animateFlow.call(world,t);
    const centre=(world.flowPositions[18]+world.flowPositions[21])/2;
    expect(Math.abs(centre-2)).toBeLessThanOrEqual(1.5);
  }
  world.flowTrenchCells=[];World.prototype.updateWater.call(world,depth,qx,qy);
  expect(world.flowSamples).toHaveLength(1);
  (World.prototype as any).animateFlow.call(world,1);expect([...world.flowPositions.slice(18)]).toEqual(Array(18).fill(0));
});

it('enlarges overview flow arrows while keeping trench markers close to their cells',()=>{
  const world={width:2,height:2,cell:4,zoom:560,canvas:{clientHeight:320},
    flowSamples:[{x:0,y:0,height:1,vx:1,vy:0},{x:10,y:10,height:1,vx:1,vy:0}],
    flowPositions:new Float32Array(36),flowLines:{updateVerticesData:vi.fn()}} as any;
  (World.prototype as any).animateFlow.call(world,0);
  expect(world.flowPositions[3]-world.flowPositions[0]).toBe(24);
  expect(world.flowPositions[21]-world.flowPositions[18]).toBeCloseTo(32,5);
});

it('keeps regular flow markers near the sampled cell centre and above the rendered surface',()=>{
  const world={width:2,height:2,cell:4,zoom:180,canvas:{clientHeight:800},bed:[0,4,2,0],currentDepth:new Float32Array(4),flowSamples:[],flowTrenchCells:[],
    wetVertices:new Uint8Array(9),waterIndexBuffer:new Uint16Array(24),wetTopologyReady:false,waterPositions:new Float32Array(27),waterColors:new Float32Array(36),
    flowPositions:new Float32Array(18),flowLines:{updateVerticesData:vi.fn()},water:{setIndices:vi.fn(),updateVerticesData:vi.fn()}} as any;
  World.prototype.updateWater.call(world,new Float32Array([1,2,3,4]),new Float32Array([2,0,0,0]),new Float32Array(4));
  expect(world.flowSamples[0]).toMatchObject({x:-2,y:-2,height:6,vx:2,vy:0});
  for(const time of [0,1,2,3,4]){
    (World.prototype as any).animateFlow.call(world,time);
    const centre=(world.flowPositions[0]+world.flowPositions[3])/2;
    expect(Math.abs(centre+2)).toBeLessThanOrEqual(1.5);
  }
});
