import type { Scenario } from './scenario';
import type { Action, ActionResult, BuildingStatus } from './simulation/game';
export type Request =
  | { type: 'init'; scenario: Scenario }
  | { type: 'start' | 'pause' | 'reset'; round: number }
  | { type: 'speed'; round: number; speed: 1 | 2 }
  | { type: 'preview' | 'action'; round: number; id: string; action: Action }
  | { type: 'recycle'; round: number; buffer: ArrayBuffer };
export type Response =
  | { type: 'ready'; version: 1; scenarioId: string; round: number }
  | { type: 'action-result'; round: number; id: string; preview: boolean; result: ActionResult }
  | { type: 'snapshot'; round: number; budget: number; buildings: BuildingStatus[]; dams: [string, number][]; time: number; running: boolean; speed: 1 | 2; backlog: number; volume: number; inflow: number; outflow: number; roundoffVolume: number; buffer: ArrayBuffer }
  | { type: 'result'; round: number; time: number }
  | { type: 'error'; round: number; message: string };
export function isReady(value: unknown): value is Extract<Response, { type: 'ready' }> {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'ready' && 'version' in value && value.version === 1 && 'scenarioId' in value && typeof value.scenarioId === 'string' && 'round' in value && Number.isSafeInteger(value.round);
}
