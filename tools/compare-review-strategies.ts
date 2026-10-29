/** Compare review candidates on the delivered scenario; variations stay in memory. */
import {readFileSync} from 'node:fs';
import {Game, type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];
const numberOption=(name:string,fallback:number)=>{const arg=process.argv.find(a=>a.startsWith(`--${name}=`));if(!arg)return fallback;const value=Number(arg.slice(name.length+3));if(!Number.isFinite(value))throw Error(`Ungültiger Wert für ${name}`);return value;};
const at=numberOption('at',0),junction=numberOption('junction',0),entry=numberOption('entry',0),tip=numberOption('tip',0),trenchShift=numberOption('trench-row',0),trenchStart=numberOption('trench-start-row',0),trenchEnd=numberOption('trench-end-row',0);
if(at<0||at>=300||![junction,entry,tip,trenchShift,trenchStart,trenchEnd].every(Number.isInteger)||[junction,entry,tip,trenchShift,trenchStart,trenchEnd].some(n=>Math.abs(n)>1))throw Error('Zeit 0–299, Verschiebungen −1 bis 1');
const cases:Record<string,{left:boolean;depth:number;dams:number;trench?:[[number,number],[number,number]];demolish?:string}>={
 original:{left:false,depth:0.8,dams:0},
 open:{left:true,depth:3,dams:0},
 trench:{left:true,depth:3,dams:0,trench:[[0,4],[25,4]]},
 dam1:{left:true,depth:3,dams:1},
 dam1trench:{left:true,depth:3,dams:1,trench:[[0,4],[25,4]]},
 dam3:{left:true,depth:3,dams:3},
 dam3trench:{left:true,depth:3,dams:3,trench:[[0,4],[25,4]]},
 dam2:{left:true,depth:3,dams:2},
 dam2trench:{left:true,depth:3,dams:2,trench:[[0,10],[23,10]]},
 dam2demolish:{left:true,depth:3,dams:2,demolish:'w33581744-0'},
 combined:{left:true,depth:3,dams:2,trench:[[0,10],[23,10]],demolish:'w33581744-0'},
};
const config=cases[mode];if(!config)throw Error(`Fall wählen: ${Object.keys(cases).join(', ')}`);
const routeArg=process.argv.find(a=>a.startsWith('--route='));
if(routeArg){
 const raw=routeArg.slice(8).split(','),values=raw.map(Number);
 if(!config.trench||values.length!==4||raw.some(n=>!/^\d+$/.test(n))||values.some(n=>!Number.isInteger(n)||n<0||n>=200)||trenchShift||trenchStart||trenchEnd)throw Error('Route: --route=X0,Y0,X1,Y1 für einen Grabenfall ohne zusätzliche Zeilenverschiebung');
 config.trench=[[values[0],values[1]],[values[2],values[3]]];
}
const raw=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
const scenario=validateScenario(raw);
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!=='1.4-draft'||fixture.scenario!==scenario.version)throw Error('Szenario oder Referenzversion stimmt nicht');
scenario.parameters.outflowEdges=scenario.parameters.outflowEdges.filter(edge=>edge!=='left');
if(config.left)scenario.parameters.outflowEdges.push('left');
scenario.parameters.trenchDepth=config.depth;
const game=new Game(scenario),s=game.solver,initial=s.volume();
const actions:Action[]=[];
for(const [i,segment] of fixture.segments.slice(0,config.dams).entries()){
 const start:[number,number]=[segment[0][0]+(i===0?entry:i===1?junction:0),segment[0][1]];
 const end:[number,number]=[segment[1][0]+(i===0?junction:i===1?tip:0),segment[1][1]];
 actions.push({kind:'dam',faces:damPath(start,end,s.width)});
}
if(config.demolish)actions.push({kind:'demolish',buildingId:config.demolish});
if(config.trench){const [start,end]=config.trench;actions.push({kind:'trench',cells:trenchPath([start[0],start[1]+trenchShift+trenchStart],[end[0],end[1]+trenchShift+trenchEnd],s.width)});}
const retainCrests=process.argv.includes('--retain-crests');
if(retainCrests&&!config.trench)throw Error('--retain-crests erfordert einen Grabenfall');
const results:ReturnType<Game['apply']>[]=[];let applied=false,damageAtAction=0;
function applyActions(){damageAtAction=game.totals().totalDamage;for(const [i,a] of actions.entries()){
 const r=game.apply(`review-${i}`,a);results.push(r);
 if(!r.ok){console.log(JSON.stringify({scenario:scenario.version,mode,experimental:config,at,junction,entry,tip,trenchShift,trenchStart,trenchEnd,invalidAction:a,reason:r.reason}));process.exit(0);}
}
// Diagnostic counterfactual only: preserve survey crests crossed by the actual trench.
if(retainCrests)for(const face of scenario.surveyCrests){
 const x=face.axis==='x'?face.index%(s.width+1):face.index%s.width;
 const y=face.axis==='x'?Math.floor(face.index/(s.width+1)):Math.floor(face.index/s.width);
 const b=y*s.width+x,a=face.axis==='x'?b-1:b-s.width;
 if(game.trenchCells.has(a)&&game.trenchCells.has(b)){const field=face.axis==='x'?s.crestX:s.crestY;field[face.index]=Math.max(field[face.index],face.crest);}
}
applied=true;}
if(at===0)applyActions();
let leftOutflow=0;
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t,applied?Infinity:at-t),dt=s.stableStep(maxDt);
 if(config.left)for(let y=0;y<s.height;y++)leftOutflow+=Math.max(0,-s.qx[y*s.width])*s.cellSize*dt;
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
 if(!applied&&s.time>=at-1e-9)applyActions();
}
console.log(JSON.stringify({scenario:scenario.version,mode,experimental:config,retainCrests,at,junction,entry,tip,trenchShift,trenchStart,trenchEnd,damageAtAction,actions,results,time:s.time,budget:game.budget,...game.totals(),inflow:s.inflow,outflow:s.outflow,leftOutflow,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),buildings:game.status()},null,2));
