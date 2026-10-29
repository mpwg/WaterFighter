import type { Face } from './game';
/** Orthogonal, connected cell-face route; vertices are integer grid coordinates. */
export function damPath(start: [number,number], end: [number,number], width:number):Face[] {
  let [x,y]=start; const [tx,ty]=end;const faces:Face[]=[];
  while(x!==tx){const nx=x+Math.sign(tx-x);faces.push({axis:'y',index:y*width+Math.min(x,nx)});x=nx;}
  while(y!==ty){const ny=y+Math.sign(ty-y);faces.push({axis:'x',index:Math.min(y,ny)*(width+1)+x});y=ny;}
  return faces;
}
/** A face-connected raster approximation of the line between two selected cells. */
export function trenchPath(start:[number,number],end:[number,number],width:number):number[] {
  // Canonical traversal makes reversing the selected endpoints preserve the same cells.
  const reverse=start[0]>end[0] || (start[0]===end[0] && start[1]>end[1]);
  let [x,y]=reverse?end:start;const [tx,ty]=reverse?start:end;
  const dx=Math.abs(tx-x),dy=Math.abs(ty-y),cells=[y*width+x];let ix=0,iy=0;
  while(ix<dx||iy<dy) {
    if(ix<dx && (iy===dy || (2*ix+1)*dy<=(2*iy+1)*dx)) {x+=Math.sign(tx-x);ix++;}
    else {y+=Math.sign(ty-y);iy++;}
    cells.push(y*width+x);
  }
  return reverse?cells.reverse():cells;
}
