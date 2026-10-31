import type { GameCommand, GameSnapshot, Phase, V4Map } from './types';
import { createSimulation, demolishBuilding, setBarrier, simulationAudit, stepSimulation } from './simulation';
import type { Simulation } from './simulation';
export const GAME_DURATION=90;
export const FIXED_STEP=.025;
export const DEMOLITION_SURCHARGE=250;
export interface Game {
  map:V4Map;simulation:Simulation;phase:Phase;ticks:number;remainder:number;
  barrierCharges:number;demolitionCharges:number;buildingDamage:Float64Array;demolitionDamage:number;
  perimeter:number[][];
}
export function createGame(map:V4Map):Game {
  const n=map.width*map.height,occupied=new Set(map.buildings.flatMap(b=>b.cells));
  const perimeter=map.buildings.map(b=>{
    const cells=new Set<number>();
    for(const i of b.cells){const x=i%map.width;for(const j of [x>0?i-1:-1,x+1<map.width?i+1:-1,i-map.width,i+map.width])if(j>=0&&j<n&&!occupied.has(j))cells.add(j);}
    return [...cells];
  });
  return { map,simulation:createSimulation(map),phase:'ready',ticks:0,remainder:0,barrierCharges:3,demolitionCharges:2,
    buildingDamage:new Float64Array(map.buildings.length),demolitionDamage:0,perimeter };
}
export function demolitionCost(game:Game,buildingId:string):number {
  const index=game.map.buildings.findIndex(b=>b.id===buildingId);
  if(index<0||game.simulation.demolished.has(buildingId))return 0;
  return Math.max(0,game.map.buildings[index].value-game.buildingDamage[index])+DEMOLITION_SURCHARGE;
}
export function commandGame(game:Game,command:GameCommand):{ok:boolean;reason?:string} {
  const fail=(reason:string)=>({ok:false,reason});
  if(command.type==='reset'){Object.assign(game,createGame(game.map));return {ok:true};}
  if(command.type==='start'){if(game.phase!=='ready')return fail('Die Runde läuft bereits.');game.phase='running';return {ok:true};}
  if(command.type==='pause'){if(game.phase!=='running')return fail('Keine laufende Runde.');game.phase='paused';return {ok:true};}
  if(command.type==='resume'){if(game.phase!=='paused')return fail('Die Runde ist nicht pausiert.');game.phase='running';return {ok:true};}
  if(game.phase!=='running')return fail('Aktionen nur während der laufenden Runde.');
  if(command.type==='placeBarrier'||command.type==='removeBarrier'){
    const segment=game.map.barrierSegments.find(s=>s.id===command.segmentId);if(!segment)return fail('Ungültige Straßenquerung.');
    if(command.type==='removeBarrier'){
      if(!game.simulation.barriers.has(segment.id))return fail('Hier steht keine Barriere.');
      setBarrier(game.simulation,segment.id,false);return {ok:true};
    }
    if(game.simulation.barriers.has(segment.id))return fail('Hier steht bereits eine Barriere.');
    if(!game.barrierCharges)return fail('Keine Barrieren verfügbar.');
    // Shared faces cannot be stacked, even when adjacent placement candidates overlap.
    const requested=new Set(segment.faces.map(([a,b])=>a+':'+b));
    for(const s of game.map.barrierSegments)if(game.simulation.barriers.has(s.id)&&s.faces.some(([a,b])=>requested.has(a+':'+b)))return fail('Barrieren überschneiden sich.');
    setBarrier(game.simulation,segment.id,true);game.barrierCharges--;return {ok:true};
  }
  if(command.type==='demolish'){
    const index=game.map.buildings.findIndex(b=>b.id===command.buildingId);
    if(index<0)return fail('Ungültiges Gebäude.');
    if(game.simulation.demolished.has(command.buildingId))return fail('Gebäude bereits abgerissen.');
    if(!game.demolitionCharges)return fail('Kein Abriss verfügbar.');
    game.demolitionDamage+=demolitionCost(game,command.buildingId);
    demolishBuilding(game.simulation,command.buildingId);game.demolitionCharges--;return {ok:true};
  }
  return fail('Ungültiger Befehl.');
}
export function advanceGame(game:Game,seconds:number):void {
  if(game.phase!=='running'||!Number.isFinite(seconds)||seconds<=0)return;
  game.remainder+=Math.min(seconds,GAME_DURATION);
  while(game.remainder+1e-9>=FIXED_STEP&&game.ticks<3600){
    game.remainder-=FIXED_STEP;if(Math.abs(game.remainder)<1e-9)game.remainder=0;
    game.ticks++;const time=game.ticks*FIXED_STEP;
    stepSimulation(game.simulation,FIXED_STEP,time);
    for(let index=0;index<game.map.buildings.length;index++){
      const b=game.map.buildings[index];if(game.simulation.demolished.has(b.id))continue;
      let exposure=0;for(const i of game.perimeter[index])exposure+=Math.min(3,game.simulation.depths[i]);
      if(game.perimeter[index].length)exposure/=game.perimeter[index].length;
      const increment=b.value*exposure*FIXED_STEP/90;
      game.buildingDamage[index]=Math.min(b.value,game.buildingDamage[index]+increment);
    }
    if(game.ticks%600===0)game.barrierCharges=Math.min(3,game.barrierCharges+1);
    if(game.ticks===1800)game.demolitionCharges=Math.min(2,game.demolitionCharges+1);
  }
  if(game.ticks===3600){game.phase='finished';game.remainder=0;}
}
export function snapshotGame(game:Game):GameSnapshot {
  const time=game.ticks*FIXED_STEP,floodDamage=game.buildingDamage.reduce((sum,d)=>sum+d,0);
  return { phase:game.phase,time,points:100000-floodDamage-game.demolitionDamage,floodDamage,demolitionDamage:game.demolitionDamage,
    barrierCharges:game.barrierCharges,demolitionCharges:game.demolitionCharges,
    nextBarrierIn:15-time%15,nextDemolitionIn:time<45?45-time:null,
    barriers:[...game.simulation.barriers],demolished:[...game.simulation.demolished],buildingDamage:[...game.buildingDamage],
    demolitionCosts:game.map.buildings.map(b=>demolitionCost(game,b.id)),
    depths:Float32Array.from(game.simulation.depths),flowX:game.simulation.flowX.slice(),flowY:game.simulation.flowY.slice(),audit:simulationAudit(game.simulation) };
}
