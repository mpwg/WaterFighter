import type { V4Map } from './types';
/** All coordinates are local metres: east/right, south/down. Bounds remain projected EPSG:31256. */
export function validateMap(value: unknown): V4Map {
  const map = value as V4Map;
  if (!map || map.schema !== 'waterfighter-map/4' || !Number.isInteger(map.width) || !Number.isInteger(map.height)
    || map.width < 1 || map.height < 1 || !(map.cellSize > 0) || map.heights?.length !== map.width * map.height
    || !map.heights.every(Number.isFinite) || !Array.isArray(map.buildings) || !Array.isArray(map.barrierSegments)) {
    throw new Error('Ungültige V4-Karte: vollständige amtliche Höhendaten erforderlich.');
  }
  const size = map.width * map.height;
  const occupied = new Set<number>();
  for (const b of map.buildings) for (const cell of b.cells) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= size) throw new Error('Ungültige Gebäudezelle');
    occupied.add(cell);
  }
  for (const s of map.barrierSegments) for (const [a,b] of s.faces) {
    if (!(a >= 0 && b < size && (b - a === map.width || (b-a === 1 && Math.floor(a/map.width)===Math.floor(b/map.width))))
      || occupied.has(a) || occupied.has(b)) throw new Error('Ungültige Barrierenkante');
  }
  return map;
}
export async function loadMap(url = '/v4/map.json'): Promise<V4Map> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Karte konnte nicht geladen werden (${response.status}).`);
  return validateMap(await response.json());
}
