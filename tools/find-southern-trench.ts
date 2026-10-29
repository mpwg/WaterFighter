/** Geometric screening from the known southern inlet to the open bottom edge. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';

const cap=Number(process.argv[2]);
if(!Number.isFinite(cap)||cap<=0)throw Error('Aufruf: bun tools/find-southern-trench.ts HÖHENGRENZE');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
if(scenario.version!=='1.4-draft'||scenario.grid.width!==200||scenario.grid.height!==200||!scenario.parameters.outflowEdges.includes('bottom'))throw Error('Szenario passt nicht zur Suche');
const game=new Game(scenario),w=scenario.grid.width,n=w*scenario.grid.height,start=124*w+118;
const occupied=new Set(game.buildings.flatMap(b=>b.cells));
if(occupied.has(start)||scenario.waterMask[start]||scenario.bed[start]>cap)throw Error('Startzelle nicht verfügbar');
const parent=new Int32Array(n).fill(-2),queue=new Int32Array(n);let head=0,tail=0,end=-1;
parent[start]=-1;queue[tail++]=start;
while(head<tail){
 const i=queue[head++],x=i%w,y=Math.floor(i/w);if(y===scenario.grid.height-1){end=i;break;}
 for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
  if(xx<0||xx>=w||yy<0||yy>=scenario.grid.height)continue;
  const j=yy*w+xx;if(parent[j]!==-2||scenario.waterMask[j]||occupied.has(j)||scenario.bed[j]>cap)continue;
  parent[j]=i;queue[tail++]=j;
 }
}
if(end<0)throw Error('Kein Weg innerhalb der Höhengrenze gefunden');
const path:number[][]=[];for(let i=end;i>=0;i=parent[i])path.push([i%w,Math.floor(i/w)]);path.reverse();
console.log(JSON.stringify({scenario:scenario.version,cap,path},null,2));
