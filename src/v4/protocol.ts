import type {
  BarrierSegment,
  Building,
  GameCommand,
  GameSnapshot,
  Point,
  V4Map,
} from "./types";
export type Request =
  | { id: number; type: "init"; test: boolean }
  | { id: number; type: "command"; command: GameCommand }
  | { id: number; type: "advance"; seconds: number }
  | { id: number; type: "state" | "hidden" };
export type Reply =
  | { id: number; type: "ready"; map: V4Map; snapshot: GameSnapshot }
  | {
      id: number;
      type: "snapshot";
      snapshot: GameSnapshot;
      ok: boolean;
      reason?: string;
    }
  | { id: number; type: "error"; reason: string };
export function mapPosition(
  x: number,
  y: number,
  rect: { left: number; top: number; width: number; height: number },
  size: number,
): Point | null {
  const point: Point = [
    ((x - rect.left) / rect.width) * size,
    ((y - rect.top) / rect.height) * size,
  ];
  return point[0] >= 0 && point[1] >= 0 && point[0] < size && point[1] < size
    ? point
    : null;
}
const cellOwners = new WeakMap<V4Map, Map<number, Building>>();
export function buildingAt(map: V4Map, point: Point): Building | null {
  if (
    point[0] < 0 ||
    point[1] < 0 ||
    point[0] >= map.width * map.cellSize ||
    point[1] >= map.height * map.cellSize
  )
    return null;
  let owners = cellOwners.get(map);
  if (!owners) {
    owners = new Map();
    for (const b of map.buildings) for (const i of b.cells) owners.set(i, b);
    cellOwners.set(map, owners);
  }
  return (
    owners.get(
      Math.floor(point[1] / map.cellSize) * map.width +
        Math.floor(point[0] / map.cellSize),
    ) ?? null
  );
}
function distance(point: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    l = dx * dx + dy * dy;
  const t = l
    ? Math.max(
        0,
        Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / l),
      )
    : 0;
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
}
export function barrierAt(
  map: V4Map,
  point: Point,
  tolerance: number,
  placed: Set<string>,
): BarrierSegment | null {
  let match: BarrierSegment | null = null,
    best = tolerance;
  // Existing barriers win over overlapping placement candidates.
  for (const active of [true, false]) {
    for (const s of map.barrierSegments) {
      if (placed.has(s.id) !== active) continue;
      let d = Infinity;
      for (let i = 1; i < s.points.length; i++)
        d = Math.min(d, distance(point, s.points[i - 1], s.points[i]));
      if (d <= best) {
        best = d;
        match = s;
      }
    }
    if (match) return match;
  }
  return null;
}
export function barrierAllowed(
  map: V4Map,
  id: string,
  placed: Set<string>,
): boolean {
  const segment = map.barrierSegments.find((s) => s.id === id);
  if (!segment || placed.has(id)) return false;
  const faces = new Set(segment.faces.map(([a, b]) => `${a}:${b}`));
  return !map.barrierSegments.some(
    (s) => placed.has(s.id) && s.faces.some(([a, b]) => faces.has(`${a}:${b}`)),
  );
}
