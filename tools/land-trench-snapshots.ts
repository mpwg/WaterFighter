/** Reproduce numerical states for inspecting the land-trench rendering. */
import {readFileSync,writeFileSync} from 'node:fs';
import {validateScenario} from '../src/scenario';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const reference=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!=='1.4-draft'||reference.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const game=new Game(scenario),solver=game.solver;
for(const [i,segment] of reference.segments.slice(0,3).entries()){
  const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],solver.width)});
  if(!result.ok)throw Error(result.reason);
}
const cells=trenchPath([0,4],[25,4],solver.width),result=game.apply('trench',{kind:'trench',cells});
if(!result.ok)throw Error(result.reason);
const states=[];
for(const target of [120,180,240,300]){
  while(solver.time<target-1e-9){const t=solver.time,dt=solver.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);}
  states.push({time:target,depth:Array.from(solver.h),qx:Array.from(solver.qx),qy:Array.from(solver.qy)});
}
writeFileSync('/tmp/waterfighter-land-trench-states.json',JSON.stringify({scenario:scenario.version,bed:Array.from(solver.bed),cells,states}));
console.log(JSON.stringify({scenario:scenario.version,times:states.map(s=>s.time),budget:game.budget,...game.totals()}));
