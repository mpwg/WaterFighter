/** Compare the southern trench at a chosen time with the same dams and time boundary. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';

const [mode,raw]=process.argv.slice(2),at=Number(raw);
if(!['control','trench'].includes(mode)||!Number.isFinite(at)||at<0||at>=300)throw Error('Aufruf: control|trench ZEIT');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const control=fixture.strategies['south-control'],diversion=fixture.strategies['south-divert'];
if(JSON.stringify(control)!==JSON.stringify(diversion.slice(0,control.length)) || diversion.length!==control.length+1)throw Error('Dammkontrolle und Strategie passen nicht zusammen');
const game=new Game(scenario),solver=game.solver,initial=solver.volume();
for(const [i,step] of control.entries()) {
  if(step.kind!=='dam')throw Error('Damm erwartet');
  const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(step.start,step.end,solver.width)});
  if(!result.ok)throw Error(result.reason);
}
const step=diversion[control.length];if(step.kind!=='trench')throw Error('Graben erwartet');
const cells=trenchPath(step.start,step.end,solver.width);
let event=false,cost=0,eventTime=0,volumeChange=0,wetCells=0,maxDepth=0,damageBefore=0;
while(solver.time<scenario.parameters.duration-1e-9){
  if(!event && solver.time>=at-1e-9){
    eventTime=solver.time;damageBefore=game.totals().totalDamage;
    wetCells=cells.filter(i=>solver.h[i]>=0.05).length;maxDepth=Math.max(...cells.map(i=>solver.h[i]));
    if(mode==='trench'){
      const before=solver.volume(),result=game.apply('trench',{kind:'trench',cells});
      if(!result.ok)throw Error(result.reason);
      cost=result.cost;volumeChange=solver.volume()-before;
    }
    event=true;
  }
  const t=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-t,event?Infinity:at-t));
  game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,mode,at,eventTime,cost,damageBefore,wetCells,maxDepth,volumeChange,
  budget:game.budget,...game.totals(),relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)}));
