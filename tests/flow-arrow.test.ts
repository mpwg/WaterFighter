import { expect, it } from 'vitest';
import { flowArrowLength, writeFlowArrow } from '../src/render/flow-arrow';

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
