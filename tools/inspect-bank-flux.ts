/** Recalculate Rusanov mass flux on selected western-bank faces before each solver step. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const candidate=process.argv.includes('--candidate');
if(candidate){
 if(scenario.version!=='1.2-draft')throw Error('Kandidatenvergleich benötigt den historischen Szenarioentwurf 1.2');
 scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*0.75]);
 scenario.parameters.inflowCells=Array.from({length:scenario.grid.width},(_,x)=>x).filter(x=>x<150&&scenario.waterMask[x]===1);
}
const game=new Game(scenario),s=game.solver,w=s.width,initial=s.volume();
const mode=process.argv[2]??'baseline';
if(mode==='bank') {
 const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
 if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
 for(const [i,segment] of fixture.segments.entries()) {
  const result=game.apply(`bank-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],w)});
  if(!result.ok)throw Error(result.reason);
 }
} else if(mode!=='baseline')throw Error('Argument: baseline | bank');
const bands=[[0,49],[50,119]] as const;
const faces=bands.map(([y0,y1])=>{
 const list:{l:number;r:number;crest:number}[]=[];
 for(let y=y0;y<=y1;y++)for(let x=1;x<w;x++) {
  const l=y*w+x-1,r=l+1;
  if(!scenario.waterMask[l]&&scenario.waterMask[r])list.push({l,r,crest:s.crestX[y*(w+1)+x]});
 }
 return list;
});
const totals=faces.map(()=>({intoLand:0,backToWater:0}));
while(s.time<scenario.parameters.duration-1e-9){
 const maxDt=Math.min(1,scenario.parameters.duration-s.time),dt=s.stableStep(maxDt),t=s.time;
 faces.forEach((list,k)=>{for(const {l,r,crest} of list){
  const hl=s.h[l],hr=s.h[r],z=Math.max(s.bed[l],s.bed[r],crest);
  const al=Math.max(0,hl+s.bed[l]-z),ar=Math.max(0,hr+s.bed[r]-z);
  const nl=hl>1e-10?s.qx[l]*al/hl:0,nr=hr>1e-10?s.qx[r]*ar/hr:0;
  const ul=al>1e-10?nl/al:0,ur=ar>1e-10?nr/ar:0;
  const wave=Math.max(Math.abs(ul)+Math.sqrt(s.gravity*al),Math.abs(ur)+Math.sqrt(s.gravity*ar));
  const towardLand=-0.5*(nl+nr-wave*(ar-al))*dt*s.cellSize;
  totals[k].intoLand+=Math.max(0,towardLand);totals[k].backToWater+=Math.max(0,-towardLand);
 }});
 const actual=s.step(maxDt);if(actual!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,actual);game.updateDamage(actual);
}
console.log(JSON.stringify({version:scenario.version,candidate,mode,initialVolume:initial,finalVolume:s.volume(),inflow:s.inflow,outflow:s.outflow,budget:game.budget,...game.totals(),bands:bands.map((rows,i)=>({rows,faces:faces[i].length,...totals[i],netIntoLand:totals[i].intoLand-totals[i].backToWater}))},null,2));
