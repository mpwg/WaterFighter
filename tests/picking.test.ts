import { expect,it,vi } from 'vitest';
import { World } from '../src/render/world';

it('übergibt CSS-Koordinaten an Babylon, auch bei höherer Renderauflösung',()=>{
  const pick=vi.fn((_x:number,_y:number,_predicate:unknown)=>({hit:true,pickedPoint:{x:0,z:0},pickedMesh:{}}));
  const fake={canvas:{getBoundingClientRect:()=>({left:20,top:30,width:300,height:200})},engine:{getRenderWidth:()=>600,getRenderHeight:()=>400},scene:{pick},land:{},width:10,height:10,cell:4};
  World.prototype.pick.call(fake as unknown as World,170,130);
  expect(pick.mock.calls[0][0]).toBe(150);
  expect(pick.mock.calls[0][1]).toBe(100);
});
