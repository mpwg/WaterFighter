/** Write one horizontal arrow as three line segments into a reusable vertex buffer. */
export function writeFlowArrow(p:Float32Array,o:number,x:number,z:number,height:number,ux:number,uz:number):void {
  const tipX=x+ux*3,tipZ=z+uz*3,baseX=tipX-ux*2,baseZ=tipZ-uz*2;
  p[o]=x-ux*3;p[o+1]=height;p[o+2]=z-uz*3;p[o+3]=tipX;p[o+4]=height;p[o+5]=tipZ;
  p[o+6]=tipX;p[o+7]=height;p[o+8]=tipZ;p[o+9]=baseX-uz*1.5;p[o+10]=height;p[o+11]=baseZ+ux*1.5;
  p[o+12]=tipX;p[o+13]=height;p[o+14]=tipZ;p[o+15]=baseX+uz*1.5;p[o+16]=height;p[o+17]=baseZ-ux*1.5;
}
