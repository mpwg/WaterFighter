/** Geometric screening of direct land trenches from the open western boundary to the water. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const {width:w,height:h}=scenario.grid;
if(scenario.version!=='1.4-draft'||w!==200||h!==200||!scenario.parameters.outflowEdges.includes('left'))throw Error('Szenario passt nicht zur Suche');
const game=new Game(scenario),occupied=new Set(game.buildings.flatMap(b=>b.cells));
const routes:{start:number[];end:number[];cells:number;cost:number}[]=[];
for(let y=5;y<110;y++)for(let x=1;x<110;x++){
 const i=y*w+x;if(scenario.waterMask[i]||occupied.has(i))continue;
 if(![i-1,i+1,i-w,i+w].some(j=>scenario.waterMask[j]))continue;
 for(let startY=0;startY<100;startY++){
  const cells=trenchPath([0,startY],[x,y],w);
  if(cells.length>100||cells.some(j=>occupied.has(j)||scenario.waterMask[j]))continue;
  const result=game.preview({kind:'trench',cells});
  if(result.ok)routes.push({start:[0,startY],end:[x,y],cells:cells.length,cost:result.cost});
 }
}
routes.sort((a,b)=>a.cells-b.cells);
console.log(JSON.stringify({scenario:scenario.version,count:routes.length,routes},null,2));
