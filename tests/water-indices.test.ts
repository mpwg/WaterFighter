import {expect,it} from 'vitest';
import {visibleWaterIndices} from '../src/render/water-indices';
const indices=(wet:number[])=>Array.from(visibleWaterIndices(1,1,new Uint8Array(wet),new Uint16Array(6)));
it('behält jedes Dreieck mit sichtbarem Eckpunkt und entfernt vollständig transparente',()=>{
 expect(indices([0,0,0,0])).toEqual([]);
 expect(indices([1,0,0,0])).toEqual([0,1,2]);
 expect(indices([0,1,0,0])).toEqual([0,1,2,1,3,2]);
 expect(indices([0,0,0,1])).toEqual([1,3,2]);
 expect(indices([1,1,1,1])).toEqual([0,1,2,1,3,2]);
});
it('verwendet den bereitgestellten Puffer und verlangt bei großen Rastern 32-Bit-Indizes',()=>{
 const wet=new Uint8Array(4).fill(1),buffer=new Uint16Array(6),view=visibleWaterIndices(1,1,wet,buffer);
 expect(view.buffer).toBe(buffer.buffer);expect(Array.from(view)).toEqual([0,1,2,1,3,2]);
 wet.fill(0);expect(visibleWaterIndices(1,1,wet,buffer)).toHaveLength(0);
 const largeWet=new Uint8Array(257*257);largeWet[largeWet.length-1]=1;
 expect(()=>visibleWaterIndices(256,256,largeWet,new Uint16Array(256*256*6))).toThrow();
 const large=visibleWaterIndices(256,256,largeWet,new Uint32Array(256*256*6));
 expect(Math.max(...large)).toBe(66048);
});
