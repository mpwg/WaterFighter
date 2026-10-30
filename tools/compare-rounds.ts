import { advance, command, createGame } from '../src/core/game';
import type { Command, GameState } from '../src/core/types';

type Strategy = { name: string; interventions: (state: GameState) => Command[] };

const preparation = [
  { kind: 'capacity', targetId: 'b1' },
  { kind: 'capacity', targetId: 'b2' },
  { kind: 'capacity', targetId: 'b3' },
] as const;
const at = (time: number, state: GameState, commands: Command[]) => Math.abs(state.time - time) < 1e-6 ? commands : [];

const strategies: Strategy[] = [
  { name: 'Ohne Eingriff', interventions: () => [] },
  { name: 'Alle Wehre offen', interventions: s => at(0, s, s.gates.map(g => ({ type: 'gate', id: g.id, opening: 1 } as const))) },
  { name: 'Alle Wehre geschlossen', interventions: s => at(0, s, s.gates.map(g => ({ type: 'gate', id: g.id, opening: 0 } as const))) },
  {
    name: 'Rettung Tulln + Korneuburg',
    interventions: s => at(0, s, [
      { type: 'team', index: 0, townId: 'tulln' },
      { type: 'team', index: 1, townId: 'korneuburg' },
    ]),
  },
  {
    name: 'Dammöffnung Wien Nord bei 52 s',
    interventions: s => at(52, s, [{ type: 'breach', id: 'd3' }]),
  },
  {
    name: 'Gezielte Rettung + Öffnung bei 88 s',
    interventions: s => [
      ...at(0, s, [
        { type: 'team', index: 0, townId: 'wien-nord' },
        { type: 'team', index: 1, townId: 'wien-zentrum' },
      ]),
      ...at(88, s, [{ type: 'breach', id: 'd4' }]),
    ],
  },
];

function run(strategy: Strategy) {
  const s = createGame();
  for (const p of preparation) command(s, { type: 'prepare', preparation: p });
  command(s, { type: 'start' });
  while (s.phase === 'running') {
    for (const c of strategy.interventions(s)) command(s, c);
    advance(s, 1);
  }
  const stored = s.nodes.reduce((sum, n) => sum + n.volume, 0);
  const massError = Math.abs(stored - s.initialVolume - s.totalIn + s.totalOut);
  return {
    strategy: strategy.name,
    safe: s.result!.safe,
    rescued: s.result!.rescued,
    inNeed: s.result!.inNeed,
    damage: Number(s.result!.damage.toFixed(3)),
    massError: Number(massError.toExponential(3)),
  };
}

console.table(strategies.map(run));
