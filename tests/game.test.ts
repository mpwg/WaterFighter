import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Game } from '../src/simulation/game';
import { damPath } from '../src/simulation/path';
const base=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
const scenario={...base,grid:{...base.grid,width:5,height:5,cellSize:4},terrain:Array(25).fill(0),bed:Array(25).fill(0),initialDepth:Array(25).fill(0),waterMask:Array(25).fill(0),surveyCrests:[],parameters:{...base.parameters,inflowCells:[0],inflowCurve:[[0,0],[300,0]],outflowEdges:[]},buildings:[{id:'house',area:16,height:8,heightEstimated:true,polygon:{outer:[[8,8],[12,8],[12,12],[8,12],[8,8]],holes:[]}}]};

describe('Bauaktionen und Schäden',()=>{
  it('weist auf ein freies Dammende eine Rasterkante vor dem Rand hin',()=>{
    const g=new Game(scenario), near={kind:'dam' as const,faces:damPath([2,1],[2,3],5)};
    const before=g.budget,volume=g.solver.volume();
    expect(g.preview(near)).toMatchObject({ok:true,nearBoundaryGap:true});
    expect(g.budget).toBe(before);expect(g.solver.volume()).toBe(volume);
    const separate=new Game(scenario),preview=separate.preview(near);
    expect(separate.apply('near-edge',near)).toEqual(preview);
    expect(separate.budget).toBe(before-2*scenario.parameters.damCostPerCell);
    expect(separate.apply('near-edge',near)).toEqual(preview);
    expect(separate.budget).toBe(before-2*scenario.parameters.damCostPerCell);
    expect(separate.solver.volume()).toBe(volume);
    const reachesEdge={kind:'dam' as const,faces:damPath([2,0],[2,3],5)};
    expect(g.preview(reachesEdge)).not.toHaveProperty('nearBoundaryGap');
    expect(g.apply('extension',{kind:'dam',faces:damPath([2,0],[2,1],5)}).ok).toBe(true);
    expect(g.preview(near)).not.toHaveProperty('nearBoundaryGap');
  });
  it('berechnet Vorschau ohne Zustandsänderung, rechnet Bestätigung genau einmal ab',()=>{
    const g=new Game(scenario), a={kind:'dam' as const,faces:[{axis:'x' as const,index:2*6+2},{axis:'x' as const,index:3*6+2}]};
    const before=g.budget,volume=g.solver.volume(); const preview=g.preview(a);
    expect(preview.ok).toBe(true);expect(g.budget).toBe(before);expect(g.damFaces.size).toBe(0);
    const result=g.apply('a',a);expect(result).toEqual(preview);expect(g.budget).toBe(before-80);
    expect(g.apply('a',a)).toEqual(result);expect(g.budget).toBe(before-80);expect(g.damFaces.size).toBe(2);expect(g.solver.volume()).toBe(volume);
  });
  it('weist ungültige, getrennte und unbezahlbare Aktionen atomar ab',()=>{
    const g=new Game({...scenario,parameters:{...scenario.parameters,budget:10}}),before=g.solver.bed.slice();
    expect(g.apply('a',{kind:'trench',cells:[0]}).ok).toBe(false);
    expect(g.apply('b',{kind:'trench',cells:[0,24]}).ok).toBe(false);
    expect(g.apply('c',{kind:'trench',cells:[12]}).ok).toBe(false);
    expect(g.budget).toBe(10);expect([...g.solver.bed]).toEqual([...before]);
  });
  it('erklärt Kartenrand, bestehende Dämme und Gebäude als unterschiedliche Hindernisse',()=>{
    const g=new Game(scenario),budget=g.budget;
    expect(g.preview({kind:'dam',faces:[{axis:'y',index:2}]})).toMatchObject({ok:false,reason:expect.stringContaining('Kartenrand')});
    expect(g.preview({kind:'trench',cells:[12]})).toMatchObject({ok:false,reason:expect.stringContaining('Gebäude versperrt')});
    expect(g.apply('dam',{kind:'dam',faces:[{axis:'x',index:1}]}).ok).toBe(true);
    expect(g.preview({kind:'dam',faces:[{axis:'x',index:1}]})).toMatchObject({ok:false,reason:expect.stringContaining('bereits ein Damm')});
    expect(g.budget).toBe(budget-scenario.parameters.damCostPerCell);
  });
  it('erhält vorhandenes Wasser beim Ausheben und entfernt Gebäudegrenzen beim Abriss',()=>{
    const g=new Game(scenario);g.solver.h[0]=2;const v=g.solver.volume();const face=2*6+2;
    expect(g.solver.crestX[face]).toBeGreaterThan(100);
    expect(g.apply('t',{kind:'trench',cells:[0,1]}).ok).toBe(true);
    expect(g.solver.h[0]).toBe(2);expect(g.solver.bed[0]).toBe(-scenario.parameters.trenchDepth);expect(g.solver.volume()).toBe(v);
    expect(g.apply('d',{kind:'demolish',buildingId:'house'}).ok).toBe(true);
    expect(g.solver.crestX[face]).toBe(-Infinity);expect(g.solver.volume()).toBe(v);
  });
  it('bewertet Wasser an Gebäudegrenzen und zählt Abriss nicht zusätzlich zum Flutschaden',()=>{
    const g=new Game(scenario);g.solver.h[11]=1;g.updateDamage(30);
    const before=g.totals();expect(before.floodDamage).toBeGreaterThan(0);expect(before.demolitionLoss).toBe(0);
    g.apply('d',{kind:'demolish',buildingId:'house'});
    expect(g.totals()).toEqual({floodDamage:0,demolitionLoss:160,totalDamage:160});
  });
});

describe('Hydraulische Wirkung der Werkzeuge',()=>{
  it('leitet durch einen Graben Wasser über eine künstliche Bodenschwelle',()=>{
    const w=12,h=5,bed=Array.from({length:w*h},(_,i)=>i%w>=5&&i%w<=6?0.65:0);
    const cfg={...scenario,grid:{...scenario.grid,width:w,height:h},bed,terrain:bed,initialDepth:Array.from({length:w*h},(_,i)=>i%w<5?0.5:0),waterMask:Array(w*h).fill(0),buildings:[],parameters:{...scenario.parameters,trenchDepth:0.8}};
    const plain=new Game(cfg),dug=new Game(cfg), initial=dug.solver.volume();
    const cells=[2*w+5,2*w+6];expect(dug.apply('ditch',{kind:'trench',cells}).ok).toBe(true);
    plain.solver.advance(15);dug.solver.advance(15);
    const downstream=(g:Game)=>g.solver.h.reduce((sum,v,i)=>sum+(i%w>6?v:0),0);
    expect(downstream(plain)).toBeLessThan(1e-8);expect(downstream(dug)).toBeGreaterThan(0.1);
    expect(Math.abs(dug.solver.volume()-initial)/initial).toBeLessThan(0.001);
  });
  it('öffnet durch Abriss eines Gebäudes einen zuvor versperrten Wasserweg',()=>{
    const w=12,h=5,bed=Array(w*h).fill(0);
    const cfg={...scenario,grid:{...scenario.grid,width:w,height:h},bed,terrain:bed,initialDepth:Array.from({length:w*h},(_,i)=>i%w<5?1:0),waterMask:Array(w*h).fill(0),buildings:[{id:'bar',area:80,height:8,heightEstimated:true,polygon:{outer:[[20,0],[24,0],[24,20],[20,20],[20,0]],holes:[]}}]};
    const blocked=new Game(cfg),open=new Game(cfg),initial=open.solver.volume();
    expect(open.apply('remove',{kind:'demolish',buildingId:'bar'}).ok).toBe(true);
    blocked.solver.advance(15);open.solver.advance(15);
    const downstream=(g:Game)=>g.solver.h.reduce((sum,v,i)=>sum+(i%w>5?v:0),0);
    expect(downstream(blocked)).toBeLessThan(1e-8);expect(downstream(open)).toBeGreaterThan(1);
    expect(Math.abs(open.solver.volume()-initial)/initial).toBeLessThan(0.001);
  });
});

it('nimmt kleine Gebäude ohne Zellmittelpunkt in Blockade und Schadenswertung auf',()=>{
  const small={...scenario,buildings:[{id:'small',area:1,height:5,heightEstimated:true,polygon:{outer:[[8.1,8.1],[9.1,8.1],[9.1,9.1],[8.1,9.1],[8.1,8.1]],holes:[]}}]};
  const g=new Game(small);expect(g.buildings[0].cells).toEqual([12]);
  expect(g.solver.crestX[2*6+2]).toBeGreaterThan(100);
  g.solver.h[11]=1;g.updateDamage(60);expect(g.totals().floodDamage).toBeGreaterThan(0);
});

it('erhält die aus Geländedaten abgeleiteten Kronen nach Eingriffen und Neustart',()=>{
  const face={axis:'x' as const,index:1*6+2,crest:2};const cfg={...scenario,surveyCrests:[face]};
  const g=new Game(cfg);expect(g.solver.crestX[face.index]).toBe(2);
  expect(g.apply('dig',{kind:'trench',cells:[0]}).ok).toBe(true);
  expect(g.solver.crestX[face.index]).toBe(2);
  expect(g.apply('remove',{kind:'demolish',buildingId:'house'}).ok).toBe(true);
  expect(g.solver.crestX[face.index]).toBe(2);
  expect(new Game(cfg).solver.crestX[face.index]).toBe(2);
});


it('senkt eine vermessene Krone, wenn ein Graben sie vollständig durchschneidet',()=>{
  const face={axis:'x' as const,index:1*6+2,crest:2};const g=new Game({...scenario,surveyCrests:[face]});
  expect(g.preview({kind:'trench',cells:[6,7]})).toMatchObject({ok:true,loweredCrests:1});
  expect(g.solver.crestX[face.index]).toBe(2);
  expect(g.apply('cut',{kind:'trench',cells:[6,7]}).ok).toBe(true);
  expect(g.solver.crestX[face.index]).toBeCloseTo(2-scenario.parameters.trenchDepth);
});

it('meldet eine Kantenabsenkung auch beim Anschluss an einen bestehenden Graben',()=>{
  const face={axis:'y' as const,index:2*5+1,crest:2};const g=new Game({...scenario,surveyCrests:[face]});
  expect(g.preview({kind:'trench',cells:[6]})).toEqual({ok:true,cost:25,budget:g.budget-25});
  expect(g.apply('first',{kind:'trench',cells:[6]}).ok).toBe(true);
  const before=g.budget,preview=g.preview({kind:'trench',cells:[11]});
  expect(preview).toMatchObject({ok:true,loweredCrests:1});
  expect(g.budget).toBe(before);expect(g.solver.crestY[face.index]).toBe(2);
  expect(g.apply('second',{kind:'trench',cells:[11]})).toEqual(preview);
  expect(g.solver.crestY[face.index]).toBeCloseTo(2-scenario.parameters.trenchDepth);
});

it('meldet die zwei untersuchten Geländekanten im ausgelieferten Szenario',()=>{
  expect(base.version).toBe('1.5-draft');
  const g=new Game(base),action={kind:'trench' as const,cells:[7036,7037,7038]};
  const before=[g.solver.crestX[7072],g.solver.crestX[7073]];
  const preview=g.preview(action);
  expect(preview).toMatchObject({ok:true,loweredCrests:2});
  expect([g.solver.crestX[7072],g.solver.crestX[7073]]).toEqual(before);
  expect(g.apply('reference',action)).toEqual(preview);
  expect(g.solver.crestX[7072]).toBeCloseTo(before[0]-base.parameters.trenchDepth);
  expect(g.solver.crestX[7073]).toBeCloseTo(before[1]-base.parameters.trenchDepth);
});

it('bewertet einen vollständigen Stadtabriss höher als das Schadensziel und über dem Budget',()=>{
  const g=new Game(base);
  const totalValue=g.buildings.reduce((sum,b)=>sum+b.value,0);
  const totalCost=g.buildings.reduce((sum,b)=>sum+Math.ceil(b.value*base.parameters.demolitionCostFraction),0);
  expect(totalValue).toBeGreaterThan(base.parameters.damageTarget);
  expect(totalCost).toBeGreaterThan(base.parameters.budget);
});

it('warnt bei Dammkanten an Gebäuden und entfernt den Hinweis nach Abriss',()=>{
  const g=new Game(scenario),face={axis:'x' as const,index:2*6+2},action={kind:'dam' as const,faces:[face]};
  const before=g.budget,crest=g.solver.crestX[face.index];
  expect(g.preview(action)).toMatchObject({ok:true,buildingBlockedFaces:1});
  expect(g.budget).toBe(before);expect(g.damFaces.size).toBe(0);expect(g.solver.crestX[face.index]).toBe(crest);
  expect(g.apply('remove-building',{kind:'demolish',buildingId:'house'}).ok).toBe(true);
  expect(g.preview(action)).toMatchObject({ok:true});
  expect(g.preview(action)).not.toHaveProperty('buildingBlockedFaces');
});

it('verbindet bestehende Gräben ohne erneute Vertiefung, Kosten oder Wasserverlust',()=>{
  const g=new Game(scenario),initialBudget=g.budget;
  g.solver.h[1]=1;g.solver.h[2]=0.5;
  const volume=g.solver.volume();
  const first={kind:'trench' as const,cells:[0,1,2]},second={kind:'trench' as const,cells:[1,2,3]};
  expect(g.apply('first',first)).toMatchObject({ok:true,cost:75});
  const beforeBed=[...g.solver.bed],beforeBudget=g.budget;
  const preview=g.preview(second);
  expect(preview).toMatchObject({ok:true,cost:25,reusedCells:2,budget:beforeBudget-25});
  expect([...g.solver.bed]).toEqual(beforeBed);expect(g.budget).toBe(beforeBudget);
  expect(g.apply('second',second)).toEqual(preview);
  expect(g.apply('second',second)).toEqual(preview);
  expect(g.budget).toBe(initialBudget-100);
  for(const i of [0,1,2,3])expect(g.solver.bed[i]).toBeCloseTo(-scenario.parameters.trenchDepth);
  expect(g.solver.volume()).toBe(volume);
  expect(g.preview(second)).toMatchObject({ok:false,reason:expect.stringContaining('bereits gegraben')});
  const bad=g.preview({kind:'trench',cells:[2,7,12]});
  expect(bad).toMatchObject({ok:false,reason:expect.stringContaining('Gebäude versperrt')});
  expect(g.budget).toBe(initialBudget-100);expect(g.solver.bed[7]).toBe(0);
});

it('meldet eine neue Geländekantenabsenkung bei überlappender Grabenverlängerung nur einmal',()=>{
  const face={axis:'y' as const,index:2*5+1,crest:2};
  const g=new Game({...scenario,surveyCrests:[face]});
  expect(g.apply('first',{kind:'trench',cells:[6]})).toMatchObject({ok:true,cost:25});
  const extension={kind:'trench' as const,cells:[6,11]};
  const preview=g.preview(extension);
  expect(preview).toMatchObject({ok:true,cost:25,reusedCells:1,loweredCrests:1});
  expect(g.solver.crestY[face.index]).toBe(2);
  expect(g.apply('extend',extension)).toEqual(preview);
  expect(g.solver.crestY[face.index]).toBeCloseTo(2-scenario.parameters.trenchDepth);
  const next=g.preview({kind:'trench',cells:[6,11,16]});
  expect(next).toMatchObject({ok:true,cost:25,reusedCells:2});
  expect(next).not.toHaveProperty('loweredCrests');
});
