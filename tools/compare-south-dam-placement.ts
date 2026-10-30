/** Evaluate a one-cell endpoint shift in the southern dam control. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const [indexRaw,endpoint,dxRaw,dyRaw]=process.argv.slice(2),index=Number(indexRaw),dx=Number(dxRaw),dy=Number(dyRaw);
if(!Number.isInteger(index)||index<0||index>2||!['start','end'].includes(endpoint)||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)throw Error('Aufruf: DAMM(0–2) start|end DX DY');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const dams=structuredClone(fixture.strategies['south-control']);
dams[index][endpoint][0]+=dx;dams[index][endpoint][1]+=dy;
const game=new Game(scenario),solver=game.solver,initial=solver.volume(),actions=[];
for(const [i,dam] of dams.entries()){
 if([dam.start,dam.end].some(([x,y]:number[])=>x<0||x>solver.width||y<0||y>solver.height)){
  console.log(JSON.stringify({scenario:scenario.version,index,endpoint,dx,dy,accepted:false,reason:'Endpunkt außerhalb der Karte.',dams,actions}));process.exit(0);
 }
 const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(dam.start,dam.end,solver.width)});
 if(!result.ok){console.log(JSON.stringify({scenario:scenario.version,index,endpoint,dx,dy,accepted:false,reason:result.reason,dams,actions}));process.exit(0);}
 actions.push(result);
}
while(solver.time<scenario.parameters.duration-1e-9){const time=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-time));game.addInflow(time,dt);game.updateDamage(dt);}
console.log(JSON.stringify({scenario:scenario.version,index,endpoint,dx,dy,accepted:true,dams,actions,budget:game.budget,...game.totals(),relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)}));
