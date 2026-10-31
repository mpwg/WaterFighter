import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('V4 official map', () => {
  it('covers the verified named junction with a complete metric terrain raster and official footprints', () => {
    const map = JSON.parse(readFileSync('public/v4/map.json', 'utf8'));
    expect(map.schema).toBe('waterfighter-map/4');
    expect(map.width).toBe(256);
    expect(map.cellSize).toBe(2);
    expect(map.crs).toBe('EPSG:31256');
    expect(map.bounds).toEqual([5042.3438, 342463.8906, 5554.3438, 342975.8906]);
    expect(map.heights.length).toBe(65536);
    expect(map.heights.every((v: number) => Number.isFinite(v) && v > -10 && v < 100)).toBe(true);
    expect(map.buildings.length).toBeGreaterThan(30);
    expect(map.roads.some((r: { name: string }) => r.name === 'Vorgartenstraße')).toBe(true);
    expect(map.roads.some((r: { name: string }) => r.name === 'Ennsgasse')).toBe(true);
    expect(map.provenance.sources.every((s: { sha256: string }) => /^[a-f0-9]{64}$/.test(s.sha256))).toBe(true);
    const occupied = new Set<number>(map.buildings.flatMap((b: { cells: number[] }) => b.cells));
    for (const segment of map.barrierSegments) {
      expect(segment.faces.length).toBeGreaterThan(1);
      for (const [a, b] of segment.faces) {
        expect([1, 256]).toContain(b - a);
        expect(occupied.has(a) || occupied.has(b)).toBe(false);
      }
    }
  });
});

import { createSimulation, stepSimulation, simulationAudit, setBarrier, demolishBuilding } from '../src/v4/simulation';
import { createGame, commandGame, advanceGame, snapshotGame, demolitionCost } from '../src/v4/game';
import type { V4Map } from '../src/v4/types';
function tiny(heights = [0, 0, 0], buildings: V4Map['buildings'] = []): V4Map {
  return { schema: 'waterfighter-map/4', width: heights.length, height: 1, cellSize: 2, crs: 'EPSG:31256', bounds: [0, 0, heights.length * 2, 2], heights, buildings, roads: [], barrierSegments: [{ id: 'b', road: 'test', faces: [[0, 1]], points: [[2, 0], [2, 2]], center: [2, 1], crestHeight: 1 }], sourceCells: [], provenance: { imported: '', attribution: '', license: '', sources: [], terrain: '', fiction: '' } };
}
const house = { id: 'house', name: 'House', cells: [1], polygons: [[[2, 0], [4, 0], [4, 2], [2, 2], [2, 0]]] as [number,number][][], geometry: { type: 'Polygon' as const, coordinates: [[[2, 0], [4, 0], [4, 2], [2, 2], [2, 0]]] }, center: [3, 1] as [number,number], area: 4, value: 1000, zone: 'protected' as const };
describe('V4 conservative flow', () => {
  it('preserves still water on varying terrain and sends a pulse downslope without creating mass', () => {
    const still = createSimulation(tiny([0, .5, 1]), { boundary: 'closed', flood: false });
    still.depths.set([2, 1.5, 1]);
    for (let i = 0; i < 100; i++) stepSimulation(still, .025, 0);
    expect([...still.depths]).toEqual([2, 1.5, 1]);
    const slope = createSimulation(tiny([1, .5, 0]), { boundary: 'closed', flood: false });
    slope.depths[0] = 1;
    for (let i = 0; i < 100; i++) stepSimulation(slope, .025, 0);
    expect(slope.depths[2]).toBeGreaterThan(0);
    expect([...slope.depths].every(x => x >= 0 && Number.isFinite(x))).toBe(true);
    expect(simulationAudit(slope).volume).toBeCloseTo(4, 8);
  });
  it('routes around a finite barrier, overtops it and reopens after removal', () => {
    const blocked = createSimulation(tiny([0, 0]), { boundary: 'closed', flood: false });
    blocked.depths[0] = .8; setBarrier(blocked, 'b', true);
    for (let i = 0; i < 20; i++) stepSimulation(blocked, .025, 0);
    expect(blocked.depths[1]).toBe(0);
    blocked.depths[0] = 2;
    for (let i = 0; i < 20; i++) stepSimulation(blocked, .025, 0);
    expect(blocked.depths[1]).toBeGreaterThan(0);
    expect(simulationAudit(blocked).volume).toBeCloseTo(8, 8);
    const released = createSimulation(tiny([0, 0]), { boundary: 'closed', flood: false });
    released.depths[0] = .8; setBarrier(released, 'b', true);
    stepSimulation(released, .025, 0);setBarrier(released, 'b', false);
    for(let i=0;i<40;i++)stepSimulation(released,.025,0);
    expect(released.depths[1]).toBeGreaterThan(.1);
  });
  it('opens the exact building cells without deleting or creating water', () => {
    const sim = createSimulation(tiny([0, 0, 0], [house]), { boundary: 'closed', flood: false });
    sim.depths[0] = 1;
    for (let i = 0; i < 10; i++) stepSimulation(sim, .025, 0);
    expect(sim.depths[2]).toBe(0);
    const before = simulationAudit(sim).volume;
    demolishBuilding(sim, 'house');
    expect(simulationAudit(sim).volume).toBe(before);
    for (let i = 0; i < 30; i++) stepSimulation(sim, .025, 0);
    expect(sim.depths[2]).toBeGreaterThan(.01);
    expect(simulationAudit(sim).volume).toBeCloseTo(before, 8);
  });
});
describe('V4 game authority', () => {
  it('locks phases, charges demolition even after full flooding, rejects repeats and resets', () => {
    const game = createGame(tiny([0, 0, 0], [house]));
    expect(commandGame(game, { type: 'demolish', buildingId: 'house' }).ok).toBe(false);
    commandGame(game, { type: 'start' });
    game.buildingDamage[0] = house.value;
    const before = snapshotGame(game).points;
    expect(demolitionCost(game, 'house')).toBeGreaterThan(0);
    expect(commandGame(game, { type: 'demolish', buildingId: 'house' }).ok).toBe(true);
    expect(snapshotGame(game).points).toBeLessThan(before);
    expect(commandGame(game, { type: 'demolish', buildingId: 'house' }).ok).toBe(false);
    commandGame(game, { type: 'pause' }); advanceGame(game, 20);
    expect(snapshotGame(game).time).toBe(0);
    expect(commandGame(game, { type: 'placeBarrier', segmentId: 'b' }).ok).toBe(false);
    commandGame(game, { type: 'reset' });
    expect(snapshotGame(game).demolitionCharges).toBe(2);
    expect(snapshotGame(game).points).toBe(100000);
    expect(snapshotGame(game).phase).toBe('ready');
  });
  it('recharges at fixed running time, caps charges, ends at90s and replays deterministically', () => {
    const map = tiny();const game = createGame(map);
    commandGame(game, { type: 'start' });commandGame(game, { type: 'placeBarrier', segmentId: 'b' });
    expect(snapshotGame(game).barrierCharges).toBe(2);
    advanceGame(game, 15);expect(snapshotGame(game).barrierCharges).toBe(3);
    advanceGame(game, 75);expect(snapshotGame(game).phase).toBe('finished');
    expect(snapshotGame(game).time).toBe(90);
    expect(commandGame(game, { type: 'demolish', buildingId: 'house' }).ok).toBe(false);
    const a=createGame(map),b=createGame(map);commandGame(a,{type:'start'});commandGame(b,{type:'start'});
    advanceGame(a, 10);for(let i=0;i<100;i++)advanceGame(b,.1);
    expect(snapshotGame(a)).toEqual(snapshotGame(b));
  });
});

describe('V4 integrated guarantees', () => {
  it('conserves boundary flux and remains finite during a complete official90-second flood', () => {
    const map=JSON.parse(readFileSync('public/v4/map.json','utf8')) as V4Map;
    const game=createGame(map);commandGame(game,{type:'start'});advanceGame(game,90);
    const state=snapshotGame(game);
    expect(state.phase).toBe('finished');expect(state.time).toBe(90);
    expect(state.audit.inflow).toBeGreaterThan(1000);expect(state.audit.outflow).toBeGreaterThan(0);
    expect(Math.abs(state.audit.balanceError)).toBeLessThan(1e-5);
    expect([...state.depths].every(d=>Number.isFinite(d)&&d>=0)).toBe(true);
    expect(Math.max(...state.depths)).toBeLessThan(10);
    expect(state.floodDamage).toBeGreaterThan(0);
    const before=state.points;advanceGame(game,100);expect(snapshotGame(game).points).toBe(before);
  },20000);
  it('a barrier diverts a pulse through the remaining shared faces of a2D grid', () => {
    const map=tiny([0,0,0,0]);map.width=2;map.height=2;
    const sim=createSimulation(map,{boundary:'closed',flood:false});sim.depths[0]=.5;setBarrier(sim,'b',true);
    stepSimulation(sim,.025,0);
    expect(sim.depths[1]).toBe(0);expect(sim.depths[2]).toBeGreaterThan(0);
    for(let i=0;i<80;i++)stepSimulation(sim,.025,0);
    expect(sim.depths[3]).toBeGreaterThan(0);expect(simulationAudit(sim).volume).toBeCloseTo(2,8);
  });
  it('demolition recharges once at45s and pauses cannot spend or recharge it', () => {
    const map=tiny([0,0,0],[house]),game=createGame(map);commandGame(game,{type:'start'});
    commandGame(game,{type:'demolish',buildingId:'house'});expect(snapshotGame(game).demolitionCharges).toBe(1);
    advanceGame(game,44.975);expect(snapshotGame(game).demolitionCharges).toBe(1);
    commandGame(game,{type:'pause'});advanceGame(game,50);expect(snapshotGame(game).demolitionCharges).toBe(1);
    commandGame(game,{type:'resume'});advanceGame(game,.025);expect(snapshotGame(game).demolitionCharges).toBe(2);
    advanceGame(game,45);expect(snapshotGame(game).demolitionCharges).toBe(2);
  });
  it('draws exactly one grid-edge for every barrier face without phantom extensions',()=>{
    const map=JSON.parse(readFileSync('public/v4/map.json','utf8')) as V4Map;
    for(const segment of map.barrierSegments){
      expect(segment.points.length).toBe(segment.faces.length+1);
      segment.faces.forEach(([a,b],i)=>{
        const p=segment.points[i],q=segment.points[i+1];
        expect(Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])).toBe(2);
        if(b-a===1){expect(p[0]).toBe(q[0]);expect(p[0]).toBe((b%map.width)*2);}
        else {expect(p[1]).toBe(q[1]);expect(p[1]).toBe(Math.floor(b/map.width)*2);}
      });
    }
  });
});
