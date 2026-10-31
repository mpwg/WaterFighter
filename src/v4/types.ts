export type Point = [number, number];
export interface Building {
  id: string; name: string; cells: number[]; polygons: Point[][];
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
  center: Point; area: number; value: number; zone: 'protected' | 'sacrifice';
}
export interface BarrierSegment {
  id: string; road: string; faces: [number, number][]; points: Point[]; center: Point; crestHeight: number;
}
export interface V4Map {
  schema: 'waterfighter-map/4'; width: number; height: number; cellSize: number;
  crs: 'EPSG:31256'; bounds: [number, number, number, number]; heights: number[];
  buildings: Building[]; roads: { id: string; name: string; points: Point[] }[];
  barrierSegments: BarrierSegment[]; sourceCells: number[];
  provenance: { imported: string; attribution: string; license: string;
    sources: { file: string; url: string; sha256: string }[]; terrain: string; fiction: string };
}
export type Phase = 'ready' | 'running' | 'paused' | 'finished';
export type GameCommand = { type: 'start' | 'pause' | 'resume' | 'reset' }
  | { type: 'placeBarrier' | 'removeBarrier'; segmentId: string }
  | { type: 'demolish'; buildingId: string };
export interface Audit { volume: number; inflow: number; outflow: number; initialVolume: number; balanceError: number }
export interface GameSnapshot {
  phase: Phase; time: number; points: number; floodDamage: number; demolitionDamage: number;
  barrierCharges: number; demolitionCharges: number; nextBarrierIn: number; nextDemolitionIn: number | null;
  barriers: string[]; demolished: string[]; buildingDamage: number[]; demolitionCosts: number[];
  depths: Float32Array; flowX: Float32Array; flowY: Float32Array; audit: Audit;
}
