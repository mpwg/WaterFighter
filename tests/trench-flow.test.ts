import {expect,it} from 'vitest';
import {MAX_TRENCH_FLOW_SAMPLES,trenchFlowCells} from '../src/render/trench-flow';

it('verteilt Marker entlang kurzer Gräben und begrenzt lange gleichmäßig',()=>{
  expect(trenchFlowCells([4,5,6])).toEqual([4]);
  const samples=trenchFlowCells(Array.from({length:1200},(_,i)=>i));
  expect(samples).toHaveLength(MAX_TRENCH_FLOW_SAMPLES);
  expect(samples[0]).toBe(0);expect(samples.at(-1)).toBe(1194);
  expect(new Set(samples).size).toBe(samples.length);
});
