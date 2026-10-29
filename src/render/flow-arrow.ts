/** Keep arrows legible in overview without enlarging them indefinitely. */
export function flowArrowLength(zoom:number,viewportHeight:number):number {
  return Math.max(6,Math.min(24,16*zoom/Math.max(1,viewportHeight)));
}

/** Write one horizontal arrow as three line segments into a reusable vertex buffer. */
export function writeFlowArrow(p:Float32Array,o:number,x:number,z:number,height:number,ux:number,uz:number,length=6):void {
  const scale=length/6,tipX=x+ux*3*scale,tipZ=z+uz*3*scale,baseX=tipX-ux*2*scale,baseZ=tipZ-uz*2*scale;
  p[o]=x-ux*3*scale;p[o+1]=height;p[o+2]=z-uz*3*scale;p[o+3]=tipX;p[o+4]=height;p[o+5]=tipZ;
  p[o+6]=tipX;p[o+7]=height;p[o+8]=tipZ;p[o+9]=baseX-uz*1.5*scale;p[o+10]=height;p[o+11]=baseZ+ux*1.5*scale;
  p[o+12]=tipX;p[o+13]=height;p[o+14]=tipZ;p[o+15]=baseX+uz*1.5*scale;p[o+16]=height;p[o+17]=baseZ-ux*1.5*scale;
}
