import {expect,it} from 'vitest';
import {damPath} from '../src/simulation/path';
import type {Face} from '../src/simulation/game';

it('bildet eine zusammenhängende direkte Dammroute unabhängig von der Auswahlrichtung',()=>{
 const width=30;
 const ends=(face:Face):number[][]=>{const x=face.axis==='x'?face.index%(width+1):face.index%width,y=face.axis==='x'?Math.floor(face.index/(width+1)):Math.floor(face.index/width);return face.axis==='x'?[[x,y],[x,y+1]]:[[x,y],[x+1,y]];};
 for(const [a,b] of [[[2,3],[17,12]],[[2,12],[17,3]],[[4,1],[4,20]],[[1,4],[20,4]],[[4,4],[4,4]]] as [number,number][][]){
  const start=a as [number,number],end=b as [number,number],faces=damPath(start,end,width);
  expect(faces).toHaveLength(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]));
  expect(damPath(end,start,width)).toEqual([...faces].reverse());
  if(faces.length){expect(ends(faces[0])).toContainEqual(start);expect(ends(faces.at(-1)!)).toContainEqual(end);}
  for(let i=1;i<faces.length;i++)expect(ends(faces[i]).some(p=>ends(faces[i-1]).some(q=>p[0]===q[0]&&p[1]===q[1]))).toBe(true);
 }
 expect(damPath([0,0],[3,3],width)).toEqual([{axis:'y',index:0},{axis:'x',index:1},{axis:'y',index:31},{axis:'x',index:33},{axis:'y',index:62},{axis:'x',index:65}]);
});
