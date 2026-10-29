import {expect,it} from 'vitest';
import {visibleWaterIndices} from '../src/render/water-indices';
it('behält jedes Dreieck mit sichtbarem Eckpunkt und entfernt vollständig transparente',()=>{
 expect(visibleWaterIndices(1,1,new Uint8Array([0,0,0,0]))).toEqual([]);
 expect(visibleWaterIndices(1,1,new Uint8Array([1,0,0,0]))).toEqual([0,1,2]);
 expect(visibleWaterIndices(1,1,new Uint8Array([0,1,0,0]))).toEqual([0,1,2,1,3,2]);
 expect(visibleWaterIndices(1,1,new Uint8Array([0,0,0,1]))).toEqual([1,3,2]);
 expect(visibleWaterIndices(1,1,new Uint8Array([1,1,1,1]))).toEqual([0,1,2,1,3,2]);
});
