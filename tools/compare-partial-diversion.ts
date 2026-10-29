/** Compare a separated western diversion with the same shortened prepared dams. */
import {readFileSync} from 'node:fs';
import {Game, type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const length=Number(process.argv[2]),mode=process.argv[3];
if(!Number.isInteger(length)||length<1||length>10||!['control','trench'].includes(mode))throw Error('Aufruf: LÄNGE(1–10) control|trench [--at=SEKUNDEN]');
const arg=process.argv.find(a=>a.startsWith('--at=')),at=arg?Number(arg.slice(5)):0;
if(!Number.isFinite(at)||at<0||at>=300||(mode==='control'&&at!==0))throw Error('Ungültiger Eingriffszeitpunkt');
const guardArg=process.argv.find(a=>a.startsWith('--guard-radius='));
const guardRaw=guardArg?guardArg.slice(15):'0';
if(!/^[0-5]$/.test(guardRaw))throw Error('Schutzdammradius muss zwischen 0 und 5 liegen');
const guardRadius=Number(guardRaw);
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
if(scenario.version!=='1.4-draft'||scenario.grid.width!==200||scenario.parameters.duration!==300)throw Error('Szenario passt nicht');
const g=new Game(scenario),s=g.solver,initial=s.volume();
const actions:Action[]=[{kind:'dam',faces:damPath([26,0],[26,10],s.width)},{kind:'dam',faces:damPath([26,10],[26+length,10+length],s.width)},{kind:'dam',faces:damPath([43-guardRadius,28],[44+guardRadius,28],s.width)}];
const results=actions.map((a,i)=>{const result=g.apply(`dam-${i}`,a);if(!result.ok)throw Error(`Damm ${i}: ${result.reason}`);return result;});
let trench:ReturnType<Game['apply']>|null=null,actionTime:number|null=null,volumeBefore:number|null=null,volumeAfter:number|null=null;
function dig(){volumeBefore=s.volume();actionTime=s.time;trench=g.apply('trench',{kind:'trench',cells:trenchPath([0,46],[47,26],s.width)});if(!trench.ok)throw Error(trench.reason);volumeAfter=s.volume();}
if(mode==='trench'&&at===0)dig();
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,until=mode==='trench'&&trench===null?at-t:Infinity,dt=s.step(Math.min(1,scenario.parameters.duration-t,until));
 g.addInflow(t,dt);g.updateDamage(dt);if(mode==='trench'&&trench===null&&s.time>=at-1e-9)dig();
}
console.log(JSON.stringify({scenario:scenario.version,length,mode,at,guardRadius,actionTime,results,trench,volumeBefore,volumeAfter,budget:g.budget,...g.totals(),relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
