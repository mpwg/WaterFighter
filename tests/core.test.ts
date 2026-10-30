import { describe, expect, it } from 'vitest';
import { SCENARIO } from '../src/core/arena';
import { advance, command, createGame, FIXED_DT, getResult, inflowAt, step } from '../src/core/game';
import type { GameState } from '../src/core/types';
import { getPreview } from '../src/render/preview';

function running(): GameState {
  const s = createGame();
  for (const targetId of ['b1', 'b2', 'b3']) command(s, { type: 'prepare', preparation: { kind: 'capacity', targetId } });
  expect(command(s, { type: 'start' })).toBe(true);
  return s;
}
const stored = (s: GameState) => s.nodes.reduce((a, n) => a + n.volume, 0);
const node = (s: GameState, id: string) => s.nodes.find(n => n.id === id)!;

describe('Wassernetz und Flut', () => {
  it('besitzt sechs Gemeinden, drei Rückhalteräume, vier Wehre und vier Dammstellen', () => {
    expect(SCENARIO.version).toBe(3);
    expect(SCENARIO.nodes.filter(n => n.kind === 'town')).toHaveLength(6);
    expect(SCENARIO.nodes.filter(n => n.kind === 'basin')).toHaveLength(3);
    expect(SCENARIO.links.filter(n => n.kind === 'gate')).toHaveLength(4);
    expect(SCENARIO.sites).toHaveLength(4);
    for (const l of SCENARIO.links) {
      expect(SCENARIO.nodes.some(n => n.id === l.from)).toBe(true);
      expect(SCENARIO.nodes.some(n => n.id === l.to)).toBe(true);
    }
  });
  it('bewahrt die Wasserbilanz über eine volle Runde mit Wehren und Dammöffnung', () => {
    const s = running();
    command(s, { type: 'gate', id: 'g1', opening: 1 });
    command(s, { type: 'build', id: 'd3' });
    for (let t = 0; t < 180; t++) {
      if (t === 45) command(s, { type: 'gate', id: 'g1', opening: 0 });
      if (t === 60) command(s, { type: 'breach', id: 'd2' });
      if (t === 80) command(s, { type: 'gate', id: 'g4', opening: 1 });
      advance(s, 1);
      expect(Math.abs(stored(s) - s.initialVolume - s.totalIn + s.totalOut)).toBeLessThan(1e-7);
      expect(s.nodes.every(n => Number.isFinite(n.volume) && n.volume >= -1e-10)).toBe(true);
    }
    expect(s.phase).toBe('finished');
    expect(s.totalOut).toBeGreaterThan(0);
  });
  it('öffnet nach Stellzeit und senkt den Pegel vor dem Abzweig', () => {
    const closed = running(), open = running();
    command(open, { type: 'gate', id: 'g1', opening: 1 });
    advance(open, 1);
    expect(open.gates[0].opening).toBe(0);
    expect(command(open, { type: 'gate', id: 'g1', opening: .5 })).toBe(false);
    advance(open, 29); advance(closed, 30);
    expect(open.gates[0].opening).toBe(1);
    expect(node(open, 'b1').volume).toBeGreaterThan(node(closed, 'b1').volume);
    expect(node(open, 'r2').depth).toBeLessThan(node(closed, 'r2').depth);
  });
  it('lässt einen vollen Rückhalteraum überlaufen und Wasser bei umgekehrtem Gefälle zurückfließen', () => {
    const s = running(), b = node(s, 'b1');
    b.volume = 90 * 1.75 * 6;
    b.depth = 6;
    s.initialVolume = stored(s);
    command(s, { type: 'gate', id: 'g1', opening: 1 });
    advance(s, 2);
    expect(s.flows.g1).toBeLessThan(0);
    expect(s.flows['spill-b1']).toBeGreaterThan(0);
    expect(node(s, 'korneuburg').volume).toBeGreaterThan(0);
    expect(Math.abs(stored(s) - s.initialVolume - s.totalIn + s.totalOut)).toBeLessThan(1e-7);
  });
  it('lässt zusätzliches Speichervolumen später überlaufen, ohne Wasser zu löschen', () => {
    const extra = running(), normal = running();
    normal.preparations = [];
    for (const s of [extra, normal]) {
      node(s, 'b1').volume = 300;
      s.initialVolume = stored(s);
      step(s);
    }
    expect(node(extra, 'b1').depth).toBeLessThan(node(normal, 'b1').depth);
    expect(normal.flows['spill-b1']).toBeGreaterThan(extra.flows['spill-b1']);
    expect(Math.abs(stored(extra) - extra.initialVolume - extra.totalIn + extra.totalOut)).toBeLessThan(1e-7);
  });
  it('kündigt die zweite Spitze vor ihrem Scheitel an', () => {
    const s = running(); advance(s, 70);
    expect(s.events.some(e => e.type === 'warning' && e.message.includes('Zweite'))).toBe(true);
    expect(inflowAt(112)).toBeGreaterThan(inflowAt(70));
    expect(inflowAt(180)).toBeLessThan(inflowAt(112));
  });
  it('beschreibt die Dammöffnung auch bei Rückfluss ohne sichere Flutbehauptung', () => {
    for (const [seconds, receiver, direction] of [[0, null, 0], [30, 'tulln', 1], [170, 'r1', -1]] as const) {
      const s = running();
      advance(s, seconds);
      expect(getPreview(s, { kind: 'site', id: 'd1' })?.receiverId).toBe(receiver);
      expect(command(s, { type: 'breach', id: 'd1' })).toBe(true);
      const event = s.events.at(-1)!;
      expect(event.type).toBe('breach');
      expect(event.message).toContain('dauerhaft geöffnet');
      expect(event.message).not.toMatch(/flutet|wird zum Flutraum/i);
      step(s);
      expect(Math.sign(s.flows['site-d1'])).toBe(direction);
    }
  });
  it('erzeugt identische Zustände bei unterschiedlich portionierter Zeit', () => {
    const a = running(), b = running();
    command(a, { type: 'gate', id: 'g4', opening: .5 });
    command(b, { type: 'gate', id: 'g4', opening: .5 });
    advance(a, 60);
    for (let i = 0; i < 600; i++) advance(b, .1);
    expect(b).toEqual(a);
    expect(() => step(a, .1)).toThrow();
    expect(() => advance(a, -1)).toThrow();
    expect(() => advance(a, Infinity)).toThrow();
    expect(FIXED_DT).toBe(1 / 30);
  });
  it('startet nach Neustart mit identischem Zustand und ohne alten Teilzeitschritt', () => {
    const restarted = running();
    advance(restarted, .017);
    command(restarted, { type: 'reset' });
    const fresh = createGame();
    for (const state of [restarted, fresh]) {
      for (const targetId of ['b1', 'b2', 'b3']) command(state, { type: 'prepare', preparation: { kind: 'capacity', targetId } });
      command(state, { type: 'start' });
      command(state, { type: 'team', index: 0, townId: 'tulln' });
    }
    advance(restarted, 17.25);
    for (let i = 0; i < 69; i++) advance(fresh, .25);
    expect(restarted).toEqual(fresh);
  });
});

describe('Rettung und Wertung', () => {
  it('evakuiert schrittweise und behält gerettete Menschen nach Umverteilung', () => {
    const s = running(); command(s, { type: 'team', index: 0, townId: 'tulln' });
    advance(s, 10); const saved = node(s, 'tulln').rescued;
    expect(saved).toBeCloseTo(18);
    command(s, { type: 'team', index: 0, townId: 'korneuburg' });
    advance(s, 10);
    expect(node(s, 'tulln').rescued).toBe(saved);
    expect(node(s, 'korneuburg').rescued).toBeCloseTo(18);
    expect(command(s, { type: 'team', index: 2, townId: 'tulln' })).toBe(false);
    expect(command(s, { type: 'team', index: 0, townId: 'r1' })).toBe(false);
  });
  it('beschleunigt vorbereitete Evakuierung und überschreitet nie die Bevölkerung', () => {
    const s = createGame();
    for (const targetId of ['tulln', 'korneuburg', 'wien-nord']) command(s, { type: 'prepare', preparation: { kind: 'evacuation', targetId } });
    command(s, { type: 'start' });
    command(s, { type: 'team', index: 0, townId: 'tulln' });
    command(s, { type: 'team', index: 1, townId: 'tulln' });
    advance(s, 10); expect(node(s, 'tulln').rescued).toBeCloseTo(64);
    advance(s, 20); expect(node(s, 'tulln').rescued).toBe(90);
    expect(s.events.filter(e => e.type === 'rescue' && e.message.includes('vollständig'))).toHaveLength(1);
  });
  it('verursacht dauerhaften tiefen- und zeitabhängigen Sachschaden', () => {
    const shallow = running(), deep = running();
    node(shallow, 'tulln').volume = 55 * .3;
    node(deep, 'tulln').volume = 55 * .9;
    advance(shallow, 5); advance(deep, 5);
    expect(node(deep, 'tulln').damage).toBeGreaterThan(node(shallow, 'tulln').damage);
    expect(node(shallow, 'tulln').exposed).toBe(true);
    const damage = node(shallow, 'tulln').damage;
    node(shallow, 'tulln').volume = 0; advance(shallow, 1);
    expect(node(shallow, 'tulln').damage).toBe(damage);
    expect(node(shallow, 'tulln').exposed).toBe(true);
  });
  it('zählt sichere Einwohner nur einmal und priorisiert Menschen vor allen Sachwerten', () => {
    const s = running();
    const town = node(s, 'tulln'); town.exposed = true; town.rescued = 45;
    const r = getResult(s);
    expect(r.safe).toBe(565); expect(r.inNeed).toBe(45); expect(r.rescued).toBe(45);
    const propertyPerfect = r.score;
    town.rescued = 46;
    for (const n of s.nodes) n.damage = 1;
    expect(getResult(s).score).toBeGreaterThan(propertyPerfect);
  });
  it('friert das Ergebnis nach 180 Sekunden ein', () => {
    const s = running(); advance(s, 180); const snapshot = structuredClone(s);
    advance(s, 300); expect(s).toEqual(snapshot);
    expect(command(s, { type: 'breach', id: 'd1' })).toBe(false);
    expect(s.result).toEqual(snapshot.result);
  });
});
