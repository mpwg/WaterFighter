/** Compare prepared dams with a later, separately timed demolition and trench. */
import {readFileSync} from 'node:fs';
import {Game, type Action, type ActionResult} from '../src/simulation/game';
import {damPath, trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const mode=process.argv[2],at=Number(process.argv[3]??60);
if(!['shield','divert'].includes(mode)||!Number.isFinite(at)||at<0||at+5>=scenario.parameters.duration)throw Error('Aufruf: shield | divert ZEIT');
const game=new Game(scenario),solver=game.solver,initial=solver.volume();
const events:{id:string;time:number;before:ReturnType<Game['totals']>;result:ActionResult}[]=[];
const apply=(id:string,action:Action)=>{
  const before=game.totals(),result=game.apply(id,action);
  if(!result.ok)throw Error(`${id}: ${result.reason}`);
  events.push({id,time:solver.time,before,result});
};
for(const [i,step] of fixture.strategies.shield.entries())apply(`dam-${i}`,{kind:'dam',faces:damPath(step.start,step.end,solver.width)});
const steps=fixture.strategies.divert, scheduled=mode==='divert'?[{time:at,id:'demolish',action:{kind:'demolish',buildingId:steps[2].buildingId} as Action},{time:at+5,id:'trench',action:{kind:'trench',cells:trenchPath(steps[3].start,steps[3].end,solver.width)} as Action}]:[];
let next=0;
while(solver.time<scenario.parameters.duration-1e-9){
  while(next<scheduled.length && solver.time>=scheduled[next].time-1e-9){const event=scheduled[next++];apply(event.id,event.action);}
  const target=next<scheduled.length?scheduled[next].time:scenario.parameters.duration;
  const t=solver.time,dt=solver.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,mode,at,events,budget:game.budget,...game.totals(),relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)},null,2));
