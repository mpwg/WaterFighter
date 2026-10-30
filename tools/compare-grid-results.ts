/** Compare saved 4 m and 2 m final states; 2 m depths are averaged to 4 m cells. */
import { readFileSync } from 'node:fs';
import type { BuildingStatus } from '../src/simulation/game';

interface Saved { factor:number; buildings:BuildingStatus[]; depth:number[] }
if(process.argv.length!==4)throw Error('Argumente: 4-m-Zustand und 2-m-Zustand');
const coarse=JSON.parse(readFileSync(process.argv[2],'utf8')) as Saved;
const fine=JSON.parse(readFileSync(process.argv[3],'utf8')) as Saved;
if(coarse.factor!==1 || fine.factor!==2 || coarse.depth.length!==40000 || fine.depth.length!==160000)throw Error('Unerwartete Raster');
const byId=new Map(fine.buildings.map(b=>[b.id,b]));
if(byId.size!==fine.buildings.length || coarse.buildings.length!==fine.buildings.length)throw Error('Gebäudelisten stimmen nicht überein');
const buildings=coarse.buildings.map(b=>{
  const other=byId.get(b.id);
  if(!other || other.value!==b.value)throw Error(`Gebäude fehlt oder hat anderen Wert: ${b.id}`);
  return {id:b.id,value:b.value,coarse:b.damage,fine:other.damage,difference:other.damage-b.damage};
}).sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference));
let integral=0,max=0,cellsOverHalfMetre=0;
for(let i=0;i<coarse.depth.length;i++) {
  const x=i%200,y=Math.floor(i/200),j=2*y*400+2*x;
  const average=(fine.depth[j]+fine.depth[j+1]+fine.depth[j+400]+fine.depth[j+401])/4;
  const difference=Math.abs(average-coarse.depth[i]);
  integral+=difference*16;max=Math.max(max,difference);
  if(difference>0.5)cellsOverHalfMetre++;
}
console.log(JSON.stringify({buildings:buildings.slice(0,8),sumAbsoluteDamageDifferences:buildings.reduce((s,b)=>s+Math.abs(b.difference),0),
  finalDepthAbsoluteDifferenceIntegral:integral,maximumFinalDepthDifference:max,cellsOverHalfMetre},null,2));
