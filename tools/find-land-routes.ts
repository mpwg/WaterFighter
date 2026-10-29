/** Static reachability screening of two land corridors, not a flow simulation. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const {solver:s}=new Game(scenario),{width:w,height:h,cellSize}=scenario.grid;
const level=10; // metres Wiener Null, chosen before searching; not a measured flood level.
// A conservative screen: do not excavate either side of the selected sensitive faces.
const avoidSensitive=process.argv.includes('--avoid-sensitive')||process.argv.includes('--avoid-sensitive-all');
const excluded=new Set<number>();
if(avoidSensitive) {
 const sensitive=process.argv.includes('--avoid-sensitive-all')?[7072,7073,7269]:[7072,7073];
 if(scenario.version!=='1.4-draft'||w!==200||!sensitive.every(index=>scenario.surveyCrests.some(face=>face.axis==='x'&&face.index===index))) throw Error('Untersuchte Bruchkanten passen nicht zum Szenario');
 for(const face of sensitive) {
  const x=face%(w+1),y=Math.floor(face/(w+1));excluded.add(y*w+x-1);excluded.add(y*w+x);
 }
}
function neighbours(i:number):[number,number][] {
 const x=i%w,y=Math.floor(i/w),items:[number,number][]=[];
 if(x>0)items.push([i-1,s.crestX[y*(w+1)+x]]);
 if(x<w-1)items.push([i+1,s.crestX[y*(w+1)+x+1]]);
 if(y>0)items.push([i-w,s.crestY[y*w+x]]);
 if(y<h-1)items.push([i+w,s.crestY[(y+1)*w+x]]);
 return items;
}
function search(y0:number,y1:number) {
 const parents=new Int32Array(w*h).fill(-2),queue=new Int32Array(w*h);let head=0,tail=0;
 for(let y=y0;y<=y1;y++)for(let x=0;x<w;x++){
  const i=y*w+x;
  if(scenario.waterMask[i] || s.bed[i]>=level || excluded.has(i))continue;
  if(neighbours(i).some(([j,crest])=>scenario.waterMask[j] && s.bed[j]<level && crest<level)) {parents[i]=-1;queue[tail++]=i;}
 }
 let end=-1;
 while(head<tail) {
  const i=queue[head++],x=i%w,y=Math.floor(i/w);
  if(x===0){end=i;break;}
  for(const [j,crest] of neighbours(i)){
   const yy=Math.floor(j/w);
   if(yy<y0||yy>y1||parents[j]!==-2||scenario.waterMask[j]||s.bed[j]>=level||crest>=level||excluded.has(j))continue;
   parents[j]=i;queue[tail++]=j;
  }
 }
 if(end<0)return null;
 const path:number[]=[];for(let i=end;i>=0;i=parents[i])path.push(i);path.reverse();
 return {rows:[y0,y1],cells:path.length,lengthM:(path.length-1)*cellSize,start:[path[0]%w,Math.floor(path[0]/w)],end:[end%w,Math.floor(end/w)],path:path.map(i=>[i%w,Math.floor(i/w)])};
}
console.log(JSON.stringify({version:scenario.version,levelWienerNullM:level,avoidSensitive,routes:[search(20,70),search(120,170)]},null,2));
