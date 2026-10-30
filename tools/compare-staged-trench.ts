/** Compare prepared dams with a later trench on the delivered scenario. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const argument=process.argv[2],at=argument==='control'?null:Number(argument);
if(at!==null && (!Number.isFinite(at)||at<0||at>=scenario.parameters.duration))throw Error('Aufruf: control | SEKUNDEN');
const splitArg=process.argv.find(arg=>arg.startsWith('--control-at='));
const controlAt=splitArg?Number(splitArg.slice(13)):null;
if(controlAt!==null && (at!==null||!Number.isFinite(controlAt)||controlAt<0||controlAt>=scenario.parameters.duration))throw Error('--control-at nur für Kontrolle und innerhalb der Runde');
const routeArg=process.argv.find(arg=>arg.startsWith('--route='));
let route:[[number,number],[number,number]]=[[0,4],[25,4]];
if(routeArg){
  const raw=routeArg.slice(8).split(','),values=raw.map(Number),{width,height}=scenario.grid;
  if(raw.length!==4||raw.some(v=>!/^\d+$/.test(v))||values.some((v,i)=>!Number.isInteger(v)||v<0||v>=(i%2===0?width:height)))throw Error('Route: --route=X0,Y0,X1,Y1');
  route=[[values[0],values[1]],[values[2],values[3]]];
}
const tipArg=process.argv.find(arg=>arg.startsWith('--tip='));
const tipRaw=tipArg?tipArg.slice(6):'0';
if(!/^(?:-[1-4]|[0-4])$/.test(tipRaw))throw Error('--tip muss ein ganzzahliger Versatz von −4 bis 4 sein');
const tip=Number(tipRaw);
const game=new Game(scenario),solver=game.solver,initial=solver.volume();
for(const [i,segment] of fixture.segments.slice(0,3).entries()){
  const end:[number,number]=[segment[1][0]+(i===1?tip:0),segment[1][1]];
  const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],end,solver.width)});
  if(!result.ok)throw Error(result.reason);
}
let applied=at===null, splitDone=controlAt===null, before:ReturnType<Game['totals']>|null=null,actionTime:number|null=null;
while(solver.time<scenario.parameters.duration-1e-9){
  if(!splitDone && controlAt!==null && solver.time>=controlAt-1e-9)splitDone=true;
  if(!applied && at!==null && solver.time>=at-1e-9){
    before=game.totals(); actionTime=solver.time;
    const result=game.apply('trench',{kind:'trench',cells:trenchPath(route[0],route[1],solver.width)});
    if(!result.ok)throw Error(result.reason); applied=true;
  }
  const target=!applied && at!==null?at:!splitDone && controlAt!==null?controlAt:scenario.parameters.duration;
  const t=solver.time,dt=solver.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,route,tip,at,controlAt,actionTime,before,budget:game.budget,...game.totals(),relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)},null,2));
