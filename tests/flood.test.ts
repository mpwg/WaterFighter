import {
  describe, expect, it
} from 'vitest';
import {
  createTerrain
} from '../src/flood/terrain';
import {
  createSimulation, stepSimulation, waterVolume
} from '../src/flood/simulation';
import {
  createGame, commandGame, stepGame, snapshotGame
} from '../src/flood/game';
describe('flood core', () => {
  it('has deterministic shared terrain and playable houses', () => {
    const a=createTerrain(),b=createTerrain(); expect(a.width).toBe(256); expect(a.height).toBe(192); expect(a.heights).toEqual(b.heights); expect(a.buildings.length).toBeGreaterThan(10); expect(a.gates.length).toBeGreaterThan(0);
  });
  it('conserves closed volume and bounds donors on steep heads', () => {
    const t=createTerrain(8,8); t.heights.fill(0); t.obstacles.fill(0); const s=createSimulation(t); s.depths.fill(0); s.depths[27]=100; const v=waterVolume(s); for(let i=0;i<200;i++) stepSimulation(s,.1,false); expect(Math.min(...s.depths)).toBeGreaterThanOrEqual(0); expect(waterVolume(s)).toBeCloseTo(v,7);
  });
  it('accounts exactly for reproducible flood inflow and has a mild opening',()=>{
    const s=createSimulation(createTerrain()); const v=waterVolume(s); for(let i=0;i<100;i++) stepSimulation(s,.1); expect(waterVolume(s)-v).toBeCloseTo(s.accounting.inflow-s.accounting.outflow,5); expect(s.time).toBeCloseTo(10);
  });
  it('reserves queued barrier cost, deduplicates overlap and refunds removal',()=>{
    const g=createGame(); commandGame(g,{
      type:'pause'
    }); const points=[{
      x:100,y:150
    },{
      x:110,y:150
    }]; const before=g.resources; expect(commandGame(g,{
      type:'barrier',points
    }).ok).toBe(true); expect(g.resources).toBeLessThan(before); const reserved=g.resources; commandGame(g,{
      type:'barrier',points
    }); expect(g.resources).toBe(reserved); expect(snapshotGame(g).barriers.every(b=>b.status==='queued')).toBe(true); commandGame(g,{
      type:'resume'
    }); stepGame(g,3); expect(snapshotGame(g).barriers.every(b=>b.status==='ready')).toBe(true); commandGame(g,{
      type:'remove',points
    }); expect(g.resources).toBeGreaterThan(reserved);
  });
  it('runs six-second rescues in parallel and ignores repeated rescue commands',()=>{
    const g=createGame(); const ids=g.terrain.buildings.slice(0,2).map(b=>b.id); ids.forEach(buildingId=>{
      commandGame(g,{
        type:'rescue',buildingId
      }); commandGame(g,{
        type:'rescue',buildingId
      });
    }); stepGame(g,5.9); expect(g.rescued).toBe(0); stepGame(g,.1); expect(g.rescued).toBe(g.terrain.buildings.slice(0,2).reduce((n,b)=>n+b.people,0));
  });
  it('rejects deep-water lines atomically and resets deterministically',()=>{
    const g=createGame(); g.simulation.depths.fill(2); const before=g.resources; expect(commandGame(g,{
      type:'barrier',points:[{
        x:100,y:150
      },{
        x:110,y:150
      }]
    }).ok).toBe(false); expect(g.resources).toBe(before); commandGame(g,{
      type:'reset'
    }); expect(g.time).toBe(0); expect(g.resources).toBe(before);
  });
  it('finishes at 360 seconds and preserves detached snapshot arrays',()=>{
    const g=createGame(); const snap=snapshotGame(g); snap.depths.fill(99); expect(g.simulation.depths[0]).not.toBe(99); stepGame(g,361); expect(g.phase).toBe('finished'); expect(g.time).toBe(360);
  }, 30000);
});
it('blocks below a sill and overtops above it without changing the floor',()=>{
  const t=createTerrain(8,8);t.heights.fill(0);t.obstacles.fill(1);t.obstacles[27]=t.obstacles[28]=0; const s=createSimulation(t);s.depths.fill(0);s.depths[27]=.5;s.sillX[27]=1;
  stepSimulation(s,.1,false);expect(s.depths[28]).toBe(0);s.depths[27]=2;const volume=waterVolume(s);stepSimulation(s,.1,false);expect(s.depths[28]).toBeGreaterThan(0);expect(waterVolume(s)).toBeCloseTo(volume,10);expect(t.heights[27]).toBe(0);
});
it('uses a bounded relief channel with a gate spanning its width',()=>{
  const t=createTerrain();const gate=t.gates[0];expect(gate.edges!.length).toBeGreaterThan(3);for(const e of gate.edges!)expect(t.heights[e.a]).toBeLessThan(.5);for(const x of [gate.x-6,gate.x+6])expect(Math.max(...Array.from({length:13},(_,j)=>t.heights[(gate.y+j-6)*t.width+x]))).toBeGreaterThan(2);
});
it('revalidates paused reservations and refunds flooded construction on resume',()=>{
  const g=createGame();commandGame(g,{
    type:'pause'
  });const before=g.resources;commandGame(g,{
    type:'barrier',points:[{
      x:100,y:150
    },{
      x:110,y:150
    }]
  });expect(g.resources).toBeLessThan(before);g.simulation.depths.fill(2);commandGame(g,{
    type:'resume'
  });expect(g.barriers.size).toBe(0);expect(g.resources).toBe(before);
});
it('stops time and parallel rescue progress while paused',()=>{
  const g=createGame();commandGame(g,{
    type:'rescue',buildingId:0
  });commandGame(g,{
    type:'pause'
  });stepGame(g,20);expect(g.time).toBe(0);expect(g.rescues.get(0)!.elapsed).toBe(0);
});
it('rejects house collisions and invalid lines without charging',()=>{
  const g=createGame();const b=g.terrain.buildings[0];for(const points of [[{
    x:b.x,y:b.y
  },{
    x:b.x+4,y:b.y
  }],[{
    x:NaN,y:1
  },{
    x:2,y:2
  }],[{
    x:-1,y:1
  },{
    x:2,y:2
  }]])expect(commandGame(g,{
    type:'barrier',points
  }).ok).toBe(false);expect(g.resources).toBe(900);
});
it('stages barrier sill height without lifting water or terrain',()=>{
  const g=createGame();const z=g.terrain.heights.slice();commandGame(g,{
    type:'barrier',points:[{
      x:100,y:150
    },{
      x:101,y:150
    }]
  });stepGame(g,.5);const b=[...g.barriers.values()][0];expect(b.progress).toBeCloseTo(.25);expect(g.simulation.sillY[b.a]-Math.max(z[b.a],z[b.b])).toBeCloseTo(.275);expect(g.terrain.heights).toEqual(z);
});
it('exposes waterfront homes while a closed gate measurably reduces damage',()=>{
  const open=createGame(),closed=createGame(),protectedGame=createGame();const gate=protectedGame.terrain.gates[0];expect(commandGame(protectedGame,{type:'barrier',points:[{x:gate.x-5,y:gate.y+5},{x:gate.x+6,y:gate.y+5}]}).ok).toBe(true);commandGame(closed,{
    type:'gate',gateId:0,open:false
  });stepGame(open,360);stepGame(closed,360);stepGame(protectedGame,360);const a=snapshotGame(open).results,b=snapshotGame(closed).results;expect(a.damagedBuildings).toBeGreaterThanOrEqual(4);expect(b.meanDamage).toBeLessThan(a.meanDamage);expect(a.safePeople).toBeGreaterThan(0);expect(a.threatenedPeople).toBeGreaterThan(0);expect(snapshotGame(protectedGame).results.meanDamage).toBeLessThan(a.meanDamage);expect(Math.abs(open.simulation.accounting.error)).toBeLessThan(1e-5);
},60000);
it('reports never exposed residents separately from rescued residents',()=>{const g=createGame();const result=snapshotGame(g).results;expect(result.safePeople).toBe(result.totalPeople);expect(result.threatenedPeople).toBe(0);});
it('seals a closed vertex-coordinate square against hydraulic leakage',()=>{
 const t=createTerrain(8,8);t.heights.fill(0);t.obstacles.fill(0);t.river.fill(0);t.gates=[];
 const g=createGame(t);const points=[{x:2,y:2},{x:5,y:2},{x:5,y:5},{x:2,y:5},{x:2,y:2}];
 expect(commandGame(g,{type:'barrier',points}).ok).toBe(true);stepGame(g,2);g.simulation.depths[3*8+3]=.5;
 for(let i=0;i<100;i++)stepSimulation(g.simulation,.1,false);
 let outside=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(x<2||x>=5||y<2||y>=5)outside+=g.simulation.depths[y*8+x];
 expect(outside).toBe(0);expect(waterVolume(g.simulation)).toBeCloseTo(2,10);
});
it('deduplicates reversed diagonal segments and removes every original edge',()=>{
 const g=createGame();const points=[{x:100,y:150},{x:105,y:155}];commandGame(g,{type:'pause'});
 commandGame(g,{type:'barrier',points});const keys=[...g.barriers.keys()].sort(),resources=g.resources;
 commandGame(g,{type:'barrier',points:[...points].reverse()});expect([...g.barriers.keys()].sort()).toEqual(keys);expect(g.resources).toBe(resources);
 commandGame(g,{type:'remove',points:[...points].reverse()});expect(g.barriers.size).toBe(0);expect(g.resources).toBe(900);
});
