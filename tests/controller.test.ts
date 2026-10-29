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
  c.handle({type:'reset',round:1},0);c.handle({type:'action',round:1,id:'late',action},0);
  const latest=snapshots(messages).at(-1)!;expect(latest.round).toBe(2);expect(latest.budget).toBe(scenario.parameters.budget);
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
