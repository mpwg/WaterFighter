/** Screen connected land cells in simultaneous numerical snapshots. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const candidate=process.argv.includes('--candidate');
if(candidate){
 if(scenario.version!=='1.2-draft')throw Error('Kandidatenvergleich benötigt den historischen Szenarioentwurf 1.2');
 scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*0.75]);
 scenario.parameters.inflowCells=Array.from({length:scenario.grid.width},(_,x)=>x).filter(x=>x<150&&scenario.waterMask[x]===1);
}
const game=new Game(scenario),s=game.solver,w=s.width,h=s.height,threshold=0.05;
function adjacent(i:number):[number,number][] {
 const x=i%w,y=Math.floor(i/w),out:[number,number][]=[];
 if(x>0)out.push([i-1,s.crestX[y*(w+1)+x]]);
 if(x<w-1)out.push([i+1,s.crestX[y*(w+1)+x+1]]);
 if(y>0)out.push([i-w,s.crestY[y*w+x]]);
 if(y<h-1)out.push([i+w,s.crestY[(y+1)*w+x]]);
 return out;
}
function pass(i:number,j:number,crest:number):boolean {
 return s.h[i]>threshold && s.h[j]>threshold && Math.max(s.bed[i]+s.h[i],s.bed[j]+s.h[j])>crest;
}
function inspect() {
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),components=[];
 for(let origin=0;origin<w*h;origin++) {
  if(seen[origin]||scenario.waterMask[origin]||s.h[origin]<=threshold)continue;
  let first=0,last=0,shore=0,x0=w,y0=h,x1=0,y1=0,maxDepth=0;
  queue[last++]=origin;seen[origin]=1;
  while(first<last){const i=queue[first++],x=i%w,y=Math.floor(i/w);
   x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);maxDepth=Math.max(maxDepth,s.h[i]);
   for(const [j,crest] of adjacent(i)) if(pass(i,j,crest)) {
    if(scenario.waterMask[j])shore++;
    else if(!seen[j]){seen[j]=1;queue[last++]=j;}
   }
  }
  if(shore && last>=10)components.push({cells:last,shoreFaces:shore,bounds:[x0,y0,x1,y1],maxDepth});
 }
 components.sort((a,b)=>b.cells-a.cells);
 return {time:s.time,components:components.slice(0,10),count:components.length};
}
const samples=[];for(const target of [80,120,160,200,240,300]){
 while(s.time<target-1e-9){const t=s.time,dt=s.step(Math.min(1,target-t));game.addInflow(t,dt);game.updateDamage(dt);}
 samples.push(inspect());
}
console.log(JSON.stringify({version:scenario.version,candidate,threshold,samples},null,2));
