/** Evaluate one single-cell endpoint change for a late reference trench. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';

const [endpoint,dxRaw,dyRaw]=process.argv.slice(2),dx=Number(dxRaw),dy=Number(dyRaw);
if(!['start','end'].includes(endpoint)||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)throw Error('Aufruf: start|end DX DY; genau eine Rasterzelle');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const north=process.argv.includes('--north');
const strategy=fixture.strategies[north?'land-divert':'south-divert'];
const control=north?strategy.slice(0,-1):fixture.strategies['south-control'];
if(JSON.stringify(control)!==JSON.stringify(strategy.slice(0,control.length))||strategy.length!==control.length+1)throw Error('Strategie und Kontrolle passen nicht');
const game=new Game(scenario),solver=game.solver,initial=solver.volume();
for(const [i,step] of control.entries()){
  if(step.kind!=='dam')throw Error('Damm erwartet');
  const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(step.start,step.end,solver.width)});
  if(!result.ok)throw Error(result.reason);
}
const step=strategy[control.length];if(step.kind!=='trench')throw Error('Graben erwartet');
const start:[number,number]=[step.start[0],step.start[1]],end:[number,number]=[step.end[0],step.end[1]],changed=endpoint==='start'?start:end;
changed[0]+=dx;changed[1]+=dy;
if([start,end].some(([x,y])=>x<0||y<0||x>=solver.width||y>=solver.height)){
  console.log(JSON.stringify({scenario:scenario.version,strategy:north?'north':'south',endpoint,dx,dy,start,end,accepted:false,reason:'Endpunkt außerhalb der Karte.'}));process.exit(0);
}
const cells=trenchPath(start,end,solver.width),preview=game.preview({kind:'trench',cells});
if(!preview.ok){console.log(JSON.stringify({scenario:scenario.version,strategy:north?'north':'south',endpoint,dx,dy,start,end,accepted:false,reason:preview.reason,budget:game.budget}));process.exit(0);}
const at=150;let applied=false,cost=0,volumeChange=0;
while(solver.time<scenario.parameters.duration-1e-9){
  if(!applied&&solver.time>=at-1e-9){
    const before=solver.volume(),result=game.apply('trench',{kind:'trench',cells});
    if(!result.ok)throw Error(result.reason);cost=result.cost;volumeChange=solver.volume()-before;applied=true;
  }
  const t=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-t,applied?Infinity:at-t));
  game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,strategy:north?'north':'south',endpoint,dx,dy,start,end,accepted:true,at,cells:cells.length,cost,volumeChange,budget:game.budget,
  ...game.totals(),relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)}));
