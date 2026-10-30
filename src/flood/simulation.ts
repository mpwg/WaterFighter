import type {
  Simulation, Terrain
} from './types';
export const edgeKey=(a:number,b:number):string=>a<b?`${a}:${b}`:`${b}:${a}`;
export function waterVolume(s:Simulation):number {
  let n=0;
  for(const d of s.depths)n+=d;
  return n*s.terrain.cellSize**2;
}
export function createSimulation(terrain:Terrain):Simulation {
  const n=terrain.width*terrain.height;
  const depths=new Float64Array(n);
  for(let i=0;i<n;i++) if(terrain.river[i]&&!terrain.obstacles[i])depths[i]=Math.max(0,-terrain.heights[i]);
  const s:Simulation={
    terrain,depths,time:0,sills:new Map(),accounting:{
      initial:0,inflow:0,outflow:0,volume:0,error:0
    },delta:new Float64Array(n),outgoing:new Float64Array(n),fluxX:new Float64Array(n),fluxY:new Float64Array(n),sillX:new Float64Array(n).fill(-Infinity),sillY:new Float64Array(n).fill(-Infinity)
  };
  s.accounting.initial=s.accounting.volume=waterVolume(s);
  return s;
}
/** Fixed hydrograph: mild 45-second opening; peak at 180; recession to 360. */
export function floodStage(time:number):number {
  return time<=45?.03*time/45:time<=180?.03+2.12*(time-45)/135:Math.max(.05,2.15-(time-180)*2.1/180);
}
export function stepSimulation(s:Simulation,dt:number,forcing=true):void {
  if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid time step');
  let remaining=dt;
  while(remaining>1e-9) {
    const h=Math.min(.1,remaining);
    advance(s,h,forcing);
    remaining-=h;
  }
}
function advance(s:Simulation,dt:number,forcing:boolean):void {
  const {
    terrain:t,depths:d,outgoing:o,delta,fluxX:fx,fluxY:fy
  }=s;
  const {
    width:w,height:h,heights:z,obstacles
  }=t;
  const n=d.length;
  o.fill(0);
  delta.fill(0);
  fx.fill(0);
  fy.fill(0);
  // River cells exchange with the explicitly accounted upstream river reservoir.
  // This local scene omits the hundreds of kilometres of upstream Danube.
  if(forcing)for(let i=0;i<n;i++) {
    if(!t.river[i]||obstacles[i])continue;
    const target=Math.max(0,floodStage(s.time)-z[i]);
    const change=(target-d[i])*Math.min(1,dt*.8);
    d[i]+=change;
    if(change>0)s.accounting.inflow+=change*t.cellSize**2;
    else s.accounting.outflow-=change*t.cellSize**2;
  }
  const flux=(a:number,b:number,sillHeight:number):number=>{
    if(obstacles[a]||obstacles[b])return 0;
    const ha=z[a]+d[a],hb=z[b]+d[b];
    const sill=Math.max(z[a],z[b],sillHeight);
    const donor=ha>hb?a:b;
    const head=Math.max(0,Math.max(ha,hb)-Math.max(sill,Math.min(ha,hb)));
    const q=(ha>hb?1:-1)*head*dt*2;
    o[donor]+=Math.abs(q);
    return q;
  };
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(x+1<w)fx[i]=flux(i,i+1,s.sillX[i]);
    if(y+1<h)fy[i]=flux(i,i+w,s.sillY[i]);
  }
  const apply=(a:number,b:number,q:number)=>{
    const donor=q>0?a:b;
    const v=q*Math.min(1,d[donor]/(o[donor]||1));
    delta[a]-=v;
    delta[b]+=v;
  };
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(x+1<w)apply(i,i+1,fx[i]);
    if(y+1<h)apply(i,i+w,fy[i]);
  }
  for(let i=0;i<n;i++)d[i]=Math.max(0,d[i]+delta[i]);
  s.time+=dt;
  s.accounting.volume=waterVolume(s);
  s.accounting.error=s.accounting.volume-s.accounting.initial-s.accounting.inflow+s.accounting.outflow;
}
