import type {
  Terrain
} from './types';
/** Stylised deterministic Danube waterfront, deliberately not surveyed hazard data. */
export function createTerrain(width=256,height=192):Terrain {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8) throw new Error('Grid dimensions must be integers >= 8');
  const t:Terrain={
    width,height,cellSize:2,heights:new Float64Array(width*height),obstacles:new Uint8Array(width*height),river:new Uint8Array(width*height),buildings:[],gates:[]
  };
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const center=height*(.22+.035*Math.sin(x/width*6));
    const distance=Math.abs(y-center);
    const half=height*.085;
    const i=y*width+x;
    t.river[i]=distance<half?1:0;
    t.heights[i]=distance<half ? -.95 + .2*(distance/half)**2 : .22+Math.max(0,y-height*.34)/height*1.8+.045*Math.sin(x*.14)*Math.cos(y*.19);
    if(y>height*.4 && (y%20<3 || x%32<3)) t.heights[i]-=.09;
  }
  if(width>=64&&height>=64) for(let y=Math.round(height*.42);y<height-16;y+=20) for(let x=20;x<width-12;x+=32) {
    const id=t.buildings.length;
    const b={
      id,x,y,width:7,height:6,people:2+(id*7)%5
    };
    t.buildings.push(b);
    for(let yy=y;yy<y+b.height;yy++)for(let xx=x;xx<x+b.width;xx++)t.obstacles[yy*width+xx]=1;
  }
  const x=Math.floor(width*.7),y=Math.floor(height*.35);
  // Continuous embankment with a seven-cell relief channel; the gate closes its full width.
  const gateEdges=[];
  for(let xx=0;xx<width;xx++)for(let yy=y-1;yy<=y;yy++)t.heights[yy*width+xx]=Math.abs(xx-x)<=3?.25:1.55;
  for(let xx=Math.max(0,x-3);xx<=Math.min(width-1,x+3);xx++)gateEdges.push({
    a:y*width+xx,b:(y+1)*width+xx
  });
  t.gates.push({
    id:0,a:y*width+x,b:(y+1)*width+x,x,y,sill:2.0,edges:gateEdges
  });
  return t;
}
