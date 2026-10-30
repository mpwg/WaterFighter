/** Counterfactual: retain surveyed crests when placing the delayed southern trench. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];if(!['control','trench','retain'].includes(mode))throw Error('Aufruf: control|trench|retain');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(scenario.version!==fixture.scenario)throw Error('Szenarioversion stimmt nicht');
const game=new Game(scenario),s=game.solver,initial=s.volume(),strategy=fixture.strategies['south-divert'];
for(const [i,step] of strategy.slice(0,3).entries()){
 const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(step.start,step.end,s.width)});if(!result.ok)throw Error(result.reason);
}
const cells=trenchPath(strategy[3].start,strategy[3].end,s.width),set=new Set(cells);
const crossed=scenario.surveyCrests.filter(face=>{
 const x=face.axis==='x'?face.index%(s.width+1):face.index%s.width,y=face.axis==='x'?Math.floor(face.index/(s.width+1)):Math.floor(face.index/s.width),b=y*s.width+x,a=face.axis==='x'?b-1:b-s.width;
 return set.has(a)&&set.has(b);
});
let acted=false,action=null;
while(s.time<scenario.parameters.duration-1e-9){
 if(!acted&&s.time>=150-1e-9){
  if(mode!=='control'){
   action=game.apply('trench',{kind:'trench',cells});if(!action.ok)throw Error(action.reason);
   if(mode==='retain')for(const face of crossed){const field=face.axis==='x'?s.crestX:s.crestY;field[face.index]=Math.max(field[face.index],face.crest);}
  }
  acted=true;
 }
 const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t,acted?Infinity:150-t));game.addInflow(t,dt);game.updateDamage(dt);
}
const balance=Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow);
if(balance>=0.001)throw Error('Wasserbilanz außerhalb der Schranke');
console.log(JSON.stringify({scenario:scenario.version,mode,at:150,crossed,action,budget:game.budget,...game.totals(),relativeBalance:balance}));
