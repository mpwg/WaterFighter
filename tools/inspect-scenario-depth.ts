/** Locate peak depths during the delivered 300-second no-intervention round. */
import { readFileSync } from 'node:fs';
import { Game } from '../src/simulation/game';
import { validateScenario } from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),solver=game.solver,initial=solver.volume();
const inflow=new Set(scenario.parameters.inflowCells);
type Peak={depth:number;time:number;cell:[number,number];bed:number;surface:number;speed:number;inflow:boolean;water:boolean};
let overall:Peak|undefined, outsideInflow:Peak|undefined, land:Peak|undefined;
const update=(old:Peak|undefined,i:number):Peak=>{
  const h=solver.h[i];
  if(old && h<=old.depth)return old;
  return {depth:h,time:solver.time,cell:[i%solver.width,Math.floor(i/solver.width)],bed:solver.bed[i],surface:solver.bed[i]+h,speed:h>1e-6?Math.hypot(solver.qx[i],solver.qy[i])/h:0,inflow:inflow.has(i),water:scenario.waterMask[i]===1};
};
while(solver.time<scenario.parameters.duration-1e-9){
  const t=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-t));
  game.addInflow(t,dt);game.updateDamage(dt);
  for(let i=0;i<solver.h.length;i++){
    overall=update(overall,i);
    if(!inflow.has(i))outsideInflow=update(outsideInflow,i);
    if(!scenario.waterMask[i])land=update(land,i);
  }
}
const balance=Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow);
console.log(JSON.stringify({scenario:scenario.version,seconds:solver.time,overall,outsideInflow,land,totalDamage:game.totals().totalDamage,relativeBalance:balance},null,2));
