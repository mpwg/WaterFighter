import type { Face } from './game';

/** Dam crest above the higher adjacent bed; boundary faces use the nearest cell. */
export function damCrest(face:Face, width:number, height:number, bed:ArrayLike<number>, damHeight:number):number {
  const x=face.axis==='x'?face.index%(width+1):face.index%width;
  const y=face.axis==='x'?Math.floor(face.index/(width+1)):Math.floor(face.index/width);
  const at=(cx:number,cy:number)=>bed[Math.max(0,Math.min(height-1,cy))*width+Math.max(0,Math.min(width-1,cx))];
  return Math.max(at(face.axis==='x'?x-1:x,face.axis==='y'?y-1:y),at(x,y))+damHeight;
}
