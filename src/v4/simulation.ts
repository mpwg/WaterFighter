import type { Audit, V4Map } from './types';
export interface Simulation {
  map: V4Map; depths: Float64Array; flowX: Float32Array; flowY: Float32Array;
  blocked: Uint16Array; demolished: Set<string>; barriers: Set<string>;
  faceA: Int32Array; faceB: Int32Array; momentum: Float64Array; transfers: Float64Array;
  crests: Float64Array; outgoing: Float64Array; faceLookup: Map<number, number>;
  boundaryCells: number[]; flood: boolean; boundary: 'closed'|'open'; inflow: number; outflow: number;
  initialVolume: number | null;
}
const GRAVITY = 9.81;
/** Arcade clock: one game second represents six hydraulic seconds. This is not a forecast. */
const TIME_SCALE = 6;
export function createSimulation(map: V4Map, options: { flood?: boolean; boundary?: 'closed'|'open' } = {}): Simulation {
  const n=map.width*map.height, a:number[]=[],b:number[]=[], boundaryCells:number[]=[];
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++) {
    const i=y*map.width+x;
    if(x+1<map.width){a.push(i);b.push(i+1);}
    if(y+1<map.height){a.push(i);b.push(i+map.width);}
    if(!x||!y||x===map.width-1||y===map.height-1)boundaryCells.push(i);
  }
  const blocked=new Uint16Array(n);for(const building of map.buildings)for(const i of building.cells)blocked[i]++;
  const faceLookup=new Map<number,number>();for(let f=0;f<a.length;f++)faceLookup.set(a[f]*n+b[f],f);
  const crests=new Float64Array(a.length);crests.fill(-Infinity);
  return { map,depths:new Float64Array(n),flowX:new Float32Array(n),flowY:new Float32Array(n),blocked,
    demolished:new Set(),barriers:new Set(),faceA:Int32Array.from(a),faceB:Int32Array.from(b),
    momentum:new Float64Array(a.length),transfers:new Float64Array(a.length),crests,outgoing:new Float64Array(n),faceLookup,
    boundaryCells,flood:options.flood??true,boundary:options.boundary??'open',inflow:0,outflow:0,initialVolume:null };
}
export function setBarrier(s:Simulation,id:string,placed:boolean):void {
  if(placed)s.barriers.add(id);else s.barriers.delete(id);
  s.crests.fill(-Infinity);
  const n=s.depths.length;
  for(const segment of s.map.barrierSegments)if(s.barriers.has(segment.id))for(const [a,b] of segment.faces){
    const f=s.faceLookup.get(a*n+b);
    if(f!==undefined){s.crests[f]=Math.max(s.crests[f],Math.max(s.map.heights[a],s.map.heights[b])+segment.crestHeight);s.momentum[f]=0;}
  }
}
export function demolishBuilding(s:Simulation,id:string):void {
  if(s.demolished.has(id))return;
  const building=s.map.buildings.find(b=>b.id===id);if(!building)return;
  s.demolished.add(id);for(const i of building.cells)s.blocked[i]--;
}
export function floodHeight(time:number):number {
  if(time<10)return .12*Math.max(0,time)/10;
  if(time<65)return .12+(time-10)/55*3.08;
  return 3.2+(Math.min(90,time)-65)/25*.6;
}
export function simulationAudit(s:Simulation):Audit {
  let volume=0;for(const d of s.depths)volume+=d*s.map.cellSize*s.map.cellSize;
  return { volume,inflow:s.inflow,outflow:s.outflow,initialVolume:s.initialVolume??volume,
    balanceError:volume-(s.initialVolume??volume)-s.inflow+s.outflow };
}
/** Conservative four-neighbour local-inertial routing, shared faces, simultaneous donor limiter. */
export function stepSimulation(s:Simulation,dt:number,time:number):void {
  if(!(dt>0)||!Number.isFinite(dt))return;
  if(s.initialVolume===null)s.initialVolume=simulationAudit(s).volume;
  const {depths:d,map,blocked,faceA:a,faceB:b,momentum:q,transfers:v,crests,outgoing}=s;
  const z=map.heights,dx=map.cellSize,area=dx*dx,physicalDt=dt*TIME_SCALE;
  outgoing.fill(0);s.flowX.fill(0);s.flowY.fill(0);
  for(let f=0;f<a.length;f++){
    const i=a[f],j=b[f];
    if(blocked[i]||blocked[j]){q[f]=0;v[f]=0;continue;}
    const hi=z[i]+d[i],hj=z[j]+d[j],crest=Math.max(z[i],z[j],crests[f]);
    const wet=Math.max(0,Math.max(hi,hj)-crest);
    if(wet<1e-8){q[f]=0;v[f]=0;continue;}
    let flux=(q[f]+GRAVITY*physicalDt*wet*(hi-hj)/dx)/(1+physicalDt*.08);
    // A finite crest carries water only from the side above it; no momentum through a dry crest.
    if((flux>0&&hi<=crest)||(flux<0&&hj<=crest))flux=0;
    q[f]=flux;v[f]=flux*dx*physicalDt;
    outgoing[flux>=0?i:j]+=Math.abs(v[f]);
  }
  // Scale every outgoing face of each donor by the same factor; incoming water cannot be spent twice.
  for(let f=0;f<a.length;f++){
    const i=a[f],j=b[f],donor=v[f]>=0?i:j;
    const factor=outgoing[donor]>0?Math.min(1,d[donor]*area/outgoing[donor]):1;
    const volume=v[f]*factor;
    v[f]=volume;q[f]*=factor;
  }
  for(let f=0;f<a.length;f++){
    const i=a[f],j=b[f],delta=v[f]/area;d[i]-=delta;d[j]+=delta;
    const flow=v[f]/dt/dx;
    if(j-i===1){s.flowX[i]+=flow/2;s.flowX[j]+=flow/2;}else{s.flowY[i]+=flow/2;s.flowY[j]+=flow/2;}
  }
  // Roundoff only: preserve the donor-limited nonnegative solution to machine precision.
  for(let i=0;i<d.length;i++)if(d[i]<0&&d[i]>-1e-10)d[i]=0;
  const source=new Set(map.sourceCells);
  if(s.flood&&map.sourceCells.length){
    const base=map.sourceCells.reduce((sum,i)=>sum+z[i],0)/map.sourceCells.length;
    const stage=base+floodHeight(time);
    for(const i of map.sourceCells)if(!blocked[i]){
      const add=Math.max(0,stage-z[i]-d[i])*dx*physicalDt*2;
      d[i]+=add/area;s.inflow+=add;
    }
  }
  if(s.boundary==='open')for(const i of s.boundaryCells)if(!blocked[i]&&!source.has(i)){
    const removed=Math.min(d[i]*area,d[i]*dx*physicalDt*1.5);
    d[i]-=removed/area;s.outflow+=removed;
  }
}
