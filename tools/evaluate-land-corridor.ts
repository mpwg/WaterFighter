/** Screen the previously identified corridors using actual, individually validated trench actions. */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Game } from '../src/simulation/game';
import { validateScenario } from '../src/scenario';

const mode=process.argv[2];
if(!['baseline','0','1'].includes(mode)) throw Error('Aufruf: bun tools/evaluate-land-corridor.ts baseline|0|1');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),solver=game.solver,w=solver.width,initial=solver.volume();
let cells=0,segments=0;
if(mode!=='baseline') {
  const search=spawnSync(process.execPath,['tools/find-land-routes.ts'],{encoding:'utf8'});
  if(search.status!==0) throw Error(`Korridorsuche fehlgeschlagen: ${search.stderr}`);
  const route=JSON.parse(search.stdout).routes[Number(mode)] as {path:[number,number][]}|null;
  if(!route) throw Error('Korridor nicht gefunden');
  // Split at turns without reusing a cell: each segment is a straight playable action.
  const path=route.path; let start=0;
  while(start<path.length) {
    let end=start;
    if(start+1<path.length) {
      const dx=path[start+1][0]-path[start][0],dy=path[start+1][1]-path[start][1];
      end++;
      while(end+1<path.length && path[end+1][0]-path[end][0]===dx && path[end+1][1]-path[end][1]===dy) end++;
    }
    const indices=path.slice(start,end+1).map(([x,y])=>y*w+x);
    const result=game.apply(`corridor-${segments}`,{kind:'trench',cells:indices});
    if(!result.ok) throw Error(`Segment ${segments}: ${result.reason}`);
    cells+=indices.length;segments++;start=end+1;
  }
}
let westOutflow=0;
while(solver.time<scenario.parameters.duration-1e-9) {
  const t=solver.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=solver.stableStep(maxDt);
  if(solver.openBoundary.left) for(let y=0;y<solver.height;y++) westOutflow+=Math.max(0,-solver.qx[y*w])*solver.cellSize*dt;
  if(solver.step(maxDt)!==dt) throw Error('Zeitschritt stimmt nicht');
  game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,mode,cells,segments,budget:game.budget,...game.totals(),westOutflow,relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)},null,2));
