/** Inspect motion through two proposed locations; cell-centred momentum is a proxy, not an exact face flux. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'))),game=new Game(scenario),s=game.solver;
const mode=process.argv[2]??'baseline';
if(mode==='trench') {const result=game.apply('probe',{kind:'trench',cells:trenchPath([80,10],[80,80],s.width)});if(!result.ok)throw Error(result.reason);}
else if(mode==='demolish') {const result=game.apply('probe',{kind:'demolish',buildingId:'w105310525-0'});if(!result.ok)throw Error(result.reason);}
else if(mode!=='baseline')throw Error('Argument: baseline | trench | demolish');
const building=game.buildings.find(b=>b.id==='w105310525-0');if(!building)throw Error('Gebäude fehlt');
const cell=45*s.width+80,initial=s.volume();let trenchMotion=0,buildingMotion=0,buildingMaxSpeed=0,faceForward=0,faceBackward=0;
function faceFlux(a:number,b:number,crest:number){
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z);
 const na=ha>1e-10?s.qy[a]*aa/ha:0,nb=hb>1e-10?s.qy[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return 0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=s.stableStep(maxDt);
 const rate=faceFlux(cell,cell+s.width,s.crestY[46*s.width+80]);faceForward+=Math.max(0,rate)*dt;faceBackward+=Math.max(0,-rate)*dt;
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
 // Approximate integrated |q_y| along one cell-width cross-section; not the Rusanov face flux.
 trenchMotion+=Math.abs(s.qy[cell])*s.cellSize*dt;
 for(const i of building.cells){buildingMotion+=Math.hypot(s.qx[i],s.qy[i])*dt; if(s.h[i]>.01)buildingMaxSpeed=Math.max(buildingMaxSpeed,Math.hypot(s.qx[i],s.qy[i])/s.h[i]);}
}
console.log(JSON.stringify({version:scenario.version,mode,probeCell:[80,45],cellCentreMomentumProxyM3:trenchMotion,face:{from:[80,45],to:[80,46],forwardM3:faceForward,backwardM3:faceBackward},buildingId:building.id,buildingCells:building.cells.length,buildingMotionProxy:buildingMotion,buildingMaxSpeed,damage:game.totals().totalDamage,budget:game.budget,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
