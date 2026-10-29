/** Directed instantaneous Rusanov-flux connectivity from inlets, not particle tracking. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),s=game.solver,w=s.width,h=s.height,target=180,threshold=0.01;
const bank=process.argv.includes('--bank');
const probeArg=process.argv.find(x=>x.startsWith('--probe='));
const probe=probeArg?Number(probeArg.slice(8)):null;
if(probe!==null){
 if(!Number.isInteger(probe)||probe<0||probe>1)throw Error('Probe muss 0 oder 1 sein');
 const ref=JSON.parse(readFileSync('/tmp/waterfighter-directed-paths.json','utf8'));if(ref.version!==scenario.version)throw Error('Referenzversion stimmt nicht');
 const path:number[][]=ref.paths[probe].path;const first=path.findIndex(([x,y])=>!scenario.waterMask[y*w+x]);
 if(first<1)throw Error('Keine Gewässer-Land-Kante');
 const [ax,ay]=path[first-1],[bx,by]=path[first];
 const face=ax===bx?{axis:'y' as const,index:Math.max(ay,by)*w+ax}:{axis:'x' as const,index:ay*(w+1)+Math.max(ax,bx)};
 const result=game.apply(`probe-${probe}`,{kind:'dam',faces:[face]});if(!result.ok)throw Error(result.reason);
}
if(bank){const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');for(const [i,segment] of fixture.segments.entries()){const result=game.apply(`bank-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],w)});if(!result.ok)throw Error(result.reason);}}
while(s.time<target-1e-9){const t=s.time,dt=s.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);}
function flux(a:number,b:number,axis:'x'|'y',crest:number):number {
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest);
 const aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0;
 const ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 const wave=Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab));
 return 0.5*(na+nb-wave*(ab-aa))*s.cellSize;
}
function neighbours(i:number):[number,number][] {
 const x=i%w,y=Math.floor(i/w),out:[number,number][]=[];
 if(x>0)out.push([i-1,-flux(i-1,i,'x',s.crestX[y*(w+1)+x])]);
 if(x<w-1)out.push([i+1,flux(i,i+1,'x',s.crestX[y*(w+1)+x+1])]);
 if(y>0)out.push([i-w,-flux(i-w,i,'y',s.crestY[y*w+x])]);
 if(y<h-1)out.push([i+w,flux(i,i+w,'y',s.crestY[(y+1)*w+x])]);
 return out;
}
const parent=new Int32Array(w*h).fill(-2),dist=new Int32Array(w*h),edgeFlow=new Float64Array(w*h),queue=new Int32Array(w*h);let front=0,back=0;
for(const i of scenario.parameters.inflowCells){parent[i]=-1;queue[back++]=i;}
while(front<back){const i=queue[front++];for(const [j,q] of neighbours(i))if(parent[j]===-2&&q>threshold){parent[j]=i;dist[j]=dist[i]+1;edgeFlow[j]=q;queue[back++]=j;}}
const groups=[[0,49],[50,99]] as const;
const paths=groups.map(([y0,y1])=>{
 let best=-1;for(let y=y0;y<=y1;y++)for(let x=0;x<100;x++){const i=y*w+x;if(!scenario.waterMask[i]&&parent[i]!==-2&&(best<0||dist[i]>dist[best]))best=i;}
 if(best<0)return null;
 const path:number[]=[];let minFlow=Infinity;for(let i=best;i>=0;i=parent[i]){path.push(i);if(parent[i]>=0)minFlow=Math.min(minFlow,edgeFlow[i]);}path.reverse();
 return {rows:[y0,y1],cells:path.length,start:[path[0]%w,Math.floor(path[0]/w)],end:[best%w,Math.floor(best/w)],minFluxM3s:minFlow,path:path.map(i=>[i%w,Math.floor(i/w)])};
});
let reference=null;
if(bank||probe!==null||process.argv.includes('--reference')){const old=JSON.parse(readFileSync('/tmp/waterfighter-directed-paths.json','utf8'));if(old.version!==scenario.version)throw Error('Referenzversion stimmt nicht');reference=old.paths.map((p:{path:number[][]})=>{const ids=p.path.map(([x,y])=>y*w+x);let pass=0,minFlux=Infinity,landEntryFlux:number|null=null;for(let i=0;i<ids.length-1;i++){const edge=neighbours(ids[i]).find(([j])=>j===ids[i+1]);if(!edge)throw Error('Ungültiger Pfad');minFlux=Math.min(minFlux,edge[1]);if(scenario.waterMask[ids[i]]&&!scenario.waterMask[ids[i+1]]&&landEntryFlux===null)landEntryFlux=edge[1];if(edge[1]>threshold)pass++;}return {edges:ids.length-1,forwardEdges:pass,minFluxM3s:minFlux,landEntryFluxM3s:landEntryFlux};});}
console.log(JSON.stringify({version:scenario.version,bank,probe,budget:game.budget,time:s.time,thresholdM3s:threshold,reachableCells:back,paths,reference},null,2));
