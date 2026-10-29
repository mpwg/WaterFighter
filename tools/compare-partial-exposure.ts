/** Compare damaged buildings and water in the separate trench after a 180 s intervention. */
import {readFileSync,writeFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];if(mode!=='control'&&mode!=='trench')throw Error('Aufruf: control | trench');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
if(scenario.version!=='1.4-draft'||scenario.grid.width!==200||scenario.parameters.duration!==300)throw Error('Szenario passt nicht');
const game=new Game(scenario),s=game.solver,initial=s.volume();
for(const [i,[a,b]] of [[[26,0],[26,10]],[[26,10],[33,17]],[[41,28],[46,28]]].entries()){
 const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(a as [number,number],b as [number,number],s.width)});if(!result.ok)throw Error(result.reason);
}
const cells=trenchPath([0,46],[47,26],s.width),area=s.cellSize**2;
const sample=()=>({time:s.time,...game.totals(),routeVolume:cells.reduce((sum,i)=>sum+s.h[i]*area,0),buildings:game.status()});
const samples=[];let action:ReturnType<Game['apply']>|null=null,beforeAction=0,afterAction=0;
for(const target of [180,210,240,270,300]){
 while(s.time<target-1e-9){const t=s.time,dt=s.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);}
 if(target===180){beforeAction=s.volume();if(mode==='trench'){action=game.apply('trench',{kind:'trench',cells});if(!action.ok)throw Error(action.reason);}afterAction=s.volume();}
 samples.push(sample());
 const snapshotArg=process.argv.find(arg=>arg.startsWith('--snapshot='));
 if(target===270&&snapshotArg)writeFileSync(snapshotArg.slice(11),JSON.stringify({scenario:scenario.version,mode,time:s.time,bed:Array.from(s.bed),depth:Array.from(s.h),qx:Array.from(s.qx),qy:Array.from(s.qy),buildings:game.status(),dams:[...game.damFaces],trenches:[...game.trenchCells]}));
}
console.log(JSON.stringify({scenario:scenario.version,mode,budget:game.budget,action,beforeAction,afterAction,samples,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
