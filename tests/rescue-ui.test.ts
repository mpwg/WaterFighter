import { expect, it } from 'vitest';
import { createGame, snapshotGame } from '../src/flood/game';
import { createTerrain } from '../src/flood/terrain';
import { rescueState, rescueFeedback } from '../src/rescue-ui';
it('uses only snapshot rescue progress and completed building truth', () => {
  const s = snapshotGame(createGame(createTerrain()));
  const id = s.buildings[0].buildingId;
  expect(rescueState(s,id).status).toBe('idle');
  s.rescues.push({ buildingId:id, elapsed:3, status:'active' });
  expect(rescueState(s,id)).toEqual({status:'active',progress:.5,label:'↗ 3s'});
  s.phase='paused';
  expect(rescueFeedback(s,id)).toBe('Rettung pausiert · noch 3s');
  expect(rescueFeedback(s,-1)).toBe('Pause · Rettung nach dem Fortsetzen starten.');
  s.buildings[0].rescued=true;
  expect(rescueState(s,id).status).toBe('complete');
  expect(rescueFeedback(s,id)).toContain('bereits gerettet');
});
