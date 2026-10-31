/** Reproducible complete90-second comparison; run: bun tools/v4-compare.ts */
import { readFileSync } from 'node:fs';
import { createGame, advanceGame, commandGame, snapshotGame } from '../src/v4/game';
import { validateMap } from '../src/v4/map';
import type { GameCommand } from '../src/v4/types';
const map=validateMap(JSON.parse(readFileSync('public/v4/map.json','utf8')));
const plans:{name:string;actions:{at:number;command:GameCommand}[]}[]=[
  {name:'no-actions',actions:[]},
  {name:'harmful-barrier',actions:[{at:0,command:{type:'placeBarrier',segmentId:'barrier-122'}}]},
  {name:'protective-barrier-only',actions:[{at:0,command:{type:'placeBarrier',segmentId:'barrier-14'}}]},
  {name:'deliberate-barrier-and-opening',actions:[{at:0,command:{type:'placeBarrier',segmentId:'barrier-14'}},{at:45,command:{type:'demolish',buildingId:'geb-5354281'}}]},
];
const totals:number[]=[];
for(const plan of plans){
  const game=createGame(map);commandGame(game,{type:'start'});const start=performance.now();let time=0;
  for(const action of plan.actions){advanceGame(game,action.at-time);time=action.at;const result=commandGame(game,action.command);if(!result.ok)throw Error(result.reason);}
  advanceGame(game,90-time);const state=snapshotGame(game);totals.push(state.floodDamage+state.demolitionDamage);
  console.log(JSON.stringify({name:plan.name,actions:plan.actions,solverMs:performance.now()-start,points:state.points,
    floodDamage:state.floodDamage,demolitionDamage:state.demolitionDamage,wetCells:[...state.depths].filter(d=>d>.05).length,
    maximumDepth:Math.max(...state.depths),audit:state.audit}));
}

if(!(totals[1]>totals[0]&&totals[3]<totals[0]&&totals[3]<totals[2]))throw Error('Strategy contrast regression: inspect flood and fictional values.');
