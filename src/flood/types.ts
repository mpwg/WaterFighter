/** Grid coordinates are cell coordinates; heights/depths are metres, time is seconds. */
export interface Point {
  x: number;
  y: number
}
export interface Building {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  people: number
}
export interface Gate {
  id: number;
  a: number;
  b: number;
  x: number;
  y: number;
  sill: number;
  edges?: {
    a:number;
    b:number
  }[]
}
export interface Terrain {
  width: number;
  height: number;
  cellSize: number;
  heights: Float64Array;
  obstacles: Uint8Array;
  river: Uint8Array;
  buildings: Building[];
  gates: Gate[]
}
export interface Accounting {
  initial: number;
  inflow: number;
  outflow: number;
  volume: number;
  error: number
}
export interface Simulation {
  terrain: Terrain;
  depths: Float64Array;
  time: number;
  sills: Map<string,number>;
  accounting: Accounting;
  delta: Float64Array;
  outgoing: Float64Array;
  fluxX: Float64Array;
  fluxY: Float64Array;
  sillX: Float64Array;
  sillY: Float64Array
}
export type Phase = 'running' | 'paused' | 'finished';
export interface Barrier {
  key: string;
  a: number;
  b: number;
  x: number;
  y: number;
  height: number;
  progress: number;
  status: 'queued'|'building'|'ready';
  cost: number
}
export interface Rescue {
  buildingId: number;
  elapsed: number;
  status: 'active'|'complete'
}
export interface BuildingState {
  buildingId: number;
  damage: number;
  depth: number;
  peakDepth: number;
  rescued: boolean
}
export interface Results {
  rescued: number;
  totalPeople: number;
  safePeople: number;
  threatenedPeople: number;
  damagedBuildings: number;
  meanDamage: number
}
export interface Game {
  terrain: Terrain;
  simulation: Simulation;
  time: number;
  phase: Phase;
  resources: number;
  barriers: Map<string,Barrier>;
  rescues: Map<number,Rescue>;
  buildings: BuildingState[];
  rescued: number;
  gateOpen: Record<number,boolean>
}
export interface Snapshot {
  width: number;
  height: number;
  cellSize: number;
  depths: Float32Array;
  time: number;
  duration: number;
  phase: Phase;
  resources: number;
  barriers: Barrier[];
  rescues: Rescue[];
  buildings: BuildingState[];
  gates: {
    id:number;
    open:boolean
  }[];
  accounting: Accounting;
  results: Results
}
export type Command = {
  type:'barrier'|'remove';
  points:Point[]
} | {
  type:'rescue';
  buildingId:number
} | {
  type:'gate';
  gateId:number;
  open:boolean
} | {
  type:'pause'
} | {
  type:'resume'
} | {
  type:'reset'
};
export interface CommandResult {
  ok:boolean;
  reason?:string;
  changed?:number
}
