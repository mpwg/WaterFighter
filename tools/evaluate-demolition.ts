/** Evaluate one demolition or its no-demolition control on the delivered scenario. */
import { readFileSync } from 'node:fs';
import { Game } from '../src/simulation/game';
import { damPath } from '../src/simulation/path';
import { validateScenario } from '../src/scenario';

const [mode,id,timeArg]=process.argv.slice(2),at=Number(timeArg);
if(!['baseline','shield','south-control'].includes(mode) || !id || !Number.isFinite(at) || at<0 || at>=300)
  throw Error('Aufruf: baseline|shield|south-control control|GEBÄUDE-ID SEKUNDEN');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const game=new Game(scenario),s=game.solver,initial=s.volume();
if(mode!=='baseline')for(const [i,step] of fixture.strategies[mode].entries()) {
  const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(step.start,step.end,s.width)});
  if(!result.ok)throw Error(result.reason);
}
// Even a control hits the same time boundary, so event timing cannot alter its
// CFL partition relative to the run that applies the action.
let applied=false,cost=0,beforeDamage=0,volumeChange=0;
let beforeBuilding:ReturnType<Game['status']>[number] | undefined;
while(s.time<scenario.parameters.duration-1e-9) {
  if(!applied && s.time>=at-1e-9) {
    const before=s.volume();beforeDamage=game.totals().totalDamage;
    if(id!=='control') {
      beforeBuilding=game.status().find(b=>b.id===id);
      const result=game.apply('demolition',{kind:'demolish',buildingId:id});
      if(!result.ok)throw Error(`${id}: ${result.reason}`);
      cost=result.cost;volumeChange=s.volume()-before;
    }
    applied=true;
  }
  const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t,applied?Infinity:at-t));
  game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,mode,id,at,cost,beforeDamage,beforeBuilding,volumeChange,budget:game.budget,
  ...game.totals(),relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)}));
