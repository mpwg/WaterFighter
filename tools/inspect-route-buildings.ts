/** Locate damaged buildings relative to the southern reference trench. */
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {Game} from '../src/simulation/game';
import {trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const run=spawnSync(process.execPath,['tools/reference-strategies.ts','baseline'],{encoding:'utf8',maxBuffer:8*1024*1024});
if(run.status!==0)throw Error(`Referenzrechnung fehlgeschlagen: ${run.stderr}`);
const baseline=JSON.parse(run.stdout) as {scenario:string;buildings:{id:string;damage:number}[]};
if(baseline.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const game=new Game(scenario),w=scenario.grid.width,cell=scenario.grid.cellSize;
const path=trenchPath([118,124],[130,199],w),damageById=new Map(baseline.buildings.map(b=>[b.id,b.damage]));
const buildings=game.buildings.map(b=>{
 const damage=damageById.get(b.id);if(damage===undefined)throw Error(`Gebäude fehlt: ${b.id}`);
 let distance=Infinity;
 for(const i of b.cells)for(const j of path)distance=Math.min(distance,Math.hypot(i%w-j%w,Math.floor(i/w)-Math.floor(j/w))*cell);
 return {id:b.id,damage,distance};
});
const bands=[16,32,64,128,256].map(metres=>{
 const selected=buildings.filter(b=>b.distance<=metres);
 return {metres,buildings:selected.length,damaged:selected.filter(b=>b.damage>1).length,damage:selected.reduce((sum,b)=>sum+b.damage,0)};
});
const nearestDamaged=buildings.filter(b=>b.damage>1).sort((a,b)=>a.distance-b.distance)[0];
console.log(JSON.stringify({scenario:scenario.version,route:[[118,124],[130,199]],units:'Zellmittelpunkt-Abstand in Metern',baselineTotal:baseline.buildings.reduce((sum,b)=>sum+b.damage,0),bands,nearestDamaged},null,2));
