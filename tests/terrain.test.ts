import {expect,it} from 'vitest';
import {createTerrain} from '../src/flood/terrain';
import {edgeKey} from '../src/flood/simulation';
it('has a broad winding channel, explicit curved streets and varied village parcels',()=>{
 const t=createTerrain();expect(t.riverCenterline).toHaveLength(t.width);
 const ys=t.riverCenterline!.map(p=>p.y);expect(Math.max(...ys)-Math.min(...ys)).toBeGreaterThan(t.height*.22);
 expect(t.roads!.some(Boolean)).toBe(true);expect(t.buildings.length).toBeGreaterThan(20);
 expect(new Set(t.buildings.map(b=>`${b.width}:${b.height}`)).size).toBeGreaterThan(4);
 expect(new Set(t.buildings.map(b=>b.y)).size).toBeGreaterThan(t.buildings.length*.5);
 for(const b of t.buildings)for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++){expect(t.river[y*t.width+x]).toBe(0);expect(t.roads![y*t.width+x]).toBe(0);expect(t.obstacles[y*t.width+x]).toBe(1);}
 expect(Math.max(...t.heights)).toBeGreaterThan(4);
});
it('spans the entire excavated channel on a tall narrow map',()=>{
 const t=createTerrain(64,192),g=t.gates[0];
 for(const e of g.edges!){expect(t.heights[e.a]).toBe(.25);expect(t.heights[e.b]).toBe(.25);}
 // At the horizontal control section, both shoulders must be intact.
 for(const x of [g.x-4,g.x+4])for(const y of [g.y,g.y+1])expect(t.heights[y*t.width+x]).toBe(2.35);
 for(let x=g.x-3;x<=g.x+3;x++)expect(t.river[(g.y+1)*t.width+x]).toBe(0);
 const reachable=(closed:boolean)=>{
   const blocked=new Set(closed?g.edges!.map(e=>edgeKey(e.a,e.b)):[]),seen=new Set<number>(),queue:number[]=[];
   for(let i=0;i<t.river.length;i++)if(t.river[i]&&t.heights[i]<2){seen.add(i);queue.push(i);}
   for(let cursor=0;cursor<queue.length;cursor++){
     const a=queue[cursor],x=a%t.width,y=Math.floor(a/t.width);
     for(const b of [x>0?a-1:-1,x<t.width-1?a+1:-1,y>0?a-t.width:-1,y<t.height-1?a+t.width:-1]){
       if(b<0||seen.has(b)||t.obstacles[b]||t.heights[b]>=2||blocked.has(edgeKey(a,b)))continue;
       seen.add(b);queue.push(b);
     }
   }
   return seen.has(g.b);
 };
 expect(reachable(false)).toBe(true);expect(reachable(true)).toBe(false);
});
