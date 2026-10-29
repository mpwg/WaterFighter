/** Compare the geometry and action compatibility of two northern trench candidates. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'))),fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Referenz passt nicht zum Szenario');
const width=scenario.grid.width,routes=[trenchPath([0,4],[25,4],width),trenchPath([0,3],[38,11],width)],sets=routes.map(r=>new Set(r));
const shared=routes[0].filter(i=>sets[1].has(i)).map(i=>[i%width,Math.floor(i/width)]);
const cases=[];
for(let first=0;first<2;first++){
 const game=new Game(scenario);
 for(const [i,segment] of fixture.segments.slice(0,3).entries()){const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],width)});if(!result.ok)throw Error(result.reason);}
 const result=game.apply('first',{kind:'trench',cells:routes[first]});if(!result.ok)throw Error(result.reason);
 const next=game.preview({kind:'trench',cells:routes[1-first]});
 cases.push({first,firstResult:result,secondPreview:next});
}
console.log(JSON.stringify({scenario:scenario.version,routeLengths:routes.map(r=>r.length),shared,cases},null,2));
