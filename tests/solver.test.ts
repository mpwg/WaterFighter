import { describe, expect, it } from 'vitest';
import { ShallowWaterSolver } from '../src/simulation/solver';

describe('Flachwassersolver', () => {
  it('hält einen ruhenden See über unebenem Boden im Gleichgewicht', () => {
    const w=16, n=w*w, bed=Array.from({length:n},(_,i)=> 0.4*Math.sin(i%w/3)*Math.cos(Math.floor(i/w)/4));
    const initial=bed.map(z=>2-z), s=new ShallowWaterSolver(w,w,4,bed,initial);
    s.advance(600);
    expect(Math.max(...s.h.map((h,i)=>Math.abs(h-initial[i])))).toBeLessThan(1e-10);
    expect(Math.max(...s.qx.map(Math.abs),...s.qy.map(Math.abs))).toBeLessThan(1e-10);
  });
  it('erhält in einem geschlossenen Becken zehn Minuten die Wassermenge und bleibt positiv', () => {
    const w=20,n=w*w, bed=Array(n).fill(0), depth=Array.from({length:n},(_,i)=>i%w<10?2:0);
    const s=new ShallowWaterSolver(w,w,4,bed,depth), initial=s.volume();
    s.advance(600);
    expect(Math.abs(s.volume()-initial)/initial).toBeLessThan(0.001);
    expect([...s.h,...s.qx,...s.qy].every(Number.isFinite)).toBe(true);
    expect(Math.min(...s.h)).toBeGreaterThanOrEqual(0);
    expect(s.h[15]).toBeGreaterThan(0.1);
  });
  it('lässt einen trockenen Zustand unverändert', () => {
    const s=new ShallowWaterSolver(4,4,4,Array(16).fill(0),Array(16).fill(0));
    s.advance(600); expect(s.volume()).toBe(0); expect([...s.qx,...s.qy].every(x=>x===0)).toBe(true);
  });
  it('ist deterministisch bei identischem Startzustand', () => {
    const make=()=>new ShallowWaterSolver(8,8,4,Array(64).fill(0),Array.from({length:64},(_,i)=>i<32?1:0));
    const a=make(),b=make(); a.advance(30); b.advance(30);
    expect([...a.h]).toEqual([...b.h]); expect([...a.qy]).toEqual([...b.qy]);
  });
});

describe('Bilanzierte Randbedingungen', () => {
  it('bilanziert zehn Minuten Zufluss und offenen Abfluss', () => {
    const w=12, h=6, s=new ShallowWaterSolver(w,h,4,Array(w*h).fill(0),Array(w*h).fill(0));
    s.openBoundary.right=true;
    const initial=s.volume();
    for (let t=0;t<600;t++) { s.addInflow(2*w, 0.8); s.advance(1); }
    const error=Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume);
    expect(s.outflow).toBeGreaterThan(10);
    expect(error/(initial+s.inflow)).toBeLessThan(0.001);
    expect(Math.min(...s.h)).toBeGreaterThanOrEqual(0);
  });
  it('bilanziert bei einem verworfenen Schritt keinen Abfluss', () => {
    const s=new ShallowWaterSolver(2,1,4,[0,0],[1,1]);
    s.openBoundary.right=true; s.qx[1]=1; s.manning=-1;
    const depth=[...s.h],momentum=[...s.qx],volume=s.volume();
    expect(()=>s.step(0.1)).toThrow('Ungültige Bodenreibung');
    expect(s.outflow).toBe(0);expect(s.time).toBe(0);expect(s.steps).toBe(0);
    expect([...s.h]).toEqual(depth);expect([...s.qx]).toEqual(momentum);expect(s.volume()).toBe(volume);
  });
  it('übernimmt keinen Abfluss, wenn die Zustandsprüfung fehlschlägt', () => {
    const s=new ShallowWaterSolver(2,1,4,[0,0],[1,1]);
    s.openBoundary.right=true;s.qx[0]=NaN;s.qx[1]=1;
    const depth=[...s.h];expect(()=>s.step(0.1)).toThrow('Instabiler Zustand');
    expect(s.outflow).toBe(0);expect(s.time).toBe(0);expect(s.steps).toBe(0);expect([...s.h]).toEqual(depth);
  });
  it('weist ungültige Zuflüsse zurück', () => {
    const s=new ShallowWaterSolver(3,3,4,Array(9).fill(0),Array(9).fill(0));
    expect(()=>s.addInflow(4,1)).toThrow();
    expect(()=>s.addInflow(0,-1)).toThrow();
    expect(s.volume()).toBe(0);
  });
});

describe('Flutwelle', () => {
  it('breitet sich radial und symmetrisch aus und trägt Impuls nach außen', () => {
    const w=31,n=w*w, initial=Array(n).fill(0.05);
    initial[15*w+15]=3;
    const s=new ShallowWaterSolver(w,w,4,Array(n).fill(0),initial);
    s.advance(4);
    expect(s.h[15*w+17]).toBeGreaterThan(initial[15*w+17]);
    expect(s.qx[15*w+17]).toBeGreaterThan(0);
    expect(s.qx[15*w+13]).toBeLessThan(0);
    for(let y=0;y<w;y++) for(let x=0;x<w;x++) {
      expect(Math.abs(s.h[y*w+x]-s.h[y*w+(w-1-x)])).toBeLessThan(1e-12);
      expect(Math.abs(s.h[y*w+x]-s.h[x*w+y])).toBeLessThan(1e-12);
    }
  });
});

describe('Barrieren und Bodenreibung', () => {
  it('staut Wasser und lässt bei Überschreitung der Krone Wasser überströmen', () => {
    const w=20,h=5,bed=Array(w*h).fill(0);
    const make=(depth:number)=> {
      const s=new ShallowWaterSolver(w,h,4,bed,Array.from({length:w*h},(_,i)=>i%w<10?depth:0));
      for(let y=0;y<h;y++) s.crestX[y*(w+1)+10]=1.5;
      return s;
    };
    const low=make(1), high=make(2); const volume=high.volume();
    low.advance(20); high.advance(20);
    const downstream=(s:ShallowWaterSolver)=>s.h.reduce((sum,v,i)=>sum+(i%w>=10?v:0),0);
    expect(downstream(low)).toBeLessThan(1e-10);
    expect(downstream(high)).toBeGreaterThan(1);
    expect(Math.abs(high.volume()-volume)/volume).toBeLessThan(1e-10);
  });
  it('verringert Impuls durch Reibung ohne Wasser zu verändern', () => {
    const s=new ShallowWaterSolver(3,3,4,Array(9).fill(0),Array(9).fill(1));
    s.manning=0.05; s.qx.fill(1); const volume=s.volume();
    s.step(0.01);
    expect(s.qx[4]).toBeLessThan(1);
    expect(s.volume()).toBeCloseTo(volume,10);
  });
});

it('lässt eine Welle symmetrisch durch eine Dammöffnung laufen',()=>{
  const w=30,h=21,mid=15,depth=Array.from({length:w*h},(_,i)=>i%w<mid?2:0);
  const s=new ShallowWaterSolver(w,h,4,Array(w*h).fill(0),depth),volume=s.volume();
  for(let y=0;y<h;y++) if(y!==10)s.crestX[y*(w+1)+mid]=10;
  s.advance(6);
  expect(s.h[10*w+mid+1]).toBeGreaterThan(0.1);
  expect(s.h[10*w+mid+1]).toBeGreaterThan(s.h[2*w+mid+1]);
  expect(s.qx[10*w+mid+1]).toBeGreaterThan(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)expect(Math.abs(s.h[y*w+x]-s.h[(h-1-y)*w+x])).toBeLessThan(1e-11);
  expect(Math.abs(s.volume()-volume)/volume).toBeLessThan(0.001);
});
