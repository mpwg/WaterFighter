/** Rank individual water-mask-to-land faces by separately reconstructed mass flux. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),s=game.solver,w=s.width,h=s.height,initial=s.volume();
type Face={axis:'x'|'y';index:number;a:number;b:number;sign:number;into:number;back:number};
const faces:Face[]=[];
function add(axis:'x'|'y',index:number,a:number,b:number){
 if(Boolean(scenario.waterMask[a])===Boolean(scenario.waterMask[b]))return;
 faces.push({axis,index,a,b,sign:scenario.waterMask[a]?1:-1,into:0,back:0});
}
for(let y=0;y<h;y++)for(let x=1;x<w;x++)add('x',y*(w+1)+x,y*w+x-1,y*w+x);
for(let y=1;y<h;y++)for(let x=0;x<w;x++)add('y',y*w+x,(y-1)*w+x,y*w+x);
function flux(f:Face){
 const {a,b,axis,index}=f,ha=s.h[a],hb=s.h[b],crest=axis==='x'?s.crestX[index]:s.crestY[index],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return f.sign*0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=s.stableStep(maxDt);
 for(const face of faces){const amount=flux(face)*dt;face.into+=Math.max(0,amount);face.back+=Math.max(0,-amount);}
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
}
faces.sort((a,b)=>b.into-a.into);
const ranked=faces.map(f=>({...f,water:[(f.sign>0?f.a:f.b)%w,Math.floor((f.sign>0?f.a:f.b)/w)],land:[(f.sign>0?f.b:f.a)%w,Math.floor((f.sign>0?f.b:f.a)/w)]}));
console.log(JSON.stringify({scenario:scenario.version,time:s.time,faceCount:faces.length,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),ranked},null,2));
