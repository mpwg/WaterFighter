/** Compare water-level differences across the reference dam faces with and without dams. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const shield=new Game(scenario),baseline=new Game(scenario);
for(const [i,a] of fixture.strategies.shield.entries()){
 const result=shield.apply(`dam-${i}`,{kind:'dam',faces:damPath(a.start,a.end,shield.solver.width)});
 if(!result.ok)throw Error(result.reason);
}
const initial=baseline.solver.volume();
function advance(game:Game,target:number){const s=game.solver;while(s.time<target-1e-9){const t=s.time,dt=s.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);}}
function difference(game:Game,key:string){
 const s=game.solver,[axis,raw]=key.split(':'),i=Number(raw),x=axis==='x'?i%(s.width+1):i%s.width,y=axis==='x'?Math.floor(i/(s.width+1)):Math.floor(i/s.width);
 const a=axis==='x'?y*s.width+x-1:(y-1)*s.width+x,b=axis==='x'?a+1:y*s.width+x;
 if(a<0||b>=s.h.length)throw Error(`Randkante ${key}`);
 const left=s.bed[a]+s.h[a],right=s.bed[b]+s.h[b];return {left,right,difference:left-right};
}
const rows=[];
for(const time of [60,90,120,150,180,210,240,270,300]){
 advance(shield,time);advance(baseline,time);
 const comparisons=[...shield.damFaces.keys()].map(key=>{const withDam=difference(shield,key),without=difference(baseline,key);return {key,withDam,without,contrast:Math.abs(withDam.difference)-Math.abs(without.difference)};});
 const peak=comparisons.reduce((a,b)=>a.contrast>b.contrast?a:b);
 rows.push({time,peak,shieldDamage:shield.totals().totalDamage,baselineDamage:baseline.totals().totalDamage});
}
const balance=(g:Game)=>{const s=g.solver;return Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow);};
console.log(JSON.stringify({scenario:scenario.version,rows,shieldBalance:balance(shield),baselineBalance:balance(baseline)},null,2));
