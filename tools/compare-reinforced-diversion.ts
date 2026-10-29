/** Test playable dams at the surveyed crests crossed by the distinct western trench. */
import {readFileSync} from 'node:fs';
import {Game, type Face} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];if(mode!=='reinforced')throw Error('Aufruf: reinforced [--omit=0…4]');
const omitArg=process.argv.find(a=>a.startsWith('--omit='));
const omit=omitArg?Number(omitArg.slice(7)):null;
if(omit!==null&&(!Number.isInteger(omit)||omit<0||omit>4))throw Error('Dammindex muss zwischen 0 und 4 liegen');
const onlyArg=process.argv.find(a=>a.startsWith('--only='));
const rawOnly=onlyArg?onlyArg.slice(7).split(','):null;
if(rawOnly&&(omit!==null||rawOnly.some(v=>!/^\d$/.test(v)||Number(v)>4)||new Set(rawOnly).size!==rawOnly.length))throw Error('Auswahl: --only=0,1,…,4 ohne --omit');
const only=rawOnly?.map(Number)??null;
const damsArg=process.argv.find(a=>a.startsWith('--dams='));
const dams=damsArg?Number(damsArg.slice(7)):2;
if(!Number.isInteger(dams)||dams<0||dams>3)throw Error('Referenzdämme: 0 bis 3');
const noTrench=process.argv.includes('--no-trench');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!=='1.4-draft'||fixture.scenario!==scenario.version||scenario.grid.width!==200)throw Error('Szenario passt nicht');
const game=new Game(scenario),solver=game.solver,initial=solver.volume();
for(const [i,segment] of fixture.segments.slice(0,dams).entries()){
 const r=game.apply(`reference-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],solver.width)});if(!r.ok)throw Error(r.reason);
}
const faces:Face[]=[{axis:'x',index:6266},{axis:'x',index:6664},{axis:'x',index:8054},{axis:'y',index:5643},{axis:'y',index:6434}];
for(const face of faces)if(!scenario.surveyCrests.some(f=>f.axis===face.axis&&f.index===face.index))throw Error('Geländekante fehlt');
const actions=faces.flatMap((face,i)=>{if(i===omit||(only&&!only.includes(i)))return []; const r=game.apply(`reinforce-${i}`,{kind:'dam',faces:[face]});if(!r.ok)throw Error(`Damm ${i}: ${r.reason}`);return [{face,result:r}];});
const trench=noTrench?null:game.apply('trench',{kind:'trench',cells:trenchPath([0,46],[47,26],solver.width)});if(trench&&!trench.ok)throw Error(trench.reason);
const afterActions=solver.volume();
while(solver.time<scenario.parameters.duration-1e-9){const t=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);}
console.log(JSON.stringify({scenario:scenario.version,mode,dams,noTrench,omit,only,faces,actions,trench,initial,afterActions,budget:game.budget,...game.totals(),relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)},null,2));
