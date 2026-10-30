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

import {createPointerTrack} from '../src/scene/input';
describe('scene pointer termination',()=>{
 const event=(pointerId:number)=>({pointerId} as PointerEvent);
 it('delivers off-terrain release using last valid pick, exactly once',()=>{
 const calls:unknown[]=[];const track=createPointerTrack((phase,pick)=>calls.push([phase,pick]));
 track('down',event(1),{x:1});track('move',event(1),{x:2});track('up',event(1));track('cancel',event(1));
 expect(calls).toEqual([['down',{x:1}],['move',{x:2}],['up',{x:2}]]);
 });
 it('cancels on capture loss and ignores unrelated pointers or unstarted gestures',()=>{
 const calls:unknown[]=[];const track=createPointerTrack((phase,pick)=>calls.push([phase,pick]));
 track('up',event(1));track('down',event(1),4);track('up',event(2),8);track('cancel',event(1));track('up',event(1));
 expect(calls).toEqual([['down',4],['cancel',4]]);
 });
});
import {previewGeometry} from '../src/scene/geometry';
it('tessellates a long preview over levees and current floodwater',()=>{
 const t=createTerrain(8,8);t.heights.fill(0);t.heights[3*8+4]=1.55;const d=new Float32Array(64);d[3*8+5]=2;
 const path=previewGeometry(t,[{x:1,y:3.5},{x:7,y:3.5}],d);
 expect(path.length).toBe(25);expect(path.find(p=>p.x===9)?.y).toBeCloseTo(1.9);expect(path.find(p=>p.x===11)?.y).toBeCloseTo(2.35);
});
