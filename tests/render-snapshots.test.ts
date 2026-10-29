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
