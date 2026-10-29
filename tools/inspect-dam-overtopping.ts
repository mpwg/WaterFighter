/** Diagnose reconstructed mass flux across the delivered shield strategy's dam faces. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const game=new Game(scenario),s=game.solver,initial=s.volume();
for(const [i,a] of fixture.strategies.shield.entries()){
 const result=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(a.start,a.end,s.width)});
 if(!result.ok)throw Error(result.reason);
}
type FaceStats={key:string;crest:number;first:number|null;peakHead:number;peakTime:number;positive:number;negative:number};
const faces:FaceStats[]=[...game.damFaces].map(([key,crest])=>({key,crest,first:null,peakHead:0,peakTime:0,positive:0,negative:0}));
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,dt=s.stableStep(Math.min(1,scenario.parameters.duration-t));
 for(const f of faces){
  const [axis,raw]=f.key.split(':'),index=Number(raw),x=axis==='x'?index%(s.width+1):index%s.width,y=axis==='x'?Math.floor(index/(s.width+1)):Math.floor(index/s.width);
  const a=axis==='x'?y*s.width+x-1:(y-1)*s.width+x,b=axis==='x'?a+1:y*s.width+x;
  if(a<0||b>=s.h.length)throw Error(`Randkante ${f.key}`);
  const crest=axis==='x'?s.crestX[index]:s.crestY[index],ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest);
  const head=Math.max(ha+s.bed[a]-z,hb+s.bed[b]-z,0);
  if(head>1e-6 && f.first===null)f.first=t;
  if(head>f.peakHead){f.peakHead=head;f.peakTime=t;}
  const al=Math.max(0,ha+s.bed[a]-z),ar=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
  const nl=ha>1e-10?q[a]*al/ha:0,nr=hb>1e-10?q[b]*ar/hb:0,ul=al>1e-10?nl/al:0,ur=ar>1e-10?nr/ar:0;
  const flux=0.5*(nl+nr-Math.max(Math.abs(ul)+Math.sqrt(s.gravity*al),Math.abs(ur)+Math.sqrt(s.gravity*ar))*(ar-al))*s.cellSize*dt;
  f.positive+=Math.max(0,flux);f.negative+=Math.max(0,-flux);
 }
 if(s.step(Math.min(1,scenario.parameters.duration-t))!==dt)throw Error('Zeitschritte stimmen nicht überein');
 game.addInflow(t,dt);game.updateDamage(dt);
}
const wet=faces.filter(f=>f.first!==null),peak=faces.reduce((a,b)=>a.peakHead>b.peakHead?a:b);
console.log(JSON.stringify({scenario:scenario.version,faces:faces.length,overtopped:wet.length,first:wet.length?Math.min(...wet.map(f=>f.first!)):null,peak,positive:faces.reduce((v,f)=>v+f.positive,0),negative:faces.reduce((v,f)=>v+f.negative,0),damage:game.totals().totalDamage,budget:game.budget,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
