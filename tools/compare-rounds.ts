import { advance, command, createGame } from '../src/core/game';
import { DEVICES, MAX_TIME, SLOTS } from '../src/core/arena';
import type { AbilityKind, DeviceKind, GameState } from '../src/core/types';

const plans: { name: string; kinds: DeviceKind[]; rescueAfterBreach?: boolean }[] = [
  { name: 'Nichtstun', kinds: [] },
  { name: 'Pumpe only', kinds: ['pump'] },
  { name: 'Freeze only', kinds: ['freeze'] },
  { name: 'Cannon only', kinds: ['cannon'] },
  { name: 'Pumpe/Freeze/Pumpe', kinds: ['pump', 'freeze', 'pump'] },
  { name: 'Pumpe/Freeze/Cannon', kinds: ['pump', 'freeze', 'cannon'] },
  { name: 'Pumpe/Freeze/Cannon + Rettung', kinds: ['pump', 'freeze', 'cannon'], rescueAfterBreach: true },
];

type Result = { name: string; time: number; energy: number; spent: number; bought: number; safe: number; score: number; phase: string; waves: number };

function rescueOneThreatened(state: GameState) {
  if (state.cooldowns.boat > state.time) return;
  const house = state.houses.find(item => item.threatened && !item.evacuated && item.evacuationAt === null && item.health > 0);
  if (house) command(state, { type: 'ability', kind: 'boat' as AbilityKind, houseId: house.id });
}

function play(plan: typeof plans[number]): Result {
  const state = createGame();
  command(state, { type: 'start' });
  let spent = 0;
  let second = 0;
  while (state.phase === 'running' && state.time < MAX_TIME) {
    // Each integer second, inspect slots in fixed order and buy the first affordable planned item.
    for (let slotIndex = 0; slotIndex < SLOTS.length; slotIndex++) {
      const slot = SLOTS[slotIndex];
      if (state.devices.some(device => device.slotId === slot.id)) continue;
      if (!plan.kinds.length) break;
      const kind = plan.kinds[slotIndex % plan.kinds.length];
      if (command(state, { type: 'build', slotId: slot.id, kind })) spent += DEVICES[kind].cost;
    }
    if (plan.rescueAfterBreach) rescueOneThreatened(state);
    advance(state, Math.min(1, MAX_TIME - state.time));
    second++;
    if (second > MAX_TIME + 1) throw new Error(`Zeitbudget überschritten: ${plan.name}`);
  }
  return { name: plan.name, time: state.time, energy: state.energy, spent, bought: state.devices.length, safe: state.safeResidents, score: state.score, phase: state.phase, waves: state.completedWaves.length };
}

const results = plans.map(play);
console.log('| Strategie | Zeit (s) | Restenergie | Ausgaben | Geräte | Sicher (von 24) | Punkte | Wellen | Ende |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---|');
for (const row of results) {
  console.log(`| ${row.name} | ${row.time.toFixed(2)} | ${row.energy.toFixed(1)} | ${row.spent} | ${row.bought} | ${row.safe} | ${row.score} | ${row.waves}/5 | ${row.phase} |`);
}
