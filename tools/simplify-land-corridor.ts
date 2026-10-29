/** Greedily approximate a land corridor with playable straight trench actions. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const route=JSON.parse(readFileSync(process.argv[2]??'','utf8')) as {scenario:string;path:number[][]};
const {width:w,height:h}=scenario.grid;
if(route.scenario!==scenario.version||!Array.isArray(route.path)||!route.path.length||route.path.some((p,i)=>!Array.isArray(p)||p.length!==2||p.some((v,k)=>!Number.isInteger(v)||v<0||v>=(k===0?w:h))||(i>0&&Math.abs(p[0]-route.path[i-1][0])+Math.abs(p[1]-route.path[i-1][1])!==1)))throw Error('Ungültiger Szenariokorridor');
const game=new Game(scenario),segments:{start:number[];end:number[];cells:number;cost:number}[]=[],path:number[][]=[];
let start=0;
while(start<route.path.length){
 let selected:ReturnType<typeof trenchPath>|undefined,end=start;
 for(let j=route.path.length-1;j>=start;j--){
  const a=route.path[start] as [number,number],b=route.path[j] as [number,number],cells=trenchPath(a,b,w);
  if(cells.some(i=>scenario.waterMask[i]))continue;
  if(game.preview({kind:'trench',cells}).ok){selected=cells;end=j;break;}
 }
 if(!selected)throw Error(`Kein zulässiger Abschnitt ab ${start}`);
 const result=game.apply(`segment-${segments.length}`,{kind:'trench',cells:selected});if(!result.ok)throw Error(result.reason);
 segments.push({start:route.path[start],end:route.path[end],cells:selected.length,cost:result.cost});
 path.push(...selected.map(i=>[i%w,Math.floor(i/w)]));start=end+1;
}
console.log(JSON.stringify({scenario:scenario.version,sourceCells:route.path.length,segments,path,budget:game.budget},null,2));
