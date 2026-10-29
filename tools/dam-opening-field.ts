/** Export synthetic numerical dam-opening states; this is not the Vienna scenario. */
import { writeFileSync } from 'node:fs';
import { ShallowWaterSolver } from '../src/simulation/solver';
const w=30,h=21,mid=15,cell=4,depth=Array.from({length:w*h},(_,i)=>i%w<mid?2:0);
const s=new ShallowWaterSolver(w,h,cell,Array(w*h).fill(0),depth),initial=s.volume(),states=[];
for(let y=0;y<h;y++)if(y!==10)s.crestX[y*(w+1)+mid]=10;
for(const time of [0,2,4,6]) {
  s.advance(time-s.time);
  states.push({time:s.time,depth:[...s.h],qx:[...s.qx],qy:[...s.qy],relativeBalance:Math.abs(s.volume()-initial)/initial});
}
writeFileSync('/tmp/waterfighter-dam-opening.json',JSON.stringify({width:w,height:h,cellSize:cell,states})+'\n');
console.log(JSON.stringify({times:states.map(x=>x.time),steps:s.steps,balance:states.map(x=>x.relativeBalance)}));
