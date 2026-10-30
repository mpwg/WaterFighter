import { describe, expect, it } from 'vitest';
import { advance, command, createGame, FIXED_DT } from '../src/core/game';
import type { GameState } from '../src/core/types';
const prepared = (): GameState => {
  const s = createGame();
  for (const targetId of ['d1', 'd2', 'd3']) command(s, { type: 'prepare', preparation: { kind: 'reinforce', targetId } });
  return s;
};

describe('Vorbereitung und Phasen', () => {
  it('verlangt genau drei gültige Maßnahmen und ermöglicht Abwahl', () => {
    const s = createGame();
    expect(command(s, { type: 'start' })).toBe(false);
    expect(command(s, { type: 'prepare', preparation: { kind: 'capacity', targetId: 'tulln' } })).toBe(false);
    for (const targetId of ['b1', 'b2', 'b3']) expect(command(s, { type: 'prepare', preparation: { kind: 'capacity', targetId } })).toBe(true);
    expect(command(s, { type: 'prepare', preparation: { kind: 'reinforce', targetId: 'd1' } })).toBe(false);
    expect(command(s, { type: 'prepare', preparation: { kind: 'capacity', targetId: 'b1' } })).toBe(true);
    expect(s.preparations).toHaveLength(2);
    command(s, { type: 'prepare', preparation: { kind: 'reinforce', targetId: 'd1' } });
    expect(command(s, { type: 'start' })).toBe(true);
    expect(command(s, { type: 'prepare', preparation: { kind: 'capacity', targetId: 'b2' } })).toBe(false);
  });
  it('sperrt alle Eingriffe in Pause und setzt alle Zustände bei Neustart zurück', () => {
    const s = prepared(); command(s, { type: 'start' }); advance(s, 10);
    command(s, { type: 'pause' }); const before = structuredClone(s);
    advance(s, 90); expect(s).toEqual(before);
    for (const c of [{ type: 'gate', id: 'g1', opening: 1 }, { type: 'build', id: 'd1' }, { type: 'breach', id: 'd1' }, { type: 'team', index: 0, townId: 'tulln' }] as const) expect(command(s, c)).toBe(false);
    expect(s.nodes).toEqual(before.nodes); expect(s.gates).toEqual(before.gates); expect(s.sites).toEqual(before.sites);
    command(s, { type: 'resume' }); advance(s, 1); expect(s.time).toBe(11);
    command(s, { type: 'reset' }); expect(s).toEqual(createGame());
  });
  it('nimmt Eingriffe nur in der passenden Phase an', () => {
    const actions = [
      { type: 'gate', id: 'g1', opening: 1 },
      { type: 'build', id: 'd1' },
      { type: 'breach', id: 'd1' },
      { type: 'team', index: 0, townId: 'tulln' },
    ] as const;
    const ready = createGame();
    for (const action of actions) expect(command(ready, action)).toBe(false);
    expect(command(ready, { type: 'start' })).toBe(false);

    const running = prepared();
    expect(command(running, { type: 'start' })).toBe(true);
    expect(command(running, { type: 'start' })).toBe(false);
    expect(command(running, { type: 'prepare', preparation: { kind: 'capacity', targetId: 'b1' } })).toBe(false);
    expect(command(running, { type: 'pause' })).toBe(true);
    expect(command(running, { type: 'pause' })).toBe(false);
    for (const action of actions) expect(command(running, action)).toBe(false);
    expect(command(running, { type: 'resume' })).toBe(true);
    expect(command(running, { type: 'resume' })).toBe(false);
    advance(running, 180);
    expect(running.phase).toBe('finished');
    for (const action of actions) expect(command(running, action)).toBe(false);
    expect(command(running, { type: 'start' })).toBe(false);
    expect(command(running, { type: 'prepare', preparation: { kind: 'capacity', targetId: 'b1' } })).toBe(false);
  });
});

describe('Notdämme und Öffnungen', () => {
  it('baut verzögert und begrenzt Baueinsätze auf zwei', () => {
    const s = prepared(); command(s, { type: 'start' });
    expect(command(s, { type: 'build', id: 'd1' })).toBe(true);
    expect(command(s, { type: 'build', id: 'd2' })).toBe(true);
    expect(command(s, { type: 'build', id: 'd3' })).toBe(false);
    advance(s, 2); expect(s.sites[0].built).toBe(false);
    advance(s, 1); expect(s.sites[0].built).toBe(true); expect(s.buildsLeft).toBe(0);
  });
  it('verweigert Bau bei zu hohem Pegel und verliert verspätete Baustellen', () => {
    const s = prepared(); command(s, { type: 'start' });
    const r = s.nodes.find(n => n.id === 'r1')!;
    r.volume = 100 * 6; r.depth = 6;
    expect(command(s, { type: 'build', id: 'd1' })).toBe(false);
    expect(s.buildsLeft).toBe(2);
    expect(command(s, { type: 'build', id: 'd3' })).toBe(true);
    const r4 = s.nodes.find(n => n.id === 'r4')!; r4.volume = 100 * 20; r4.depth = 20;
    advance(s, 3);
    expect(s.sites.find(x => x.id === 'd3')!.built).toBe(false);
    expect(s.events.some(e => e.message.includes('überholt'))).toBe(true);
  });
  it('wartet 1,2 Sekunden auf ein Wehr und weist Stellungs-Spam ab', () => {
    const s = prepared(); command(s, { type: 'start' });
    expect(command(s, { type: 'gate', id: 'g1', opening: 1 })).toBe(true);
    expect(command(s, { type: 'gate', id: 'g1', opening: .5 })).toBe(false);
    advance(s, 1.2 - FIXED_DT);
    expect(s.gates.find(g => g.id === 'g1')!.opening).toBe(0);
    expect(command(s, { type: 'gate', id: 'g1', opening: .5 })).toBe(false);
    advance(s, FIXED_DT);
    expect(s.gates.find(g => g.id === 'g1')!.opening).toBe(1);
    expect(command(s, { type: 'gate', id: 'g1', opening: .5 })).toBe(true);
  });
  it('öffnet dauerhaft und leitet sichtbar Wasser in die geopferte Gemeinde', () => {
    const closed = prepared(), opened = prepared();
    command(closed, { type: 'start' }); command(opened, { type: 'start' });
    expect(command(opened, { type: 'breach', id: 'd3' })).toBe(true);
    expect(command(opened, { type: 'breach', id: 'd3' })).toBe(false);
    expect(command(opened, { type: 'build', id: 'd3' })).toBe(false);
    advance(closed, 100); advance(opened, 100);
    expect(opened.nodes.find(n => n.id === 'wien-nord')!.volume).toBeGreaterThan(closed.nodes.find(n => n.id === 'wien-nord')!.volume);
    expect(opened.nodes.find(n => n.id === 'r4')!.depth).toBeLessThan(closed.nodes.find(n => n.id === 'r4')!.depth);
  });
});
