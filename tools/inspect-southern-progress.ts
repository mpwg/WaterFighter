/** Inspect the water front and elevations along a previously generated land corridor. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';

const mode=process.argv[2];
if(mode!=='baseline'&&mode!=='trench')throw Error('Aufruf: baseline|trench PFADDATEI');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const route=JSON.parse(readFileSync(process.argv[3]??'','utf8')) as {scenario:string;path:number[][]};
const {width:w,height:h,cellSize}=scenario.grid;
if(route.scenario!==scenario.version||!Array.isArray(route.path)||route.path.length<2||route.path.some((p,i)=>!Array.isArray(p)||p.length!==2||p.some((v,k)=>!Number.isInteger(v)||v<0||v>=(k===0?w:h))||(i>0&&Math.abs(p[0]-route.path[i-1][0])+Math.abs(p[1]-route.path[i-1][1])!==1)))throw Error('Ungültiger Szenariokorridor');
const game=new Game(scenario),s=game.solver,initial=s.volume();
if(mode==='trench') {
 let start=0,segment=0;
 while(start<route.path.length){let end=start;if(start+1<route.path.length){const dx=route.path[start+1][0]-route.path[start][0],dy=route.path[start+1][1]-route.path[start][1];end++;while(end+1<route.path.length&&route.path[end+1][0]-route.path[end][0]===dx&&route.path[end+1][1]-route.path[end][1]===dy)end++;}
  const cells=route.path.slice(start,end+1).map(([x,y])=>y*w+x),result=game.apply(`segment-${segment++}`,{kind:'trench',cells});if(!result.ok)throw Error(result.reason);start=end+1;
 }
}
const indices=route.path.map(([x,y])=>y*w+x),samples=[];
// The signed flux is reconstructed from the same pre-step state as the solver.
// Its time integral is per face; it does not follow individual water parcels.
const forward=new Float64Array(indices.length-1),backward=new Float64Array(indices.length-1);
let bottomExit=0;
function routeFlux(k:number):number {
 const [x0,y0]=route.path[k],[x1,y1]=route.path[k+1],horizontal=y0===y1;
 const sign=horizontal?Math.sign(x1-x0):Math.sign(y1-y0),a=sign>0?indices[k]:indices[k+1],b=sign>0?indices[k+1]:indices[k];
 const crest=horizontal?s.crestX[y0*(w+1)+Math.max(x0,x1)]:s.crestY[Math.max(y0,y1)*w+x0],q=horizontal?s.qx:s.qy;
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z);
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return sign*0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*cellSize;
}
for(const target of [60,120,180,240,300]) {
 while(s.time<target-1e-9){const t=s.time,maxDt=Math.min(1,target-t),dt=s.stableStep(maxDt);for(let k=0;k<forward.length;k++){const volume=routeFlux(k)*dt;forward[k]+=Math.max(0,volume);backward[k]+=Math.max(0,-volume);}const last=indices[indices.length-1];if(Math.floor(last/w)===s.height-1&&s.openBoundary.bottom)bottomExit+=Math.max(0,s.qy[last])*cellSize*dt;if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);}
 const h=indices.map(i=>s.h[i]);let prefix=0;while(prefix<h.length&&h[prefix]>0.02)prefix++;
 const firstDry=prefix<h.length?{index:prefix,cell:route.path[prefix],depth:h[prefix],bed:s.bed[indices[prefix]]}:null;
 samples.push({time:s.time,wetCells:h.filter(v=>v>0.02).length,contiguousWetPrefix:prefix,prefixMetres:prefix*cellSize,firstDry,maxDepth:Math.max(...h)});
}
const edges=Array.from(forward,(value,k)=>({from:route.path[k],to:route.path[k+1],forwardM3:value,backwardM3:backward[k]}));
const bottlenecks=[...edges].sort((a,b)=>a.forwardM3-b.forwardM3).slice(0,5);
console.log(JSON.stringify({scenario:scenario.version,mode,bottomExitM3:bottomExit,bottlenecks,pathCells:indices.length,budget:game.budget,...game.totals(),samples,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
