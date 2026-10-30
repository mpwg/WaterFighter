import { expect, it } from 'vitest';
import { flowArrowLength, flowLineColors, writeFlowArrow } from '../src/render/flow-arrow';

it('colors all segments of trench samples differently from regular water samples',()=>{
  const colors=flowLineColors(2,1);
  expect(colors).toHaveLength(9);
  for(const line of colors.slice(0,6))expect(line.map(c=>c.asArray())).toEqual([[0.8,0.96,0.99,1],[0.8,0.96,0.99,1]]);
  for(const line of colors.slice(6))expect(line.map(c=>c.asArray())).toEqual([[0.04,0.20,0.32,1],[0.04,0.20,0.32,1]]);
});

it('passes the two marker colors into a Babylon line-system vertex buffer',async()=>{
  const {NullEngine}=await import('@babylonjs/core/Engines/nullEngine');
  const {Scene}=await import('@babylonjs/core/scene');
  const {Vector3}=await import('@babylonjs/core/Maths/math.vector');
  const {VertexBuffer}=await import('@babylonjs/core/Buffers/buffer');
  const {CreateLineSystem}=await import('@babylonjs/core/Meshes/Builders/linesBuilder');
  const engine=new NullEngine(),scene=new Scene(engine);
  try {
    const mesh=CreateLineSystem('flow-colors',{lines:Array.from({length:6},()=>[Vector3.Zero(),Vector3.Zero()]),colors:flowLineColors(1,1),useVertexAlpha:false},scene);
    expect(mesh.useVertexColor).toBe(true);
    const colors=mesh.getVerticesData(VertexBuffer.ColorKind)!;
    expect(colors[0]).toBeCloseTo(0.8);expect(colors[1]).toBeCloseTo(0.96);
    expect(colors[24]).toBeCloseTo(0.04);expect(colors[25]).toBeCloseTo(0.20);
  } finally {scene.dispose();engine.dispose();}
});

it('points the shaft and both arrowhead segments in the flow direction',()=>{
  const buffer=new Float32Array(18);
  writeFlowArrow(buffer,0,10,20,7,1,0);
  expect([...buffer]).toEqual([7,7,20,13,7,20,13,7,20,11,7,21.5,13,7,20,11,7,18.5]);
  writeFlowArrow(buffer,0,10,20,7,0,-1);
  expect([...buffer]).toEqual([10,7,23,10,7,17,10,7,17,11.5,7,19,10,7,17,8.5,7,19]);
});

 it('increases overview arrows with camera scale while bounding their length',()=>{
  expect(flowArrowLength(25,480)).toBeCloseTo(3.75);
  expect(flowArrowLength(180,844)).toBe(6);
  expect(flowArrowLength(560,844)).toBeCloseTo(10.616,2);
  expect(flowArrowLength(950,320)).toBe(24);
  const buffer=new Float32Array(18);
  writeFlowArrow(buffer,0,0,0,1,1,0,12);
  expect(buffer[0]).toBe(-6);expect(buffer[3]).toBe(6);
});
