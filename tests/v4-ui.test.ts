import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildingAt, barrierAt, barrierAllowed, mapPosition } from '../src/v4/protocol';
import { WorkerSession } from '../src/v4/worker';
import type { V4Map } from '../src/v4/types';
const map = JSON.parse(readFileSync('public/v4/map.json', 'utf8')) as V4Map;
describe('V4 pointer truth', () => {
  it('maps CSS pixels independently of backing DPR and rejects outside', () => {
    expect(mapPosition(350, 250, {left:100,top:0,width:500,height:500},512)).toEqual([256,256]);
    expect(mapPosition(99, 250, {left:100,top:0,width:500,height:500},512)).toBeNull();
  });
  it('picks authoritative occupied cells and leaves holes empty', () => {
    const b = map.buildings.find(b => b.cells.length > 20)!;
    const cell=b.cells[0];
    expect(buildingAt(map,[(cell%map.width+.5)*2,(Math.floor(cell/map.width)+.5)*2])?.id).toBe(b.id);
    const occupied=new Set(map.buildings.flatMap(b=>b.cells));
    const empty=Array.from({length:map.width*map.height},(_,i)=>i).find(i=>!occupied.has(i))!;
    expect(buildingAt(map,[(empty%map.width+.5)*2,(Math.floor(empty/map.width)+.5)*2])).toBeNull();
  });
  it('picks actual segment paths and prioritizes existing barriers', () => {
    const s=map.barrierSegments[14];
    expect(barrierAt(map,s.points[0],1,new Set([s.id]))?.id).toBe(s.id);
    expect(barrierAllowed(map,s.id,new Set([s.id]))).toBe(false);
    expect(barrierAt(map,[-10,-10],2,new Set())).toBeNull();
  });
});
describe('V4 Worker session clock', () => {
  it('rejects test advance in production and pauses huge clock gaps', () => {
    const session=new WorkerSession(map,false);
    session.command({type:'start'},100);
    expect(session.advanceForTest(15).ok).toBe(false);
    session.tick(150);expect(session.snapshot().time).toBe(.05);
    session.tick(1200);expect(session.snapshot().phase).toBe('paused');
    expect(session.snapshot().time).toBe(.05);
    session.command({type:'resume'},5000);session.tick(5050);
    expect(session.snapshot().time).toBe(.1);
  });
  it('keeps test mode deterministic, hidden pause manual and reset fresh', () => {
    const session=new WorkerSession(map,true);
    session.command({type:'start'},0);session.tick(1000);
    expect(session.snapshot().time).toBe(0);
    session.advanceForTest(15);expect(session.snapshot().time).toBe(15);
    session.hidden();expect(session.snapshot().phase).toBe('paused');
    session.advanceForTest(10);expect(session.snapshot().time).toBe(15);
    session.command({type:'reset'},1000);expect(session.snapshot().phase).toBe('ready');
    expect(session.snapshot().time).toBe(0);
  });
});
