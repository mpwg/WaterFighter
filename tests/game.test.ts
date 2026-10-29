import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Game } from '../src/simulation/game';
const base=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
const scenario={...base,grid:{...base.grid,width:5,height:5,cellSize:4},terrain:Array(25).fill(0),bed:Array(25).fill(0),initialDepth:Array(25).fill(0),waterMask:Array(25).fill(0),parameters:{...base.parameters,inflowCells:[0],inflowCurve:[[0,0],[300,0]],outflowEdges:[]},buildings:[{id:'house',area:16,height:8,heightEstimated:true,polygon:{outer:[[8,8],[12,8],[12,12],[8,12],[8,8]],holes:[]}}]};

describe('Bauaktionen und Schäden',()=>{
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
