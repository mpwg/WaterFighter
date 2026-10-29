import { expect,it,vi } from 'vitest';
import { World } from '../src/render/world';

it('übergibt CSS-Koordinaten an Babylon, auch bei höherer Renderauflösung',()=>{
  const pick=vi.fn((_x:number,_y:number,_predicate:unknown)=>({hit:true,pickedPoint:{x:0,z:0},pickedMesh:{}}));
  const fake={canvas:{getBoundingClientRect:()=>({left:20,top:30,width:300,height:200})},engine:{getRenderWidth:()=>600,getRenderHeight:()=>400},scene:{pick},land:{},width:10,height:10,cell:4};
  World.prototype.pick.call(fake as unknown as World,170,130);
  expect(pick.mock.calls[0][0]).toBe(150);
  expect(pick.mock.calls[0][1]).toBe(100);
});

it('zeigt den Wasserspiegel nasser Zellen zum Vergleich und bezeichnet trockene Zellen',()=>{
  const world={width:2,height:1,cell:4,bed:[5,3],currentDepth:new Float32Array([2,0]),pick:(_x:number,_y:number,buildingOnly:boolean)=>buildingOnly?undefined:{x:_x,y:0}} as unknown as World;
  expect(World.prototype.inspect.call(world,1,0)).toBe('Wassertiefe: 2.00 m · Wasserspiegel: 7.00 m über Wiener Null.');
  expect(World.prototype.inspect.call(world,5,0)).toBe('Wassertiefe: 0.00 m (trocken oder sehr flach).');
});

it('trifft bei erhöhtem Wasser die sichtbare Oberfläche statt des versetzten Geländes',async()=>{
  const {NullEngine}=await import('@babylonjs/core/Engines/nullEngine');
  const {Scene}=await import('@babylonjs/core/scene');
  const {ArcRotateCamera}=await import('@babylonjs/core/Cameras/arcRotateCamera');
  const {Vector3,Matrix}=await import('@babylonjs/core/Maths/math.vector');
  const {CreateGround}=await import('@babylonjs/core/Meshes/Builders/groundBuilder');
  const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:false,lockstepMaxSteps:4});
  const scene=new Scene(engine);
  try {
    const camera=new ArcRotateCamera('camera',-Math.PI/2,Math.PI/4,60,Vector3.Zero(),scene);scene.activeCamera=camera;
    const land=CreateGround('land',{width:80,height:80},scene),water=CreateGround('water',{width:80,height:80},scene);water.position.y=10;
    scene.render();
    const screen=Vector3.Project(new Vector3(0,10,0),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(800,600));
    const fake={canvas:{getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})},scene,land,water,width:20,height:20,cell:4};
    const selected=World.prototype.pick.call(fake as unknown as World,screen.x,screen.y);
    const terrain=scene.pick(screen.x,screen.y,m=>m===land);
    expect(selected).toBeDefined();expect(selected!.x).toBeCloseTo(40,2);expect(selected!.y).toBeCloseTo(40,2);
    expect(terrain?.hit).toBe(true);expect(Math.abs(terrain!.pickedPoint!.z)).toBeGreaterThan(4);
    const {CreateBox}=await import('@babylonjs/core/Meshes/Builders/boxBuilder');
    const building=CreateBox('building',{size:4},scene);building.position.y=10;building.metadata={buildingId:'house'};
    building.setEnabled(false);scene.render();
    expect(World.prototype.pick.call(fake as unknown as World,screen.x,screen.y,true)).toBeUndefined();
    building.setEnabled(true);scene.render();
    expect(World.prototype.pick.call(fake as unknown as World,screen.x,screen.y,true)?.buildingId).toBe('house');
  } finally {scene.dispose();engine.dispose();}
});
