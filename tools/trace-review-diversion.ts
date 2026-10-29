/** Trace a passive marker injected at the eastern end of the proposed row-10 diversion. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];if(!['combined','dam2demolish','dam2'].includes(mode))throw Error('Fall: combined | dam2demolish | dam2');
const raw=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
const scenario=validateScenario(raw);
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!=='1.4-draft'||fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
if(!scenario.parameters.outflowEdges.includes('left')||scenario.parameters.trenchDepth!==3)throw Error('Ableitungsannahmen stimmen nicht');
const game=new Game(scenario),s=game.solver,w=s.width,h=s.height,n=w*h,area=s.cellSize**2,initial=s.volume();
for(const [i,segment] of fixture.segments.slice(0,2).entries()){const r=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],w)});if(!r.ok)throw Error(r.reason);}
if(mode!=='dam2'){const r=game.apply('demolition',{kind:'demolish',buildingId:'w33581744-0'});if(!r.ok)throw Error(r.reason);}
if(mode==='combined'){const r=game.apply('trench',{kind:'trench',cells:trenchPath([0,10],[23,10],w)});if(!r.ok)throw Error(r.reason);}
const marker=new Float64Array(n),change=new Float64Array(n), gate=10*(w+1)+24;
const ordered=process.argv.includes('--ordered');
const stages=ordered?Array.from({length:5},()=>new Float64Array(n)):[];
const stageChanges=stages.map(()=>new Float64Array(n));
let orderedWest=0,orderedOther=0,orderedTagged=0,maxStageDifference=0;
let tagged=0,west=0,other=0,maxBound=0;
const crossings=[20,15,10,5].map(x=>({x,left:0,right:0}));
function concentration(i:number){const v=s.h[i]*area;return v>1e-10?marker[i]/v:0;}
function flux(a:number,b:number,axis:'x'|'y',crest:number){
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return 0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
function transfer(a:number,b:number,rate:number,dt:number,isGate:boolean,section?:{x:number;left:number;right:number}){
 if(rate===0)return;const donor=rate>0?a:b,receiver=rate>0?b:a,volume=Math.abs(rate)*dt,c=concentration(donor),amount=volume*c;
 change[donor]-=amount;change[receiver]+=amount;
 if(section){if(rate<0)section.left+=amount;else section.right+=amount;}
 if(isGate&&rate<0){const newAmount=volume*Math.max(0,1-c);change[receiver]+=newAmount;tagged+=newAmount;}
 if(ordered){
  const cellVolume=s.h[donor]*area;let total=0;
  for(let k=0;k<stages.length;k++){
   const fraction=cellVolume>1e-10?stages[k][donor]/cellVolume:0;total+=fraction;
   const moved=volume*fraction,next=section&&rate<0&&k<crossings.length&&section.x===crossings[k].x?k+1:k;
   stageChanges[k][donor]-=moved;stageChanges[next][receiver]+=moved;
  }
  if(isGate&&rate<0){const fresh=volume*Math.max(0,1-total);stageChanges[0][receiver]+=fresh;orderedTagged+=fresh;}
 }
}
function exit(cell:number,rate:number,dt:number,isWest:boolean){if(rate<=0)return;const amount=rate*dt*concentration(cell);change[cell]-=amount;if(isWest)west+=amount;else other+=amount;
 if(ordered){const volume=s.h[cell]*area;for(let k=0;k<stages.length;k++){const part=volume>1e-10?rate*dt*stages[k][cell]/volume:0;stageChanges[k][cell]-=part;if(isWest&&k===4)orderedWest+=part;else orderedOther+=part;}}
}
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=s.stableStep(maxDt);change.fill(0);for(const c of stageChanges)c.fill(0);
 for(let y=0;y<h;y++)for(let x=1;x<w;x++){
  const a=y*w+x-1,b=a+1,index=y*(w+1)+x;
  transfer(a,b,flux(a,b,'x',s.crestX[index]),dt,index===gate,y===10?crossings.find(c=>c.x===x):undefined);
 }
 for(let y=1;y<h;y++)for(let x=0;x<w;x++){
  const b=y*w+x,a=b-w,index=y*w+x;transfer(a,b,flux(a,b,'y',s.crestY[index]),dt,false);
 }
 for(let y=0;y<h;y++){const l=y*w,r=l+w-1;if(s.openBoundary.left)exit(l,Math.max(0,-s.qx[l])*s.cellSize,dt,true);if(s.openBoundary.right)exit(r,Math.max(0,s.qx[r])*s.cellSize,dt,false);}
 for(let x=0;x<w;x++){const top=x,bottom=(h-1)*w+x;if(s.openBoundary.top)exit(top,Math.max(0,-s.qy[top])*s.cellSize,dt,false);if(s.openBoundary.bottom)exit(bottom,Math.max(0,s.qy[bottom])*s.cellSize,dt,false);}
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
 for(let i=0;i<n;i++){marker[i]+=change[i];const bound=Math.max(0,-marker[i],marker[i]-s.h[i]*area);maxBound=Math.max(maxBound,bound);if(bound>1e-7)throw Error(`Markierung außerhalb Wasserbilanz ${i}: ${bound}`);
  if(ordered){let sum=0;for(let k=0;k<stages.length;k++){stages[k][i]+=stageChanges[k][i];if(stages[k][i]<-1e-7)throw Error(`Negative Pfadmarkierung ${i}`);sum+=stages[k][i];}maxStageDifference=Math.max(maxStageDifference,Math.abs(sum-marker[i]));}
 }
}
const remaining=marker.reduce((a,b)=>a+b,0);
const remainingStages=stages.map(stage=>stage.reduce((a,b)=>a+b,0));
console.log(JSON.stringify({scenario:scenario.version,mode,time:s.time,budget:game.budget,...game.totals(),tagged,west,other,remaining,balanceError:west+other+remaining-tagged,maxBound,crossings,ordered:ordered?{tagged:orderedTagged,westAfterFourSections:orderedWest,otherExit:orderedOther,remainingStages,balanceError:orderedWest+orderedOther+remainingStages.reduce((a,b)=>a+b,0)-orderedTagged,maxStageDifference}:null,waterBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
