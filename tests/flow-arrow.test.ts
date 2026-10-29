import { expect, it } from 'vitest';
import { writeFlowArrow } from '../src/render/flow-arrow';

it('points the shaft and both arrowhead segments in the flow direction',()=>{
  const buffer=new Float32Array(18);
  writeFlowArrow(buffer,0,10,20,7,1,0);
  expect([...buffer]).toEqual([7,7,20,13,7,20,13,7,20,11,7,21.5,13,7,20,11,7,18.5]);
  writeFlowArrow(buffer,0,10,20,7,0,-1);
  expect([...buffer]).toEqual([10,7,23,10,7,17,10,7,17,11.5,7,19,10,7,17,8.5,7,19]);
});
