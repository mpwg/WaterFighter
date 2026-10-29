/** Observe maximum water depth along screened routes during the baseline flood. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const routes=JSON.parse(readFileSync(process.argv[2]??'/tmp/waterfighter-land-routes.json','utf8'));
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
if(routes.version!==scenario.version||routes.routes.some((r:unknown)=>!r))throw Error('Routen oder Version ungültig');
const game=new Game(scenario),solver=game.solver;
const indexes:number[][]=routes.routes.map((r:{path:number[][]})=>r.path.map(([x,y])=>y*solver.width+x));
const maxima=indexes.map(path=>new Float64Array(path.length));
while(solver.time<scenario.parameters.duration-1e-9){
 const t=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);
 for(let r=0;r<indexes.length;r++)for(let i=0;i<indexes[r].length;i++)maxima[r][i]=Math.max(maxima[r][i],solver.h[indexes[r][i]]);
}
console.log(JSON.stringify({version:scenario.version,thresholdM:0.01,routes:maxima.map((values,r)=>({rows:routes.routes[r].rows,cells:values.length,everWet:values.filter(v=>v>0.01).length,minOfMaxDepth:Math.min(...values),maxDepth:Math.max(...values)}))},null,2));
