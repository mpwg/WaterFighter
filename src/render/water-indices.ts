/** Keep triangles with any visible vertex; fully transparent triangles cannot contribute color. */
export function visibleWaterIndices(width:number,height:number,wet:Uint8Array,buffer:Uint16Array|Uint32Array):Uint16Array|Uint32Array {
  const stride=width+1;
  if(wet.length!==stride*(height+1)||buffer.length<width*height*6||(buffer instanceof Uint16Array&&wet.length>65536))throw new Error('Ungültige Wassermaske oder Indexpuffer');
  let count=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const i=y*stride+x, a=i,b=i+1,c=i+stride,d=c+1;
    if(wet[a]||wet[b]||wet[c]){buffer[count++]=a;buffer[count++]=b;buffer[count++]=c;}
    if(wet[b]||wet[d]||wet[c]){buffer[count++]=b;buffer[count++]=d;buffer[count++]=c;}
  }
  return buffer.subarray(0,count);
}
