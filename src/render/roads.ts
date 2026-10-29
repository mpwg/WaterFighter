import type { Road, Scenario } from '../scenario';

/** Height of the rendered triangular terrain grid at local map coordinates. */
export function terrainHeight(x:number,y:number,width:number,height:number,cell:number,bed:ArrayLike<number>):number {
  const gx=Math.max(0,Math.min(width,x/cell)),gy=Math.max(0,Math.min(height,y/cell));
  const ix=Math.min(width-1,Math.floor(gx)),iy=Math.min(height-1,Math.floor(gy)),fx=gx-ix,fy=gy-iy;
  const at=(cx:number,cy:number)=>bed[Math.min(height-1,cy)*width+Math.min(width-1,cx)];
  const a=at(ix,iy),b=at(ix+1,iy),c=at(ix,iy+1),d=at(ix+1,iy+1);
  return fx+fy<=1?a+fx*(b-a)+fy*(c-a):d+(1-fy)*(b-d)+(1-fx)*(c-d);
}

/** Resample ground-level OSM ways; bridges and tunnels have no measured deck height. */
export function groundRoads(scenario:Scenario):number[][][] {
  const elevated=new Set(scenario.crossings.map(c=>c.id));
  const result:number[][][]=[];
  for(const road of scenario.roads as Road[]) {
    if(elevated.has(road.id))continue;
    const points:number[][]=[road.points[0]];
    for(let i=1;i<road.points.length;i++) {
      const a=road.points[i-1],b=road.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/(scenario.grid.cellSize/2)));
      for(let n=1;n<=steps;n++)points.push([a[0]+(b[0]-a[0])*n/steps,a[1]+(b[1]-a[1])*n/steps]);
    }
    result.push(points);
  }
  return result;
}
