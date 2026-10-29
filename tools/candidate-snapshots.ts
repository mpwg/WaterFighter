/** Export reproducible candidate water states for render inspection. */
import {readFileSync,writeFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
if(scenario.version!=='1.2-draft')throw Error('Kandidatenvergleich benötigt den historischen Szenarioentwurf 1.2');
scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*0.75]);
scenario.parameters.inflowCells=Array.from({length:scenario.grid.width},(_,x)=>x).filter(x=>x<150&&scenario.waterMask[x]===1);
const game=new Game(scenario),s=game.solver,states=[];
for(const target of [0,60,120,180,240,300]){
 while(s.time<target-1e-9){const t=s.time,dt=s.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);}
 states.push({time:target,depth:Array.from(s.h),qx:Array.from(s.qx),qy:Array.from(s.qy)});
}
writeFileSync('/tmp/waterfighter-candidate-states.json',JSON.stringify({version:scenario.version,states}));
console.log(JSON.stringify({scenario:scenario.version,times:states.map(s=>s.time)}));
