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
const shiftArg=process.argv.find(a=>a.startsWith('--guard-shift='));
const shiftRaw=shiftArg?shiftArg.slice(14).split(','):['0','0'];
if(shiftRaw.length!==2||shiftRaw.some(v=>!/^(?:-1|0|1)$/.test(v)))throw Error('Schutzdammverschiebung: --guard-shift=X,Y mit Werten −1 bis 1');
const [guardX,guardY]=shiftRaw.map(Number);
function rowOffset(name:string){const arg=process.argv.find(a=>a.startsWith(`--${name}=`));const raw=arg?arg.slice(name.length+3):'0';if(!/^(?:-1|0|1)$/.test(raw))throw Error(`${name} muss −1, 0 oder 1 sein`);return Number(raw);}
const startRow=rowOffset('guard-start-row'),endRow=rowOffset('guard-end-row');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
if(scenario.version!=='1.4-draft'||scenario.grid.width!==200||scenario.parameters.duration!==300)throw Error('Szenario passt nicht');
const westClosed=process.argv.includes('--closed-west');
if(westClosed)scenario.parameters.outflowEdges=scenario.parameters.outflowEdges.filter(edge=>edge!=='left');
const g=new Game(scenario),s=g.solver,initial=s.volume();
const actions:Action[]=[{kind:'dam',faces:damPath([26,0],[26,10],s.width)},{kind:'dam',faces:damPath([26,10],[26+length,10+length],s.width)},{kind:'dam',faces:damPath([43-guardRadius+guardX,28+guardY+startRow],[44+guardRadius+guardX,28+guardY+endRow],s.width)}];
const results=actions.map((a,i)=>{const result=g.apply(`dam-${i}`,a);if(!result.ok)throw Error(`Damm ${i}: ${result.reason}`);return result;});
let westOutflow=0;
let trench:ReturnType<Game['apply']>|null=null,actionTime:number|null=null,volumeBefore:number|null=null,volumeAfter:number|null=null;
function dig(){volumeBefore=s.volume();actionTime=s.time;trench=g.apply('trench',{kind:'trench',cells:trenchPath([0,46],[47,26],s.width)});if(!trench.ok)throw Error(trench.reason);volumeAfter=s.volume();}
if(mode==='trench'&&at===0)dig();
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,until=mode==='trench'&&trench===null?at-t:Infinity;
 let westRate=0;if(s.openBoundary.left)for(let y=0;y<s.height;y++)westRate+=Math.max(0,-s.qx[y*s.width])*s.cellSize;
 const dt=s.step(Math.min(1,scenario.parameters.duration-t,until));westOutflow+=westRate*dt;
 g.addInflow(t,dt);g.updateDamage(dt);if(mode==='trench'&&trench===null&&s.time>=at-1e-9)dig();
}
console.log(JSON.stringify({scenario:scenario.version,length,mode,at,guardRadius,guardShift:[guardX,guardY],startRow,endRow,westClosed,actionTime,results,trench,volumeBefore,volumeAfter,westOutflow,budget:g.budget,...g.totals(),relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
