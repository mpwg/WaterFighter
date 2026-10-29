/** Keep triangles with any visible vertex; fully transparent triangles cannot contribute color. */
export function visibleWaterIndices(width:number,height:number,wet:Uint8Array):number[] {
  const stride=width+1;
  if(wet.length!==stride*(height+1))throw new Error('Ungültige Wassermaske');
  const indices:number[]=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const i=y*stride+x, a=i,b=i+1,c=i+stride,d=c+1;
    if(wet[a]||wet[b]||wet[c])indices.push(a,b,c);
    if(wet[b]||wet[d]||wet[c])indices.push(b,d,c);
  }
  return indices;
}
