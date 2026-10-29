/** Screen the previously identified corridors using actual, individually validated trench actions. */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Game } from '../src/simulation/game';
import { damPath } from '../src/simulation/path';
import { validateScenario } from '../src/scenario';

const mode=process.argv[2];
if(!['baseline','0','1'].includes(mode)) throw Error('Aufruf: bun tools/evaluate-land-corridor.ts baseline|0|1');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),solver=game.solver,w=solver.width,initial=solver.volume();
const avoidSensitive=process.argv.includes('--avoid-sensitive-all')?'all':process.argv.includes('--avoid-sensitive')?'initial':'none';
const avoidAllCrests=process.argv.includes('--avoid-all-crests');
const dams=process.argv.includes('--dams')?2:0;
if(dams) {
  const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8')) as {scenario:string;segments:[[number,number],[number,number]][]};
  if(fixture.scenario!==scenario.version) throw Error('Referenzstrategie passt nicht zur Szenarioversion');
  for(const [i,[start,end]] of fixture.segments.slice(0,dams).entries()) {
    const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(start,end,w)});
    if(!result.ok) throw Error(`Damm ${i}: ${result.reason}`);
  }
}
let cells=0,segments=0;
if(mode!=='baseline') {
  const search=spawnSync(process.execPath,['tools/find-land-routes.ts',...(avoidSensitive==='all'?['--avoid-sensitive-all']:avoidSensitive==='initial'?['--avoid-sensitive']:[]),...(avoidAllCrests?['--avoid-all-crests']:[])],{encoding:'utf8'});
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
const cutSurveyCrests=scenario.surveyCrests.filter(face=>{
  const x=face.axis==='x'?face.index%(w+1):face.index%w;
  const y=face.axis==='x'?Math.floor(face.index/(w+1)):Math.floor(face.index/w);
  const b=y*w+x,a=face.axis==='x'?b-1:b-w;
  return game.trenchCells.has(a)&&game.trenchCells.has(b);
});
// Diagnostic counterfactual only: the game normally lowers these surveyed crests.
const retainCrests=process.argv.includes('--retain-crests');
if(retainCrests) for(const face of cutSurveyCrests) {
  const field=face.axis==='x'?solver.crestX:solver.crestY;
  field[face.index]=Math.max(field[face.index],face.crest);
}
let westOutflow=0;
while(solver.time<scenario.parameters.duration-1e-9) {
  const t=solver.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=solver.stableStep(maxDt);
  if(solver.openBoundary.left) for(let y=0;y<solver.height;y++) westOutflow+=Math.max(0,-solver.qx[y*w])*solver.cellSize*dt;
  if(solver.step(maxDt)!==dt) throw Error('Zeitschritt stimmt nicht');
  game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,mode,dams,avoidSensitive,avoidAllCrests,cells,segments,cutSurveyCrests,retainCrests,budget:game.budget,...game.totals(),westOutflow,relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow),...(process.argv.includes('--buildings')?{buildings:game.status()}: {})},null,2));
