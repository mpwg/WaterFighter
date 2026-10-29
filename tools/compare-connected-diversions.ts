/** Compare the two northern trenches as independently confirmed actions. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];if(!['both','both-reverse'].includes(mode))throw Error('Aufruf: both | both-reverse');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'))),fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!==fixture.scenario)throw Error('Szenarioversion stimmt nicht');
const game=new Game(scenario),s=game.solver,initial=s.volume();
for(const [i,segment] of fixture.segments.slice(0,3).entries()){const r=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],s.width)});if(!r.ok)throw Error(r.reason);}
const paths=[trenchPath([0,4],[25,4],s.width),trenchPath([0,3],[38,11],s.width)];
if(mode==='both-reverse')paths.reverse();
const actions=paths.map((cells,i)=>{const r=game.apply(`trench-${i}`,{kind:'trench',cells});if(!r.ok)throw Error(r.reason);return r;});
const volumeAfterActions=s.volume();
while(s.time<scenario.parameters.duration-1e-9){const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);}
console.log(JSON.stringify({scenario:scenario.version,mode,actions,initialVolume:initial,volumeAfterActions,budget:game.budget,...game.totals(),relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
