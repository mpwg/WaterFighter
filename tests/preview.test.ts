import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game';
import type { GameState } from '../src/core/types';
import { getPreview } from '../src/render/preview';

function depth(state: GameState, id: string, value: number): void {
  state.nodes.find(node => node.id === id)!.depth = value;
}

describe('Empfängervorschau', () => {
  it('zeigt bei einem geschlossenen Wehr nach hypothetischer Öffnung den tieferen Empfänger', () => {
    const state = createGame();
    depth(state, 'r2', 1);

    expect(state.gates.find(gate => gate.id === 'g1')?.opening).toBe(0);
    expect(getPreview(state, { kind: 'gate', id: 'g1' })).toMatchObject({ link: { id: 'g1' }, receiverId: 'b1' });
  });

  it('kehrt den Empfänger bei umgekehrtem Gefälle um', () => {
    const state = createGame();
    depth(state, 'b1', 2);

    expect(getPreview(state, { kind: 'gate', id: 'g1' })?.receiverId).toBe('r2');
  });

  it('meldet bei gleichem effektivem Pegel keinen Fluss', () => {
    const state = createGame();
    depth(state, 'r2', .4);
    depth(state, 'b1', 1.1);

    expect(getPreview(state, { kind: 'gate', id: 'g1' })?.receiverId).toBeNull();
  });

  it('verwendet bei einer Dammstelle die abgesenkte Sohle des geöffneten Pfads', () => {
    const state = createGame();
    depth(state, 'r1', 1.3); // 3.8 m head: below the intact 4.4 m sill, above the breach sill.

    expect(getPreview(state, { kind: 'site', id: 'd1' })).toMatchObject({ link: { id: 'site-d1' }, receiverId: 'tulln' });
  });
});
