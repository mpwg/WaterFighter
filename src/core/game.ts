import { SCENARIO } from './arena';
import type { Command, GameEvent, GameState, Preparation, Result, WaterNodeSpec } from './types';

export const FIXED_DT = 1 / 30;
const remainders = new WeakMap<GameState, number>();
const specs = new Map(SCENARIO.nodes.map(n => [n.id, n]));
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const prepared = (s: GameState, kind: Preparation['kind'], id: string) => s.preparations.some(p => p.kind === kind && p.targetId === id);
const storageArea = (s: GameState, n: WaterNodeSpec) => n.area * (prepared(s, 'capacity', n.id) ? 1.75 : 1);
const head = (s: GameState, id: string) => specs.get(id)!.floor + s.nodes.find(n => n.id === id)!.depth;
function emit(s: GameState, type: GameEvent['type'], message: string, targetId?: string) {
  s.events.push({ id: s.nextEventId++, time: s.time, type, message, targetId });
  if (s.events.length > 120) s.events.shift();
}
function depths(s: GameState) { for (const n of s.nodes) n.depth = n.volume / storageArea(s, specs.get(n.id)!); }
function sill(s: GameState, linkId: string): number {
  const l = SCENARIO.links.find(l => l.id === linkId)!;
  const site = SCENARIO.sites.find(site => site.linkId === linkId);
  if (!site) return l.sill;
  const state = s.sites.find(x => x.id === site.id)!;
  if (state.breached) return Math.max(specs.get(l.from)!.floor, specs.get(l.to)!.floor) + .05;
  return l.sill + (state.built ? .8 : 0) + (prepared(s, 'reinforce', site.id) ? .75 : 0);
}

/** Stylized hydrograph: initial crest, a second announced pulse, then recession. */
export function inflowAt(time: number): number {
  const keys = [[0, 6], [8, 6], [30, 32], [52, 38], [70, 23], [88, 27], [112, 45], [128, 35], [154, 7], [180, 6]];
  for (let i = 1; i < keys.length; i++) {
    if (time <= keys[i][0]) {
      const [a, av] = keys[i - 1], [b, bv] = keys[i];
      return av + (bv - av) * clamp((time - a) / (b - a), 0, 1);
    }
  }
  return 6;
}

export function createGame(): GameState {
  const nodes = SCENARIO.nodes.map(n => ({ id: n.id, volume: n.area * n.initialDepth, depth: n.initialDepth, damage: 0, rescued: 0, exposed: false }));
  return {
    scenarioId: 'hq100', phase: 'ready', tick: 0, time: 0, nodes,
    gates: SCENARIO.links.filter(l => l.kind === 'gate').map(l => ({ id: l.id, opening: 0, target: 0, readyAt: 0 })),
    sites: SCENARIO.sites.map(site => ({ id: site.id, built: false, buildingUntil: null, breached: false })),
    preparations: [], teams: [null, null], buildsLeft: 2, events: [], nextEventId: 1,
    totalIn: 0, totalOut: 0, initialVolume: nodes.reduce((sum, n) => sum + n.volume, 0), flows: {}, result: null, lastError: null,
  };
}

export function command(s: GameState, c: Command): boolean {
  const fail = (message: string) => { s.lastError = message; return false; };
  const success = () => { s.lastError = null; return true; };
  if (c.type === 'reset') { Object.assign(s, createGame()); remainders.delete(s); return true; }
  if (c.type === 'prepare') {
    if (s.phase !== 'ready') return fail('Vorbereitung ist nur vor der Flut möglich.');
    const p = c.preparation;
    const valid = p.kind === 'reinforce' ? SCENARIO.sites.some(x => x.id === p.targetId) : specs.get(p.targetId)?.kind === (p.kind === 'capacity' ? 'basin' : p.kind === 'evacuation' ? 'town' : 'invalid');
    if (!valid) return fail('Diese Maßnahme passt nicht zu diesem Ort.');
    const i = s.preparations.findIndex(x => x.kind === p.kind && x.targetId === p.targetId);
    if (i >= 0) s.preparations.splice(i, 1);
    else { if (s.preparations.length >= 3) return fail('Drei Maßnahmen sind gewählt. Wähle zuerst eine ab.'); s.preparations.push({ ...p }); }
    depths(s); return success();
  }
  if (c.type === 'start') {
    if (s.phase !== 'ready') return fail('Der Einsatz läuft bereits.');
    if (s.preparations.length !== 3) return fail('Wähle vor dem Start genau drei Maßnahmen.');
    s.phase = 'running'; emit(s, 'warning', 'Die Flut steigt. Erste Spitze bei 0:52.'); return success();
  }
  if (c.type === 'pause') { if (s.phase !== 'running') return false; s.phase = 'paused'; return success(); }
  if (c.type === 'resume') { if (s.phase !== 'paused') return false; s.phase = 'running'; return success(); }
  if (s.phase !== 'running') return fail('Eingriffe sind nur während des laufenden Einsatzes möglich.');
  if (c.type === 'gate') {
    const g = s.gates.find(g => g.id === c.id);
    if (!g || ![0, .5, 1].includes(c.opening)) return fail('Unbekanntes Wehr oder ungültige Stellung.');
    if (g.readyAt > s.time) return fail('Das Wehr verstellt sich noch.');
    if (g.opening === c.opening) return fail('Das Wehr steht bereits so.');
    g.target = c.opening; g.readyAt = s.time + 1.2;
    emit(s, 'gate', `${SCENARIO.links.find(l => l.id === g.id)!.name}: ${c.opening === 0 ? 'schließt' : c.opening === .5 ? 'öffnet halb' : 'öffnet'}.`, g.id);
  } else if (c.type === 'build' || c.type === 'breach') {
    const site = s.sites.find(x => x.id === c.id), spec = SCENARIO.sites.find(x => x.id === c.id);
    if (!site || !spec) return fail('Unbekannte Dammstelle.');
    const edge = SCENARIO.links.find(l => l.id === spec.linkId)!;
    if (site.breached) return fail('Diese Dammöffnung ist dauerhaft.');
    if (site.buildingUntil !== null) return fail('Hier wird bereits gebaut.');
    if (c.type === 'build') {
      if (site.built) return fail('Dieser Notdamm steht bereits.');
      if (!s.buildsLeft) return fail('Beide Baueinsätze sind verbraucht.');
      if (Math.max(head(s, edge.from), head(s, edge.to)) >= sill(s, edge.id) - .1) return fail('Der Pegel ist für einen Notdamm bereits zu hoch.');
      site.buildingUntil = s.time + 3; s.buildsLeft--;
      emit(s, 'build', `${spec.name}: Notdamm wird gebaut.`, site.id);
    } else {
      site.breached = true; site.built = false;
      emit(s, 'breach', `${spec.name} dauerhaft geöffnet.`, site.id);
    }
  } else if (c.type === 'team') {
    if (!Number.isInteger(c.index) || c.index < 0 || c.index > 1 || (c.townId !== null && specs.get(c.townId)?.kind !== 'town')) return fail('Ungültiges Rettungsziel.');
    if (s.teams[c.index] === c.townId) return fail('Das Team ist bereits dort.');
    s.teams[c.index] = c.townId;
    emit(s, 'rescue', c.townId ? `Team ${c.index + 1} evakuiert ${specs.get(c.townId)!.name}.` : `Team ${c.index + 1} ist frei.`, c.townId ?? undefined);
  }
  return success();
}

export function getResult(s: GameState): Result {
  let safe = 0, rescued = 0, total = 0, damage = 0, assets = 0;
  for (const n of s.nodes) {
    const spec = specs.get(n.id)!;
    if (spec.kind !== 'town') continue;
    const count = Math.min(spec.residents, Math.floor(n.rescued + 1e-7));
    rescued += count; safe += n.exposed ? count : spec.residents; total += spec.residents;
    damage += spec.assetValue * n.damage; assets += spec.assetValue;
  }
  const preserved = Math.max(0, assets - damage);
  return { safe, rescued, inNeed: total - safe, total, damage, preserved, score: safe * 1_000_000 + Math.floor(preserved / assets * 999_999) };
}

export function step(s: GameState, dt = FIXED_DT): void {
  if (dt !== FIXED_DT) throw new Error('step benötigt den festen Zeitschritt 1/30.');
  if (s.phase !== 'running') return;
  s.tick++; s.time = s.tick * FIXED_DT;
  for (const g of s.gates) if (g.readyAt <= s.time) g.opening = g.target;
  for (const site of s.sites) if (site.buildingUntil !== null && site.buildingUntil <= s.time + 1e-8) {
    const spec = SCENARIO.sites.find(x => x.id === site.id)!, edge = SCENARIO.links.find(l => l.id === spec.linkId)!;
    site.buildingUntil = null;
    if (Math.max(head(s, edge.from), head(s, edge.to)) < sill(s, edge.id)) {
      site.built = true; emit(s, 'build', `${spec.name}: Notdamm fertig.`, site.id);
    } else emit(s, 'warning', `${spec.name}: Bau von der Flut überholt.`, site.id);
  }
  if (s.tick === 30 * 70) emit(s, 'warning', 'Zweite Flutspitze angekündigt: Scheitel bei 1:52. Rückhalteräume prüfen!');
  if (s.tick === 30 * 128) emit(s, 'warning', 'Der Zufluss geht zurück. Wasser in den Gemeinden bleibt gefährlich.');

  const input = inflowAt(s.time) * dt;
  s.nodes.find(n => n.id === SCENARIO.inletId)!.volume += input; s.totalIn += input;
  depths(s);
  const byId = new Map(s.nodes.map(n => [n.id, n]));
  const transfers: { id: string; from: string; to: string | null; amount: number; sign: number }[] = [];
  for (const edge of SCENARIO.links) {
    const threshold = sill(s, edge.id);
    const delta = Math.max(head(s, edge.from), threshold) - Math.max(head(s, edge.to), threshold);
    const opening = edge.kind === 'gate' ? s.gates.find(g => g.id === edge.id)!.opening : 1;
    const amount = Math.min(edge.maxFlow, Math.abs(delta) * edge.conductance) * opening * dt;
    transfers.push({ id: edge.id, from: delta >= 0 ? edge.from : edge.to, to: delta >= 0 ? edge.to : edge.from, amount, sign: delta >= 0 ? 1 : -1 });
  }
  const outlet = byId.get(SCENARIO.outletId)!;
  transfers.push({ id: 'outlet', from: outlet.id, to: null, amount: Math.min(22, Math.max(0, outlet.depth - .4) * 15) * dt, sign: 1 });
  const requested = new Map<string, number>();
  for (const t of transfers) requested.set(t.from, (requested.get(t.from) ?? 0) + t.amount);
  for (const t of transfers) {
    const donor = byId.get(t.from)!;
    // Scale every outgoing transfer using the same pre-transfer volume.
    const available = s.nodes.find(n => n.id === t.from)!.volume;
    const amount = t.amount * Math.min(1, available / Math.max(requested.get(t.from)!, 1e-12));
    t.amount = amount;
  }
  for (const t of transfers) {
    byId.get(t.from)!.volume -= t.amount;
    if (t.to) byId.get(t.to)!.volume += t.amount; else s.totalOut += t.amount;
    s.flows[t.id] = t.sign * t.amount / dt;
  }
  depths(s);
  for (const n of s.nodes) {
    const spec = specs.get(n.id)!;
    if (spec.kind !== 'town') continue;
    if (n.depth > .18 && !n.exposed) { n.exposed = true; emit(s, 'flood', `${spec.name} wird überflutet. Menschen evakuieren!`, n.id); }
    n.damage = clamp(n.damage + Math.max(0, n.depth - .05) * dt / 100, 0, 1);
    const teams = s.teams.filter(id => id === n.id).length;
    if (teams && n.rescued < spec.residents) {
      n.rescued = Math.min(spec.residents, n.rescued + teams * (prepared(s, 'evacuation', n.id) ? 3.2 : 1.8) * dt);
      if (n.rescued === spec.residents) emit(s, 'rescue', `${spec.name} vollständig evakuiert. Team neu einsetzen!`, n.id);
    }
  }
  if (s.time >= SCENARIO.duration) { s.phase = 'finished'; s.result = getResult(s); emit(s, 'finish', `${s.result.safe} von ${s.result.total} Menschen sicher. Einsatz beendet.`); }
}

export function advance(s: GameState, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Ungültige Zeitspanne.');
  if (s.phase !== 'running') return;
  let rest = (remainders.get(s) ?? 0) + seconds;
  const ticks = Math.floor((rest + 1e-9) / FIXED_DT); rest -= ticks * FIXED_DT;
  remainders.set(s, Math.max(0, rest));
  for (let i = 0; i < ticks && s.phase === 'running'; i++) step(s);
}
