import {describe,it,expect} from 'vitest';
import {createTerrain} from '../src/flood/terrain';
import {cellGeometry,assertSnapshot} from '../src/scene/geometry';
import {createGame,snapshotGame} from '../src/flood/game';
describe('scene hydraulic geometry',()=>{
 it('uses exact cell floor and world scale with no dry water faces',()=>{
 const t=createTerrain(8,8),d=new Float32Array(64);d[3]=.5;
 const g=cellGeometry(t,d);expect(g.indices.length).toBe(6);expect(g.positions[0]).toBe(6);expect(g.positions[1]).toBeCloseTo(t.heights[3]+.512);expect(g.positions[3]).toBe(8);
 expect(cellGeometry(t,new Float32Array(64)).indices).toHaveLength(0);
 });
 it('does not render water through buildings and rejects mismatched snapshots',()=>{
 const t=createTerrain(8,8),d=new Float32Array(64);t.obstacles[0]=1;d[0]=1;expect(cellGeometry(t,d).indices).toHaveLength(0);
 const s=snapshotGame(createGame(t));expect(()=>assertSnapshot(t,s)).not.toThrow();expect(()=>assertSnapshot(t,{...s,width:9})).toThrow();
 });
});
