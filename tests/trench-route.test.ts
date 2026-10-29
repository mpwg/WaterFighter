import {expect,it} from 'vitest';
import {trenchRouteSegments} from '../src/render/trench-route';

it('verbindet nur benachbarte bestätigte Zellen und zeigt Einzelzellen',()=>{
  expect(trenchRouteSegments([0,1,4,6],3)).toEqual([[0,1],[1,4],[6,6]]);
  expect(trenchRouteSegments([2,3],3)).toEqual([[2,2],[3,3]]);
  expect(trenchRouteSegments([],3)).toEqual([]);
});
