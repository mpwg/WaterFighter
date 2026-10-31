import {expect,it} from 'vitest';
import {createTerrain} from '../src/flood/terrain';
it('has a broad winding channel, explicit curved streets and varied village parcels',()=>{
 const t=createTerrain();expect(t.riverCenterline).toHaveLength(t.width);
 const ys=t.riverCenterline!.map(p=>p.y);expect(Math.max(...ys)-Math.min(...ys)).toBeGreaterThan(t.height*.22);
 expect(t.roads!.some(Boolean)).toBe(true);expect(t.buildings.length).toBeGreaterThan(20);
 expect(new Set(t.buildings.map(b=>`${b.width}:${b.height}`)).size).toBeGreaterThan(4);
 expect(new Set(t.buildings.map(b=>b.y)).size).toBeGreaterThan(t.buildings.length*.5);
 for(const b of t.buildings)for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++){expect(t.river[y*t.width+x]).toBe(0);expect(t.roads![y*t.width+x]).toBe(0);expect(t.obstacles[y*t.width+x]).toBe(1);}
 expect(Math.max(...t.heights)).toBeGreaterThan(4);
});
