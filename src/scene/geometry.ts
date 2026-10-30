import type { Terrain, Snapshot } from '../flood/types';
/** Cell-flat geometry preserves the exact hydraulic floor, including narrow levees. */
export function cellGeometry(t:Terrain, depths?:Float32Array) {
  const positions:number[]=[],indices:number[]=[],colors:number[]=[],uvs:number[]=[];
  for(let y=0;y<t.height;y++)for(let x=0;x<t.width;x++) {
    const i=y*t.width+x,d=depths?.[i]??0;
    if(depths&&(d<=.002||t.obstacles[i]))continue;
    const h=t.heights[i]+(depths?d+.012:0), s=t.cellSize,n=positions.length/3;
    positions.push(x*s,h,y*s,(x+1)*s,h,y*s,(x+1)*s,h,(y+1)*s,x*s,h,(y+1)*s);
    indices.push(n,n+2,n+1,n,n+3,n+2);
    uvs.push(x/8,y/8,(x+1)/8,y/8,(x+1)/8,(y+1)/8,x/8,(y+1)/8);
    const road=y>t.height*.4&&(y%20<3||x%32<3);
    const noise=(Math.sin(x*127.1+y*311.7)*43758.5453)%1*.018;
    const c=depths?[.09,.34+Math.min(d,2)*.025,.39]:t.river[i]?[.29,.32,.24]:road?[.37,.38,.36]:[.31+noise,.40+noise,.20+noise];
    for(let k=0;k<4;k++)colors.push(...c,depths?.[i]!==undefined?.84:1);
  }
  return {positions,indices,colors,uvs};
}
export function assertSnapshot(t:Terrain,s:Snapshot) {
  if(s.width!==t.width||s.height!==t.height||s.cellSize!==t.cellSize||s.depths.length!==t.heights.length)throw new Error('Scene snapshot does not match terrain');
}
/** Quarter-cell sampling follows levees and current water; rendered in a depth-cleared overlay. */
export function previewGeometry(t:Terrain,points:import('../flood/types').Point[],depths?:Float32Array) {
 const result:{x:number;y:number;z:number}[]=[];
 for(let k=1;k<points.length;k++){
  const a=points[k-1],b=points[k],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*4));
  for(let n=k===1?0:1;n<=steps;n++){
   const x=a.x+(b.x-a.x)*n/steps,y=a.y+(b.y-a.y)*n/steps;
   let h=-Infinity;
   for(const ox of [-.05,.05])for(const oy of [-.05,.05]){const cx=Math.max(0,Math.min(t.width-1,Math.floor(x+ox))),cy=Math.max(0,Math.min(t.height-1,Math.floor(y+oy))),i=cy*t.width+cx;h=Math.max(h,t.heights[i]+(depths?.[i]??0));}
   result.push({x:x*t.cellSize,y:h+.35,z:y*t.cellSize});
  }
 }
 return result;
}
