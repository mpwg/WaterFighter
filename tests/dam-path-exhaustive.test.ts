import {expect,it} from 'vitest';
import {damPath} from '../src/simulation/path';
import type {Face} from '../src/simulation/game';

it('verbindet alle Punktpaare eines kleinen Rasters direkt und richtungsunabhängig',()=>{
  const width=12;
  const endpoints=(face:Face):[number,number][]=>{
    const x=face.axis==='x'?face.index%(width+1):face.index%width;
    const y=face.axis==='x'?Math.floor(face.index/(width+1)):Math.floor(face.index/width);
    return face.axis==='x'?[[x,y],[x,y+1]]:[[x,y],[x+1,y]];
  };
  for(let x=0;x<=10;x++)for(let y=0;y<=10;y++)for(let tx=0;tx<=10;tx++)for(let ty=0;ty<=10;ty++){
    const path=damPath([x,y],[tx,ty],width),reverse=damPath([tx,ty],[x,y],width);
    expect(path).toHaveLength(Math.abs(tx-x)+Math.abs(ty-y));
    expect(path).toEqual(reverse.reverse());
    let point=[x,y];const seen=new Set<string>(),dx=tx-x,dy=ty-y;
    for(const face of path){
      const key=`${face.axis}:${face.index}`;expect(seen.has(key)).toBe(false);seen.add(key);
      const ends=endpoints(face),side=ends.findIndex(p=>p[0]===point[0]&&p[1]===point[1]);expect(side).not.toBe(-1);
      point=ends[1-side];
      const distance=Math.abs((point[0]-x)*dy-(point[1]-y)*dx)/Math.hypot(dx,dy);
      expect(distance).toBeLessThanOrEqual(Math.SQRT1_2+1e-12);
    }
    expect(point).toEqual([tx,ty]);
  }
});
