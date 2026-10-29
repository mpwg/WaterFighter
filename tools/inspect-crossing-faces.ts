/** Measure modeled flows at surveyed faces intersecting mapped crossing lines. */
import {readFileSync} from 'node:fs';
import {Game, type Face} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const geometry=JSON.parse(readFileSync(process.argv[2]??'/tmp/waterfighter-crossing-overlap-new.json','utf8'));
if(geometry.version!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const game=new Game(scenario),s=game.solver,w=s.width,initial=s.volume();
const probes=new Map<string,{face:Face;surveyCrest:number;modelCrest:number;crossings:string[];wetSeconds:number;blockedSeconds:number;actualAbsM3:number;withoutCrestAbsM3:number}>();
for(const c of geometry.crossings)for(const f of c.intersectingCrests){
 const key=`${f.axis}:${f.index}`;let p=probes.get(key);
 if(!p){p={face:{axis:f.axis,index:f.index},surveyCrest:f.crest,modelCrest:f.axis==='x'?s.crestX[f.index]:s.crestY[f.index],crossings:[],wetSeconds:0,blockedSeconds:0,actualAbsM3:0,withoutCrestAbsM3:0};probes.set(key,p);}
 if(!p.crossings.includes(c.id))p.crossings.push(c.id);
}
function flux(a:number,b:number,axis:'x'|'y',crest:number){
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return 0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=s.stableStep(maxDt);
 for(const p of probes.values()){
  const {axis,index}=p.face,x=axis==='x'?index%(w+1):index%w,y=axis==='x'?Math.floor(index/(w+1)):Math.floor(index/w);
  const a=axis==='x'?y*w+x-1:(y-1)*w+x,b=axis==='x'?a+1:a+w;
  const crest=axis==='x'?s.crestX[index]:s.crestY[index],wet=Math.max(s.h[a],s.h[b])>0.05;
  if(wet){p.wetSeconds+=dt;if(Math.max(s.bed[a]+s.h[a],s.bed[b]+s.h[b])<=crest)p.blockedSeconds+=dt;}
  p.actualAbsM3+=Math.abs(flux(a,b,axis,crest))*dt;
  p.withoutCrestAbsM3+=Math.abs(flux(a,b,axis,-Infinity))*dt;
 }
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,duration:s.time,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),faces:[...probes.values()]},null,2));
