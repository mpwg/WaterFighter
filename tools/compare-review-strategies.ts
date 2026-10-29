/** Exploratory review candidates; all changes are in memory, not the scenario package. */
import {readFileSync} from 'node:fs';
import {Game, type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];
const cases:Record<string,{left:boolean;depth:number;dams:number;trench?:[[number,number],[number,number]];demolish?:string}>={
 original:{left:false,depth:0.8,dams:0},
 open:{left:true,depth:3,dams:0},
 trench:{left:true,depth:3,dams:0,trench:[[0,4],[25,4]]},
 dam3:{left:true,depth:3,dams:3},
 dam3trench:{left:true,depth:3,dams:3,trench:[[0,4],[25,4]]},
 dam2:{left:true,depth:3,dams:2},
 dam2trench:{left:true,depth:3,dams:2,trench:[[0,10],[23,10]]},
 dam2demolish:{left:true,depth:3,dams:2,demolish:'w33581744-0'},
 combined:{left:true,depth:3,dams:2,trench:[[0,10],[23,10]],demolish:'w33581744-0'},
};
const config=cases[mode];if(!config)throw Error(`Fall wählen: ${Object.keys(cases).join(', ')}`);
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!=='1.3-draft'||fixture.scenario!==scenario.version)throw Error('Szenario oder Referenzversion stimmt nicht');
if(config.left&&!scenario.parameters.outflowEdges.includes('left'))scenario.parameters.outflowEdges.push('left');
scenario.parameters.trenchDepth=config.depth;
const game=new Game(scenario),s=game.solver,initial=s.volume();
const actions:Action[]=[];
for(const segment of fixture.segments.slice(0,config.dams))actions.push({kind:'dam',faces:damPath(segment[0],segment[1],s.width)});
if(config.demolish)actions.push({kind:'demolish',buildingId:config.demolish});
if(config.trench)actions.push({kind:'trench',cells:trenchPath(...config.trench,s.width)});
const results=actions.map((a,i)=>{const r=game.apply(`review-${i}`,a);if(!r.ok){console.log(JSON.stringify({scenario:scenario.version,mode,experimental:config,invalidAction:a,reason:r.reason}));process.exit(0);}return r;});
let leftOutflow=0;
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=s.stableStep(maxDt);
 if(config.left)for(let y=0;y<s.height;y++)leftOutflow+=Math.max(0,-s.qx[y*s.width])*s.cellSize*dt;
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,mode,experimental:config,actions,results,time:s.time,budget:game.budget,...game.totals(),inflow:s.inflow,outflow:s.outflow,leftOutflow,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),buildings:game.status()},null,2));
