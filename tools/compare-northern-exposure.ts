/** Compare building exposure and trench storage with the same three prepared dams. */
import {readFileSync,writeFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];if(mode!=='control'&&mode!=='trench')throw Error('Aufruf: control | trench');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'))),fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenario passt nicht zur Referenz');
const game=new Game(scenario),s=game.solver,initial=s.volume();
for(const [i,segment] of fixture.segments.slice(0,3).entries()){const r=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],s.width)});if(!r.ok)throw Error(r.reason);}
const route=trenchPath([0,3],[38,11],s.width);
if(mode==='trench'){const r=game.apply('trench',{kind:'trench',cells:route});if(!r.ok)throw Error(r.reason);}
const samples=[];
for(const target of [60,90,120,150,180,210,240,270,300]){
 while(s.time<target-1e-9){const t=s.time,dt=s.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);}
 samples.push({time:s.time,totalDamage:game.totals().totalDamage,routeVolume:route.reduce((sum,i)=>sum+s.h[i]*s.cellSize**2,0),buildings:game.status()});
 const outputArg=process.argv.find(arg=>arg.startsWith('--snapshot='));
 if(target===210&&outputArg)writeFileSync(outputArg.slice(11),JSON.stringify({scenario:scenario.version,mode,time:s.time,bed:Array.from(s.bed),depth:Array.from(s.h),qx:Array.from(s.qx),qy:Array.from(s.qy),buildings:game.status(),dams:[...game.damFaces],trenches:[...game.trenchCells]}));
}
console.log(JSON.stringify({scenario:scenario.version,mode,route:[[0,3],[38,11]],budget:game.budget,samples,waterBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
