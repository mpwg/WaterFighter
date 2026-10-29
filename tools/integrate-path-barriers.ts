/** Integrate modeled mass flux through two selected internal faces across one round. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),s=game.solver,w=s.width,initial=s.volume();
const faces=[{axis:'y' as const,index:42*w+58},{axis:'y' as const,index:89*w+95}];
const mode=process.argv[2]??'baseline';
if(mode==='0'||mode==='1') {const result=game.apply(`probe-${mode}`,{kind:'dam',faces:[faces[Number(mode)]]});if(!result.ok)throw Error(result.reason);}
else if(mode!=='baseline')throw Error('Argument: baseline | 0 | 1');
const totals=faces.map(()=>({forward:0,reverse:0,maxForwardRate:0}));
while(s.time<scenario.parameters.duration-1e-9){
 const maxDt=Math.min(1,scenario.parameters.duration-s.time),dt=s.stableStep(maxDt),t=s.time;
 faces.forEach((face,k)=>{
  const b=face.index,a=b-w,ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],s.crestY[face.index]);
  const aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z);
  const na=ha>1e-10?s.qy[a]*aa/ha:0,nb=hb>1e-10?s.qy[b]*ab/hb:0;
  const ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
  const wave=Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab));
  const rate=0.5*(na+nb-wave*(ab-aa))*s.cellSize;
  totals[k].forward+=Math.max(0,rate)*dt;totals[k].reverse+=Math.max(0,-rate)*dt;totals[k].maxForwardRate=Math.max(totals[k].maxForwardRate,rate);
 });
 const actual=s.step(maxDt);if(actual!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({version:scenario.version,mode,budget:game.budget,...game.totals(),faces:totals,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
