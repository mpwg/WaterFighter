import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Controller } from '../src/simulation/controller';
import type { Response } from '../src/protocol';
const original = JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
const scenario = { ...original, grid: { ...original.grid, width: 4, height: 4 }, terrain:Array(16).fill(0),bed:Array(16).fill(0),initialDepth:Array(16).fill(1),waterMask:Array(16).fill(1),surveyCrests:[], parameters:{...original.parameters,duration:10,inflowCells:[0],inflowCurve:[[0,0],[10,0]],outflowEdges:[]} };
function setup() { const messages:Response[]=[]; const c=new Controller(m=>messages.push(m)); c.handle({type:'init',scenario},0); return {c,messages}; }
function snapshots(m:Response[]) { return m.filter((x):x is Extract<Response,{type:'snapshot'}>=>x.type==='snapshot'); }
describe('Worker-Spieluhr', () => {
  it('erhält Rückstand und verarbeitet ihn ohne Zeitverlust', () => {
    const {c,messages}=setup(); c.handle({type:'start',round:1},0); c.tick(3000);
    const s=snapshots(messages).at(-1)!;
    // Both snapshot buffers are in use; return one so the latest state is sent.
    c.handle({type:'recycle',round:1,buffer:s.buffer},3000);
    const last=snapshots(messages).at(-1)!;
    expect(last.time).toBeCloseTo(1); expect(last.backlog).toBeCloseTo(2);
    c.tick(3000); c.handle({type:'recycle',round:1,buffer:last.buffer},3000);
    expect(snapshots(messages).at(-1)!.time).toBeCloseTo(2);
    expect(snapshots(messages).at(-1)!.backlog).toBeCloseTo(1);
  });
  it('pausiert, rechnet Geschwindigkeitswechsel korrekt und ignoriert alte Runden', () => {
    const {c,messages}=setup(); c.handle({type:'start',round:1},0); c.handle({type:'speed',round:1,speed:2},500);
    c.handle({type:'pause',round:1},1000);
    c.handle({type:'recycle',round:1,buffer:snapshots(messages)[0].buffer},1000);
    expect(snapshots(messages).at(-1)!.time).toBeCloseTo(1.5);
    c.tick(5000); c.handle({type:'reset',round:1},5000);
    c.handle({type:'start',round:1},5000); c.handle({type:'init',scenario},5000); c.tick(7000);
    const latest=snapshots(messages).at(-1)!;
    expect(latest.round).toBe(2); expect(latest.time).toBe(0); expect(latest.running).toBe(false);
  });
  it('begrenzt ausstehende Puffer und sendet nach Rückgabe den neuesten Zustand', () => {
    const {c,messages}=setup(); c.handle({type:'start',round:1},0); c.tick(500); c.tick(1000);
    expect(snapshots(messages)).toHaveLength(2);
    c.handle({type:'recycle',round:1,buffer:snapshots(messages)[0].buffer},1000);
    expect(snapshots(messages)).toHaveLength(3);
    expect(snapshots(messages).at(-1)!.time).toBeCloseTo(1);
  });
});

it('akzeptiert bestätigte Aktionen auch in Pause höchstens einmal und verwirft alte Runden',()=>{
  const {c,messages}=setup(); const action={kind:'trench' as const,cells:[0,1]};
  c.handle({type:'preview',round:1,id:'p',action},0);
  c.handle({type:'action',round:1,id:'a',action},0);
  c.handle({type:'action',round:1,id:'a',action},0);
  const replies=messages.filter((m):m is Extract<Response,{type:'action-result'}>=>m.type==='action-result');
  expect(replies).toHaveLength(3);expect(replies[0].preview).toBe(true);
  expect(replies[1].result).toEqual(replies[2].result);
  const reply=replies[1].result;expect(reply.ok && reply.budget).toBe(scenario.parameters.budget-2*scenario.parameters.trenchCostPerCell);
  c.handle({type:'recycle',round:1,buffer:snapshots(messages)[0].buffer},0);
  expect(snapshots(messages).at(-1)!.budget).toBe(scenario.parameters.budget-50);
  expect(snapshots(messages).at(-1)!.trenches).toEqual([0,1]);
  c.handle({type:'reset',round:1},0);c.handle({type:'action',round:1,id:'late',action},0);
  const latest=snapshots(messages).at(-1)!;expect(latest.round).toBe(2);expect(latest.budget).toBe(scenario.parameters.budget);expect(latest.trenches).toEqual([]);
  expect(new Float32Array(latest.buffer)[16*3]).toBe(0);
});

it('liefert zum Rundenende Ergebnis und lehnt spätere Aktionen ab',()=>{
  const {c,messages}=setup();c.handle({type:'start',round:1},0);
  for(let t=1000;t<=10000;t+=1000)c.tick(t);
  const result=messages.find((m):m is Extract<Response,{type:'result'}>=>m.type==='result');
  expect(result?.time).toBeCloseTo(10);expect(result?.achieved).toBe(true);expect(result?.budget).toBe(scenario.parameters.budget);
  c.handle({type:'action',round:1,id:'late',action:{kind:'trench',cells:[0]}},10000);
  const reply=messages.find((m):m is Extract<Response,{type:'action-result'}>=>m.type==='action-result');expect(reply?.result.ok).toBe(false);
});

it('ordnet bestätigten und wiederholten Aktionen dieselbe Zustandsrevision zu',()=>{
  const {c,messages}=setup();const action={kind:'trench' as const,cells:[0,1]};
  c.handle({type:'action',round:1,id:'same',action},0);c.handle({type:'action',round:1,id:'same',action},0);
  const replies=messages.filter((m):m is Extract<Response,{type:'action-result'}>=>m.type==='action-result');
  expect(replies.map(r=>r.revision)).toEqual([1,1]);
  c.handle({type:'recycle',round:1,buffer:snapshots(messages)[0].buffer},0);
  expect(snapshots(messages).at(-1)!.revision).toBe(1);
});


it('verarbeitet nach einem Fehler keine Aktion und lässt einen sauberen Neustart zu',()=>{
  const {c,messages}=setup();
  c.handle({type:'start',round:1},0);
  const action={kind:'trench' as const,cells:[0,1]};
  c.handle({type:'action',round:1,id:'failed',action},NaN);
  expect(messages.some(m=>m.type==='error' && m.round===1)).toBe(true);
  expect(messages.some(m=>m.type==='action-result')).toBe(false);
  c.handle({type:'start',round:1},1000);
  c.handle({type:'action',round:1,id:'after',action},1000);
  expect(messages.some(m=>m.type==='action-result')).toBe(false);
  c.handle({type:'reset',round:1},1000);
  expect(snapshots(messages).at(-1)?.round).toBe(2);
  expect(snapshots(messages).at(-1)?.budget).toBe(scenario.parameters.budget);
  c.handle({type:'action',round:2,id:'new',action},1000);
  expect(messages.some(m=>m.type==='action-result' && m.round===2 && m.result.ok)).toBe(true);
});

it('erhält Wasser und berechnet alle drei laufenden Eingriffe genau einmal',()=>{
  const wet={...scenario,buildings:[{id:'house',area:16,height:8,heightEstimated:true,polygon:{outer:[[8,8],[12,8],[12,12],[8,12],[8,8]],holes:[]}}]};
  const messages:Response[]=[],c=new Controller(m=>messages.push(m));
  c.handle({type:'init',scenario:wet},0);c.handle({type:'start',round:1},0);c.tick(1000);
  let buffer=snapshots(messages)[0].buffer;c.handle({type:'recycle',round:1,buffer},1000);
  let current=snapshots(messages).at(-1)!,volume=current.volume,budget=current.budget;
  const actions=[
    {kind:'dam' as const,faces:[{axis:'x' as const,index:7}]},
    {kind:'trench' as const,cells:[0,1]},
    {kind:'demolish' as const,buildingId:'house'},
  ];
  for(const [i,action] of actions.entries()){
    const id=`running-${i}`;
    c.handle({type:'preview',round:1,id,action},1000);
    c.handle({type:'action',round:1,id,action},1000);
    c.handle({type:'action',round:1,id,action},1000);
    const replies=messages.filter((m):m is Extract<Response,{type:'action-result'}>=>m.type==='action-result'&&m.id===id);
    expect(replies).toHaveLength(3);expect(replies[0].result.ok).toBe(true);
    expect(replies[1].result).toEqual(replies[0].result);expect(replies[2].result).toEqual(replies[1].result);
    const result=replies[1].result;if(!result.ok)throw Error(result.reason);
    expect(result.budget).toBe(budget-result.cost);budget=result.budget;
    buffer=current.buffer;c.handle({type:'recycle',round:1,buffer},1000);current=snapshots(messages).at(-1)!;
    expect(current.running).toBe(true);expect(current.time).toBeCloseTo(1);
    expect(current.budget).toBe(budget);expect(current.volume).toBeCloseTo(volume,10);
    volume=current.volume;
  }
});

it('setzt nach Flut und allen drei Eingriffen den gesamten Workerzustand zurück',()=>{
  const water=Array.from({length:16},(_,i)=>i<8?1:0.2);
  const wet={...scenario,initialDepth:water,buildings:[{id:'house',area:16,height:8,heightEstimated:true,polygon:{outer:[[8,8],[12,8],[12,12],[8,12],[8,8]],holes:[]}}]};
  const messages:Response[]=[],controller=new Controller(m=>messages.push(m));
  controller.handle({type:'init',scenario:wet},0);
  const initial=snapshots(messages).at(-1)!;
  const initialField=[...new Float32Array(initial.buffer)],initialBuildings=structuredClone(initial.buildings);
  controller.handle({type:'speed',round:1,speed:2},0);controller.handle({type:'start',round:1},0);controller.tick(500);
  const actions=[
    {kind:'dam' as const,faces:[{axis:'x' as const,index:1}]},
    {kind:'trench' as const,cells:[0,1]},
    {kind:'demolish' as const,buildingId:'house'},
  ];
  for(const [i,action] of actions.entries())controller.handle({type:'action',round:1,id:`action-${i}`,action},500);
  const replies=messages.filter((m):m is Extract<Response,{type:'action-result'}>=>m.type==='action-result');
  expect(replies).toHaveLength(3);expect(replies.every(r=>r.result.ok)).toBe(true);
  controller.handle({type:'reset',round:1},500);
  const reset=snapshots(messages).at(-1)!;
  expect(reset.round).toBe(2);expect(reset.revision).toBe(0);expect(reset.time).toBe(0);
  expect(reset.running).toBe(false);expect(reset.speed).toBe(1);expect(reset.backlog).toBe(0);
  expect(reset.budget).toBe(initial.budget);expect(reset.buildings).toEqual(initialBuildings);expect(reset.dams).toEqual([]);
  expect([...new Float32Array(reset.buffer)]).toEqual(initialField);
  expect([reset.volume,reset.inflow,reset.outflow,reset.roundoffVolume]).toEqual([initial.volume,0,0,0]);
  controller.handle({type:'action',round:1,id:'late',action:actions[1]},500);
  expect(messages.filter(m=>m.type==='action-result')).toHaveLength(3);
  controller.handle({type:'action',round:2,id:'action-1',action:actions[1]},500);
  const last=messages.filter((m):m is Extract<Response,{type:'action-result'}>=>m.type==='action-result').at(-1)!;
  expect(last.round).toBe(2);expect(last.result.ok).toBe(true);
});

it('verbindet überlappende Gräben im laufenden Worker ohne zweite Vertiefung',()=>{
  const {c,messages}=setup();
  c.handle({type:'start',round:1},0);c.tick(1000);
  c.handle({type:'action',round:1,id:'first',action:{kind:'trench',cells:[0,1,2]}},1000);
  c.handle({type:'action',round:1,id:'second',action:{kind:'trench',cells:[1,2,3]}},1000);
  c.handle({type:'action',round:1,id:'second',action:{kind:'trench',cells:[1,2,3]}},1000);
  const replies=messages.filter((m):m is Extract<Response,{type:'action-result'}>=>m.type==='action-result'&&m.id==='second');
  expect(replies).toHaveLength(2);expect(replies[0].result).toMatchObject({ok:true,cost:25,reusedCells:2});
  expect(replies[1].result).toEqual(replies[0].result);expect(replies.map(r=>r.revision)).toEqual([2,2]);
  c.handle({type:'recycle',round:1,buffer:snapshots(messages)[0].buffer},1000);
  const state=snapshots(messages).at(-1)!;const bed=new Float32Array(state.buffer,16*12,16);
  expect(state.trenches).toEqual([0,1,2,3]);expect(state.budget).toBe(scenario.parameters.budget-100);
  for(const cell of [0,1,2,3])expect(bed[cell]).toBeCloseTo(-scenario.parameters.trenchDepth);
});
