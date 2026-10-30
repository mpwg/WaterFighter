/** V3 scenario contract. Coordinates are in a 1000 × 680 map. */
export type Point = { x: number; y: number };
export type NodeKind = 'river' | 'basin' | 'town';
export type WaterNodeSpec = { id: string; name: string; kind: NodeKind; position: Point; polygon: Point[]; area: number; floor: number; initialDepth: number; capacityDepth: number; residents: number; assetValue: number };
export type LinkSpec = { id: string; from: string; to: string; sill: number; conductance: number; maxFlow: number; kind: 'river' | 'gate' | 'spill' | 'breach'; name: string; position: Point };
export type SiteSpec = { id: string; name: string; linkId: string; position: Point; receiverId: string };
export type Scenario = { version: 3; id: 'hq100'; name: string; duration: number; nodes: WaterNodeSpec[]; links: LinkSpec[]; sites: SiteSpec[]; inletId: string; outletId: string };
export type Preparation = { kind: 'reinforce' | 'capacity' | 'evacuation'; targetId: string };
export type WaterNode = { id: string; volume: number; depth: number; damage: number; rescued: number; exposed: boolean };
export type Gate = { id: string; opening: 0 | 0.5 | 1; target: 0 | 0.5 | 1; readyAt: number };
export type Site = { id: string; built: boolean; buildingUntil: number | null; breached: boolean };
export type GameEvent = { id: number; time: number; type: 'gate' | 'build' | 'breach' | 'warning' | 'flood' | 'rescue' | 'finish'; targetId?: string; message: string };
export type Result = { safe: number; rescued: number; inNeed: number; total: number; damage: number; preserved: number; score: number };
export type GameState = { scenarioId: 'hq100'; phase: 'ready' | 'running' | 'paused' | 'finished'; tick: number; time: number; nodes: WaterNode[]; gates: Gate[]; sites: Site[]; preparations: Preparation[]; teams: (string | null)[]; buildsLeft: number; events: GameEvent[]; nextEventId: number; totalIn: number; totalOut: number; initialVolume: number; flows: Record<string, number>; result: Result | null; lastError: string | null };
export type Command = { type: 'start' | 'pause' | 'resume' | 'reset' } | { type: 'prepare'; preparation: Preparation } | { type: 'gate'; id: string; opening: 0 | 0.5 | 1 } | { type: 'build' | 'breach'; id: string } | { type: 'team'; index: number; townId: string | null };
export type Selection = { kind: 'node' | 'gate' | 'site'; id: string } | null;
