import type { Snapshot } from "./flood/types";
export function rescueState(snapshot: Snapshot, buildingId: number) {
  const rescue = snapshot.rescues.find(r => r.buildingId === buildingId);
  if (snapshot.buildings.find(b => b.buildingId === buildingId)?.rescued || rescue?.status === 'complete')
    return { status: 'complete', progress: 1, label: '✓ Gerettet' };
  if (rescue) {
    const progress = Math.min(1, Math.max(0, rescue.elapsed / 6));
    return { status: 'active', progress, label: `${snapshot.phase === 'paused' ? 'Ⅱ' : '↗'} ${Math.ceil(6 * (1 - progress))}s` };
  }
  return { status: 'idle', progress: 0, label: '' };
}
export function rescueFeedback(snapshot: Snapshot, buildingId: number) {
  const state = rescueState(snapshot, buildingId);
  if (state.status === 'complete') return 'Bewohner dieses Hauses sind bereits gerettet.';
  if (snapshot.phase === 'finished') return 'Die Hochwasserrunde ist beendet.';
  if (snapshot.phase === 'paused') return state.status === 'active'
    ? `Rettung pausiert · noch ${state.label.slice(2)}`
    : 'Pause · Rettung nach dem Fortsetzen starten.';
  return state.status === 'active' ? `Rettung läuft · noch ${state.label.slice(2)}` : 'Für dieses Haus läuft keine Rettung.';
}
