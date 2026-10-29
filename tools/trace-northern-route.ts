/** Mark water entering the eastern route and track ordered westward route crossings. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2];if(mode!=='control'&&mode!=='trench')throw Error('Aufruf: control | trench');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!==fixture.scenario||!scenario.parameters.outflowEdges.includes('left'))throw Error('Szenario passt nicht');
const game=new Game(scenario),s=game.solver,w=s.width,h=s.height,n=w*h,area=s.cellSize**2,initial=s.volume();
const damsArg=process.argv.find(a=>a.startsWith('--dams='));
const damsRaw=damsArg?damsArg.slice(7):'3';
if(!/^[0-3]$/.test(damsRaw))throw Error('--dams muss 0, 1, 2 oder 3 sein');
const dams=Number(damsRaw);
const tipArg=process.argv.find(a=>a.startsWith('--tip='));
const tipRaw=tipArg?tipArg.slice(6):'0';
if(!/^(?:-[1-4]|[0-4])$/.test(tipRaw)||(dams<2&&tipRaw!=='0'))throw Error('--tip erfordert mindestens zwei Dämme und einen ganzzahligen Versatz von −4 bis 4');
const tip=Number(tipRaw);
const partialArg=process.argv.find(a=>a.startsWith('--partial='));
const partialRaw=partialArg?partialArg.slice(10):null;
if(partialRaw!==null&&(!/^(?:[1-9]|10)$/.test(partialRaw)||dams!==2||tip!==0))throw Error('--partial erfordert zwei Dämme und eine Länge von 1 bis 10');
const partial=partialRaw===null?null:Number(partialRaw);
const guardArg=process.argv.find(a=>a.startsWith('--guard-radius='));
const guardRaw=guardArg?guardArg.slice(15):null;
if(guardRaw!==null&&(!/^[0-5]$/.test(guardRaw)||partial===null))throw Error('--guard-radius erfordert --partial und einen Radius von 0 bis 5');
const guard=guardRaw===null?null:Number(guardRaw);
const atArg=process.argv.find(a=>a.startsWith('--at='));
const atRaw=atArg?atArg.slice(5):'0';
if(!/^\d+(?:\.\d+)?$/.test(atRaw)||Number(atRaw)>=scenario.parameters.duration)throw Error('Ungültiger Eingriffszeitpunkt');
const at=Number(atRaw);
for(const [i,segment] of fixture.segments.slice(0,dams).entries()){
 const end:[number,number]=i===1&&partial!==null?[26+partial,10+partial]:[segment[1][0]+(i===1?tip:0),segment[1][1]];
 const r=game.apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],end,w)});if(!r.ok)throw Error(r.reason);
}
if(guard!==null){const result=game.apply('guard',{kind:'dam',faces:damPath([43-guard,28],[44+guard,28],w)});if(!result.ok)throw Error(result.reason);}
const routeArg=process.argv.find(a=>a.startsWith('--route='));
const rawCoordinates=routeArg?routeArg.slice(8).split(','):['0','3','38','11'];
const coordinates=rawCoordinates.map(Number);
if(rawCoordinates.some(v=>!/^\d+$/.test(v))||coordinates.length!==4||coordinates.some((v,i)=>!Number.isInteger(v)||v<0||v>=(i%2===0?w:h))||coordinates[0]!==0||coordinates[2]<5)throw Error('Route: --route=0,Y0,X1,Y1');
const cells=trenchPath([coordinates[0],coordinates[1]],[coordinates[2],coordinates[3]],w),route=new Set(cells);
let actionTime:number|null=null;
function dig(){const result=game.apply('trench',{kind:'trench',cells});if(!result.ok)throw Error(result.reason);actionTime=s.time;}
if(mode==='trench'&&at===0)dig();
const entryArg=process.argv.find(a=>a.startsWith('--entry='));
const parts=entryArg?entryArg.slice(8).split(','):[String(Math.min(30,coordinates[2])),String(coordinates[2])];
if(parts.length!==2||parts.some(v=>!/^\d+$/.test(v)))throw Error('Eintrittsbereich: --entry=MIN,MAX');
const [entryMin,entryMax]=parts.map(Number);
if(entryMin>entryMax||entryMin<5||entryMax>coordinates[2])throw Error('Eintrittsbereich muss zwischen 5 und dem östlichen Endpunkt liegen');
const sectionsArg=process.argv.find(a=>a.startsWith('--sections='));
const rawSections=sectionsArg?sectionsArg.slice(11).split(','):null;
if(rawSections&&(!rawSections.length||rawSections.some(v=>!/^\d+$/.test(v))))throw Error('Ungültige Querschnitte');
const sections=rawSections?rawSections.map(Number):[30,20,10,5].filter(x=>x<=entryMin);
if(!sections.length||sections.some((x,i)=>x<1||x>entryMin||(i>0&&x>=sections[i-1])||!cells.some(c=>c%w===x&&route.has(c-1))))throw Error('Querschnitte müssen absteigend und auf der Trasse liegen');
const stages=Array.from({length:sections.length+1},()=>new Float64Array(n)),changes=stages.map(()=>new Float64Array(n));
const stayOnRoute=process.argv.includes('--stay-on-route');
let tagged=0,returned=0,leftRoute=0,otherExit=0,orderedWest=0,maxBound=0;
const seedRequested=process.argv.includes('--seed-at');
let seeded=0,seedDone=!seedRequested;
function seed(){
 for(const i of cells)if(i%w>=entryMin&&i%w<=entryMax&&!scenario.waterMask[i]){const volume=s.h[i]*area;stages[0][i]+=volume;seeded+=volume;}
 tagged+=seeded;seedDone=true;
}
if(seedRequested&&at===0)seed();
const westExitRows=new Map<number,number>();
function flux(a:number,b:number,axis:'x'|'y',crest:number){
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return 0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
function transfer(a:number,b:number,rate:number,dt:number,section:number|null){
 if(rate===0)return;const donor=rate>0?a:b,receiver=rate>0?b:a,volume=Math.abs(rate)*dt,cellVolume=s.h[donor]*area;
 let total=0;
 for(let k=0;k<stages.length;k++){
  const fraction=cellVolume>1e-10?stages[k][donor]/cellVolume:0;total+=fraction;
  const moved=volume*fraction,next=section!==null&&rate<0&&route.has(a)&&route.has(b)&&k<sections.length&&section===sections[k]?k+1:k;
  changes[k][donor]-=moved;
  if(scenario.waterMask[receiver])returned+=moved;else if(stayOnRoute&&!route.has(receiver))leftRoute+=moved;else changes[next][receiver]+=moved;
 }
 // Mark previously unmarked inflow into the specified route section from non-route cells.
 if(s.time>=at-1e-9&&!route.has(donor)&&route.has(receiver)&&receiver%w>=entryMin&&receiver%w<=entryMax&&!scenario.waterMask[receiver]){
  const fresh=volume*Math.max(0,1-total);changes[0][receiver]+=fresh;tagged+=fresh;
 }
}
function exit(cell:number,rate:number,dt:number,west:boolean){
 if(rate<=0)return;const volume=s.h[cell]*area;
 for(let k=0;k<stages.length;k++){const moved=volume>1e-10?rate*dt*stages[k][cell]/volume:0;changes[k][cell]-=moved;if(west&&k===sections.length){orderedWest+=moved;if(moved>0){const row=Math.floor(cell/w);westExitRows.set(row,(westExitRows.get(row)??0)+moved);}}else otherExit+=moved;}
}
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t,t<at-1e-9?at-t:Infinity),dt=s.stableStep(maxDt);for(const c of changes)c.fill(0);
 for(let y=0;y<h;y++)for(let x=1;x<w;x++){const a=y*w+x-1,b=a+1;transfer(a,b,flux(a,b,'x',s.crestX[y*(w+1)+x]),dt,x);}
 for(let y=1;y<h;y++)for(let x=0;x<w;x++){const b=y*w+x,a=b-w;transfer(a,b,flux(a,b,'y',s.crestY[y*w+x]),dt,null);}
 for(let y=0;y<h;y++){const l=y*w,r=l+w-1;if(s.openBoundary.left)exit(l,Math.max(0,-s.qx[l])*s.cellSize,dt,true);if(s.openBoundary.right)exit(r,Math.max(0,s.qx[r])*s.cellSize,dt,false);}
 for(let x=0;x<w;x++){const top=x,bottom=(h-1)*w+x;if(s.openBoundary.top)exit(top,Math.max(0,-s.qy[top])*s.cellSize,dt,false);if(s.openBoundary.bottom)exit(bottom,Math.max(0,s.qy[bottom])*s.cellSize,dt,false);}
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
 if(mode==='trench'&&actionTime===null&&s.time>=at-1e-9)dig();
 for(let i=0;i<n;i++){let total=0;for(let k=0;k<stages.length;k++){stages[k][i]+=changes[k][i];total+=stages[k][i];maxBound=Math.max(maxBound,-stages[k][i]);}maxBound=Math.max(maxBound,total-s.h[i]*area);if(stayOnRoute&&!route.has(i)&&total>1e-7)throw Error(`Markierung außerhalb der Trasse ${i}: ${total}`);if(maxBound>1e-7)throw Error(`Markierung außerhalb Wasserbilanz ${i}: ${maxBound}`);}
 if(!seedDone&&s.time>=at-1e-9)seed();
}
const remaining=stages.map(stage=>stage.reduce((a,b)=>a+b,0));
console.log(JSON.stringify({scenario:scenario.version,mode,dams,tip,partial,guard,at,actionTime,stayOnRoute,route:coordinates,entry:[entryMin,entryMax],sections,seedRequested,seeded,tagged,orderedWest,westExitRows:[...westExitRows].sort((a,b)=>a[0]-b[0]),returned,leftRoute,otherExit,remaining,balanceError:orderedWest+returned+leftRoute+otherExit+remaining.reduce((a,b)=>a+b,0)-tagged,maxBound,budget:game.budget,...game.totals(),waterBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
