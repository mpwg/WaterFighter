import {
  createTerrain
} from './terrain';
import {
  createSimulation, edgeKey, stepSimulation
} from './simulation';
import type {
  Barrier, Command, CommandResult, Game, Point, Snapshot, Terrain
} from './types';
export const DURATION=360;
export const INITIAL_RESOURCES=900;
export const BARRIER_HEIGHT=1.1;
export const MAX_BUILD_DEPTH=.65;
export function createGame(terrain:Terrain=createTerrain()):Game {
  return {
    terrain,simulation:createSimulation(terrain),time:0,phase:'running',resources:INITIAL_RESOURCES,barriers:new Map(),rescues:new Map(),buildings:terrain.buildings.map(b=>({
      buildingId:b.id,damage:0,depth:0,peakDepth:0,rescued:false
    })),rescued:0,gateOpen:Object.fromEntries(terrain.gates.map(g=>[g.id,true]))
  };
}
/** Rasterize a polyline along cell boundaries: horizontal segments block north/south flow. */
function edges(g:Game,points:Point[]):Barrier[]|undefined {
  const {
    width:w,height:h
  }=g.terrain;
  if(points.length<2||points.length>4096)return;
  if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<1||p.y<1||p.x>=w-1||p.y>=h-1))return;
  const found=new Map<string,Barrier>();
  const add=(x:number,y:number,horizontal:boolean)=>{
    const a=y*w+x,b=horizontal?a+w:a+1,key=edgeKey(a,b);
    found.set(key,{
      key,a,b,x,y,height:BARRIER_HEIGHT,progress:0,status:g.phase==='paused'?'queued':'building',cost:2
    });
  };
  for(let p=1;p<points.length;p++){
    let x=Math.floor(points[p-1].x),y=Math.floor(points[p-1].y);
    const tx=Math.floor(points[p].x),ty=Math.floor(points[p].y);
    const dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=Math.sign(tx-x),sy=Math.sign(ty-y);
    let error=dx-dy;
    while(x!==tx||y!==ty){
      const e=2*error;
      if(e>-dy&&x!==tx){
        add(Math.min(x,x+sx),y,true);
        error-=dy;
        x+=sx;
      }if(e<dx&&y!==ty){
        add(x,Math.min(y,y+sy),false);
        error+=dx;
        y+=sy;
      }
    }
  }
  return [...found.values()];
}
function valid(g:Game,b:Barrier):boolean {
  return !g.terrain.obstacles[b.a]&&!g.terrain.obstacles[b.b]&&Math.max(g.simulation.depths[b.a],g.simulation.depths[b.b])<=MAX_BUILD_DEPTH&&!g.terrain.gates.some(gate=>(gate.edges??[gate]).some(edge=>edgeKey(edge.a,edge.b)===b.key));
}
function updateSills(g:Game):void {
  const s=g.simulation;
  s.sills.clear();
  s.sillX.fill(-Infinity);
  s.sillY.fill(-Infinity);
  const set=(a:number,b:number,height:number)=>{
    s.sills.set(edgeKey(a,b),height);
    const i=Math.min(a,b);
    if(Math.abs(a-b)===1)s.sillX[i]=height;
    else s.sillY[i]=height;
  };
  for(const b of g.barriers.values())if(b.progress>0)set(b.a,b.b,Math.max(g.terrain.heights[b.a],g.terrain.heights[b.b])+b.height*b.progress);
  for(const gate of g.terrain.gates)if(!g.gateOpen[gate.id])for(const edge of gate.edges??[gate])set(edge.a,edge.b,gate.sill);
}
export function commandGame(g:Game,command:Command):CommandResult {
  if(command.type==='reset'){
    Object.assign(g,createGame(g.terrain));
    return {
      ok:true
    };
  }
  if(g.phase==='finished')return {
    ok:false,reason:'Flood has finished'
  };
  if(command.type==='pause'){
    g.phase='paused';
    return {
      ok:true
    };
  }
  if(command.type==='resume'){
    for(const [key,b]of g.barriers)if(b.status==='queued'){
      if(!valid(g,b)){
        g.resources+=b.cost;
        g.barriers.delete(key);
      }else b.status='building';
    }g.phase='running';
    return {
      ok:true
    };
  }
  if(command.type==='gate'){
    if(!g.terrain.gates.some(gate=>gate.id===command.gateId))return {
      ok:false,reason:'Unknown gate'
    };
    g.gateOpen[command.gateId]=command.open;
    updateSills(g);
    return {
      ok:true
    };
  }
  if(command.type==='rescue'){
    if(!g.terrain.buildings.some(b=>b.id===command.buildingId))return {
      ok:false,reason:'Unknown building'
    };
    if(!g.rescues.has(command.buildingId))g.rescues.set(command.buildingId,{
      buildingId:command.buildingId,elapsed:0,status:'active'
    });
    return {
      ok:true
    };
  }
  const line=edges(g,command.points);
  if(!line||!line.length)return {
    ok:false,reason:'Draw a line inside the map'
  };
  if(command.type==='remove'){
    let changed=0;
    for(const b of line){
      const old=g.barriers.get(b.key);
      if(old){
        g.resources+=old.status==='queued'?old.cost:old.cost*.5;
        g.barriers.delete(b.key);
        changed++;
      }
    }updateSills(g);
    return {
      ok:true,changed
    };
  }
  const fresh=line.filter(b=>!g.barriers.has(b.key));
  if(fresh.some(b=>!valid(g,b)))return {
    ok:false,reason:'Barrier crosses a building, gate, or deep water'
  };
  const cost=fresh.reduce((sum,b)=>sum+b.cost,0);
  if(cost>g.resources)return {
    ok:false,reason:'Insufficient sandbags'
  };
  for(const b of fresh)g.barriers.set(b.key,b);
  g.resources-=cost;
  return {
    ok:true,changed:fresh.length
  };
}
export function stepGame(g:Game,dt:number):void {
  if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid time step');
  if(g.phase!=='running')return;
  let remaining=Math.min(dt,DURATION-g.time);
  while(remaining>1e-9){
    const h=Math.min(.1,remaining);
    for(const b of g.barriers.values())if(b.status==='building'){
      b.progress=Math.min(1,b.progress+h/2);
      if(b.progress>=1-1e-9){
        b.progress=1;
        b.status='ready';
      }
    }updateSills(g);
    stepSimulation(g.simulation,h);
    g.time=Math.min(DURATION,g.time+h);
    for(const r of g.rescues.values())if(r.status==='active'){
      r.elapsed+=h;
      if(r.elapsed>=6-1e-8){
        r.elapsed=6;
        r.status='complete';
        g.rescued+=g.terrain.buildings.find(b=>b.id===r.buildingId)!.people;
        g.buildings.find(b=>b.buildingId===r.buildingId)!.rescued=true;
      }
    }
    for(let i=0;i<g.terrain.buildings.length;i++){
      const b=g.terrain.buildings[i],state=g.buildings[i],w=g.terrain.width;
      let depth=0;
      for(let x=b.x;x<b.x+b.width;x++){
        depth=Math.max(depth,g.simulation.depths[(b.y-1)*w+x]??0,g.simulation.depths[(b.y+b.height)*w+x]??0);
      }for(let y=b.y;y<b.y+b.height;y++)depth=Math.max(depth,g.simulation.depths[y*w+b.x-1]??0,g.simulation.depths[y*w+b.x+b.width]??0);
      state.depth=depth;
      state.peakDepth=Math.max(state.peakDepth,depth);
      state.damage=Math.min(1,state.damage+Math.max(0,depth-.1)*h/90);
    }
    remaining-=h;
  }if(g.time>=DURATION-1e-8){
    g.time=DURATION;
    g.phase='finished';
  }
}
export function snapshotGame(g:Game):Snapshot {
  return {
    width:g.terrain.width,height:g.terrain.height,cellSize:g.terrain.cellSize,depths:Float32Array.from(g.simulation.depths),time:g.time,duration:DURATION,phase:g.phase,resources:g.resources,barriers:[...g.barriers.values()].map(b=>({
      ...b
    })),rescues:[...g.rescues.values()].map(r=>({
      ...r
    })),buildings:g.buildings.map(b=>({
      ...b
    })),gates:g.terrain.gates.map(gate=>({
      id:gate.id,open:g.gateOpen[gate.id]
    })),accounting:{
      ...g.simulation.accounting
    },results:{
      rescued:g.rescued,totalPeople:g.terrain.buildings.reduce((n,b)=>n+b.people,0),safePeople:g.terrain.buildings.reduce((n,b,i)=>n+(g.buildings[i].peakDepth<=.1&&!g.buildings[i].rescued?b.people:0),0),threatenedPeople:g.terrain.buildings.reduce((n,b,i)=>n+(g.buildings[i].peakDepth>.1?b.people:0),0),damagedBuildings:g.buildings.filter(b=>b.damage>.05).length,meanDamage:g.buildings.reduce((n,b)=>n+b.damage,0)/Math.max(1,g.buildings.length)
    }
  };
}
