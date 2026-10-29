/** Screen water depths near mapped crossings during a complete unprotected round. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const data=JSON.parse(readFileSync(process.argv[2]??'/tmp/waterfighter-crossing-cells.json','utf8'));
if(data.version!==scenario.version||data.cellSize!==scenario.grid.cellSize)throw Error('Szenarioversion oder Zellgröße stimmt nicht');
const game=new Game(scenario),s=game.solver,n=s.h.length,initial=s.volume();
const max=Float64Array.from(s.h),firstWet=new Float64Array(n).fill(-1),threshold=0.05;
for(let i=0;i<n;i++)if(s.h[i]>threshold)firstWet[i]=0;
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);
 for(let i=0;i<n;i++){if(s.h[i]>max[i])max[i]=s.h[i];if(firstWet[i]<0&&s.h[i]>threshold)firstWet[i]=s.time;}
}
const crossings=data.crossings.map((c:{id:string;bridge:string|null;tunnel:string|null;cells:number[]})=>{
 if(!Array.isArray(c.cells)||c.cells.some(i=>!Number.isInteger(i)||i<0||i>=n))throw Error('Ungültige Kreuzungszellen');
 let maxDepth=0,first:number|null=null,wet=0,initialWet=0;
 for(const i of c.cells){maxDepth=Math.max(maxDepth,max[i]);if(firstWet[i]>=0){wet++;if(firstWet[i]===0)initialWet++;first=first===null?firstWet[i]:Math.min(first,firstWet[i]);}}
 return {id:c.id,bridge:c.bridge,tunnel:c.tunnel,cells:c.cells.length,wetCells:wet,initialWetCells:initialWet,firstWetSeconds:first,maxDepth};
});
console.log(JSON.stringify({scenario:scenario.version,thresholdM:threshold,bufferM:scenario.grid.cellSize,method:'Rasterzellen, die den 4-m-Puffer berühren; Zellmaxima über die Runde',duration:s.time,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),crossings},null,2));
