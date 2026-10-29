import type { Face } from './game';
/** Orthogonal, connected cell-face route; vertices are integer grid coordinates. */
export function damPath(start: [number,number], end: [number,number], width:number):Face[] {
  let [x,y]=start; const [tx,ty]=end;const faces:Face[]=[];
  while(x!==tx){const nx=x+Math.sign(tx-x);faces.push({axis:'y',index:y*width+Math.min(x,nx)});x=nx;}
  while(y!==ty){const ny=y+Math.sign(ty-y);faces.push({axis:'x',index:Math.min(y,ny)*(width+1)+x});y=ny;}
  return faces;
}
export function trenchPath(start:[number,number],end:[number,number],width:number):number[] {
  let [x,y]=start;const [tx,ty]=end;const cells=[y*width+x];
  while(x!==tx){x+=Math.sign(tx-x);cells.push(y*width+x);}while(y!==ty){y+=Math.sign(ty-y);cells.push(y*width+x);}return cells;
}
