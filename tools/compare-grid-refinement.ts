/** Compare the untreated scenario or southern dams with a piecewise-constant 2× subdivision. */
import { readFileSync, writeFileSync } from 'node:fs';
import { Game } from '../src/simulation/game';
import { damPath } from '../src/simulation/path';
import { validateScenario, type Scenario } from '../src/scenario';

const original=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const factor=Number(process.argv[2]??1);
if(factor!==1 && factor!==2)throw Error('Argument: Verfeinerungsfaktor 1 oder 2');
const mode=process.argv[3]??'baseline';
if(!['baseline','south-control','south-demolition'].includes(mode))throw Error('Modus: baseline, south-control oder south-demolition');

function refine(s:Scenario):Scenario {
  const {width:w,height:h,cellSize}=s.grid, n=w*2;
  // The present scenario has its inlet on the upper edge away from corners.
  if(!s.parameters.inflowCells.every(i=>i>0 && i<w-1))throw Error('Verfeinerung setzt Zufluss am oberen Rand voraus');
  const replicate=(a:number[])=>Array.from({length:n*h*2},(_,i)=>a[Math.floor(Math.floor(i/n)/2)*w+Math.floor((i%n)/2)]);
  const crests:Scenario['surveyCrests']=[];
  for(const f of s.surveyCrests) {
    if(f.axis==='x') {
      const x=f.index%(w+1),y=Math.floor(f.index/(w+1));
      for(let j=0;j<2;j++)crests.push({axis:'x',index:(2*y+j)*(n+1)+2*x,crest:f.crest});
    } else {
      const x=f.index%w,y=Math.floor(f.index/w);
      for(let j=0;j<2;j++)crests.push({axis:'y',index:2*y*n+2*x+j,crest:f.crest});
    }
  }
  return {...s,grid:{...s.grid,width:n,height:h*2,cellSize:cellSize/2},
    terrain:replicate(s.terrain),bed:replicate(s.bed),initialDepth:replicate(s.initialDepth),waterMask:replicate(s.waterMask),
    surveyCrests:crests,parameters:{...s.parameters,damCostPerCell:s.parameters.damCostPerCell/2,inflowCells:s.parameters.inflowCells.flatMap(i=>[2*i,2*i+1])}};
}
const scenario=factor===1?original:refine(original);
const game=new Game(scenario),solver=game.solver,initial=solver.volume(),started=performance.now();
if(mode!=='baseline'){
  const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
  if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
  for(const [i,step] of fixture.strategies['south-control'].entries()){
    const start:[number,number]=[step.start[0]*factor,step.start[1]*factor],end:[number,number]=[step.end[0]*factor,step.end[1]*factor];
    const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(start,end,solver.width)});
    if(!result.ok)throw Error(result.reason);
  }
}
let actionApplied=mode==='baseline';
const ids=['w316294475-0','w501079921-0','w1343275154-0'];
const trace=process.env.WATERFIGHTER_GRID_DIAGNOSTICS?ids.map(id=>{
  const building=game.buildings.find(b=>b.id===id);
  if(!building)throw Error(`Gebäude fehlt: ${id}`);
  const others=new Set(game.buildings.filter(b=>b.id!==id).flatMap(b=>b.cells));
  const owners=game.buildings.filter(b=>b.id!==id && b.cells.some(i=>building.neighbours.includes(i))).map(b=>b.id);
  return {building,maxDepth:0,maxDepthTime:0,wetSeconds:0,blockedNeighbours:building.neighbours.filter(i=>others.has(i)).length,owners};
}):[];
while(solver.time<scenario.parameters.duration-1e-9) {
  if(!actionApplied&&solver.time>=180-1e-9){
    if(mode==='south-demolition'){
      const result=game.apply('demolition',{kind:'demolish',buildingId:'w316294475-0'});
      if(!result.ok)throw Error(result.reason);
    }
    actionApplied=true;
  }
  const time=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-time,actionApplied?Infinity:180-time));
  game.addInflow(time,dt);game.updateDamage(dt);
  for(const t of trace) {
    const depth=t.building.neighbours.reduce((max,i)=>Math.max(max,solver.h[i]),0);
    if(depth>t.maxDepth){t.maxDepth=depth;t.maxDepthTime=solver.time;}
    if(depth>=0.05)t.wetSeconds+=dt;
  }
}
if(process.env.WATERFIGHTER_GRID_OUTPUT)writeFileSync(process.env.WATERFIGHTER_GRID_OUTPUT,JSON.stringify({factor,buildings:game.status(),depth:Array.from(solver.h)}));
if(trace.length)writeFileSync(process.env.WATERFIGHTER_GRID_DIAGNOSTICS!,JSON.stringify(trace.map(t=>({id:t.building.id,
  cells:t.building.cells,neighbours:t.building.neighbours,blockedNeighbours:t.blockedNeighbours,owners:t.owners,
  damage:t.building.damage,maxDepth:t.maxDepth,maxDepthTime:t.maxDepthTime,wetSeconds:t.wetSeconds})),null,2));
console.log(JSON.stringify({version:scenario.version,mode,factor,cellSize:solver.cellSize,steps:solver.steps,budget:game.budget,
  wallSeconds:(performance.now()-started)/1000,initialVolume:initial,finalVolume:solver.volume(),
  inflow:solver.inflow,outflow:solver.outflow,relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow),...game.totals()}));
