import { describe, expect, it } from 'vitest';
import { advance, command, createGame, step } from '../src/core/game';
import { DEVICES, MAX_TIME, SLOTS, WAVES } from '../src/core/arena';
import type { DeviceKind, Flood } from '../src/core/types';

function running() {
  const state = createGame();
  command(state, { type: 'start' });
  return state;
}

function fire(kind: DeviceKind, level: 1 | 2, progress = 0.2) {
  const state = running();
  command(state, { type: 'build', slotId: SLOTS[0].id, kind });
  if (level === 2) {
    state.energy = 250;
    command(state, { type: 'upgrade', slotId: SLOTS[0].id });
  }
  const flood: Flood = {
    id: 'target', waveId: 99, routeId: SLOTS[0].routeId, progress,
    strength: 10, maxStrength: 10, speed: 0.1, length: 0.05,
    frozenUntil: 0, pushedAt: -1, spawnedAt: 0,
  };
  state.floods.push(flood);
  step(state);
  return { state, flood };
}

describe('Arcade-Core: Randbedingungen', () => {
  it('regeneriert passiv zwei Energie pro Sekunde', () => {
    const state = running();
    advance(state, 1);
    expect(state.energy).toBeCloseTo(102, 8);
  });

  it('gibt für jeden abgeschlossenen Wellenabschnitt genau einmal 35 Energie', () => {
    const state = running();
    // Eine starke Pumpe am Eintritt beendet die erste Flut zuverlässig vor dem Zeitlimit.
    command(state, { type: 'build', slotId: SLOTS[0].id, kind: 'pump' });
    while (!state.completedWaves.includes(WAVES[0].id) && state.phase === 'running') step(state);
    const clear = state.events.find(event => event.type === 'wave-clear');
    expect(clear).toBeDefined();
    expect(state.completedWaves.filter(id => id === WAVES[0].id)).toHaveLength(1);
    // Startkauf 50, passive Energie 2/s, Abschlussbonus 35.
    expect(state.energy).toBeCloseTo(100 - DEVICES.pump.cost + state.time * 2 + 35, 5);
  });

  it('hält Bau, Ausbau und Boot während der Pause gesperrt', () => {
    const state = running();
    command(state, { type: 'build', slotId: SLOTS[0].id, kind: 'pump' });
    const energy = state.energy;
    command(state, { type: 'pause' });
    expect(command(state, { type: 'upgrade', slotId: SLOTS[0].id })).toBe(false);
    expect(command(state, { type: 'build', slotId: SLOTS[1].id, kind: 'cannon' })).toBe(false);
    expect(command(state, { type: 'ability', kind: 'boat', houseId: state.houses[0].id })).toBe(false);
    expect(state.energy).toBe(energy);
    expect(state.devices).toHaveLength(1);
    expect(state.phase).toBe('paused');
  });

  it('wertet evakuierte Bewohner auch bei zerstörten Häusern als sicher', () => {
    const state = running();
    for (const house of state.houses) house.health = 0;
    for (const house of state.houses.slice(0, 3)) {
      house.evacuated = true;
    }
    state.completedWaves = WAVES.map(wave => wave.id);
    step(state);
    expect(state.safeResidents).toBe(12);
    expect(state.phase).toBe('won');
  });

  it('beendet spätestens bei 180 Sekunden und zählt die Endsekunde mit', () => {
    const state = running();
    // Ein künstlich intakter Spielstand verhindert den früheren Abbruch durch Bewohnerverlust.
    for (const house of state.houses) {
      house.health = 3;
      house.routeId = 'isolated';
    }
    state.floods.push({ id: 'limit-probe', waveId: 5, routeId: 'isolated', progress: 0, strength: 1,
      maxStrength: 1, speed: 0, length: 2, frozenUntil: 0, pushedAt: -1, spawnedAt: 0 });
    state.completedWaves = [];
    advance(state, MAX_TIME + 1);
    expect(state.time).toBeLessThanOrEqual(MAX_TIME);
    expect(state.phase).not.toBe('running');
    expect(state.time).toBeCloseTo(MAX_TIME, 5);
  });

  it('setzt nach Reset auch Teilzeitschritt und Cooldowns zurück', () => {
    const state = running();
    state.cooldowns.boat = 99;
    advance(state, 1 / 60);
    command(state, { type: 'reset' });
    command(state, { type: 'start' });
    advance(state, 0.5);
    expect(state.time).toBeCloseTo(0.5, 8);
    expect(state.cooldowns).toEqual({ cushion: 0, boat: 0 });
  });

  it('macht den Gefrier-Ausbau durch stärkere Verlangsamung wirksamer', () => {
    expect(DEVICES.freeze.upgradedRange).toBeGreaterThan(DEVICES.freeze.range);
    expect(DEVICES.freeze.upgradedPower).toBeLessThan(DEVICES.freeze.power);
    // `power` ist beim Gefriergerät der verbleibende Geschwindigkeitsanteil.
    expect(DEVICES.freeze.upgradedPower).toBeGreaterThan(0);
  });

  it('alle Geräteausbauten verbessern Wirkung oder Reichweite', () => {
    const pump1 = fire('pump', 1).flood;
    const pump2 = fire('pump', 2).flood;
    expect(10 - pump2.strength).toBeGreaterThan(10 - pump1.strength);
    expect(fire('pump', 1, 0.39).state.events.some(event => event.type === 'pump')).toBe(false);
    expect(fire('pump', 2, 0.39).state.events.some(event => event.type === 'pump')).toBe(true);

    const cannon1 = fire('cannon', 1).flood;
    const cannon2 = fire('cannon', 2).flood;
    expect(0.2 - cannon2.progress).toBeGreaterThan(0.2 - cannon1.progress);
    expect(cannon2.strength).toBe(10);

    const freeze1 = fire('freeze', 1);
    const freeze2 = fire('freeze', 2);
    expect(freeze2.flood.frozenFactor).toBeLessThan(freeze1.flood.frozenFactor!);
    expect(fire('freeze', 1, 0.4).state.events.some(event => event.type === 'freeze')).toBe(false);
    expect(fire('freeze', 2, 0.4).state.events.some(event => event.type === 'freeze')).toBe(true);
  });

  it('Wasserwerfer trifft die vorderste erreichbare Flut ohne Stärke abzuziehen', () => {
    const state = running();
    command(state, { type: 'build', slotId: SLOTS[0].id, kind: 'cannon' });
    const makeFlood = (id: string, progress: number): Flood => ({ id, waveId: 99, routeId: SLOTS[0].routeId,
      progress, strength: 10, maxStrength: 10, speed: 0, length: 0.05, frozenUntil: 0, pushedAt: -1, spawnedAt: 0 });
    const rear = makeFlood('rear', 0.2);
    const front = makeFlood('front', 0.25);
    state.floods.push(rear, front);
    step(state);
    expect(front.pushedAt).toBeGreaterThan(0);
    expect(rear.pushedAt).toBe(-1);
    expect(front.strength).toBe(front.maxStrength);
  });
});
