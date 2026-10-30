import type { Command, CommandResult, Snapshot, Terrain } from "./flood/types";
export type Request = { id: number } & (
  | { type: "init"; test: boolean }
  | { type: "command"; command: Command }
  | { type: "preview"; command: Extract<Command, { points: unknown }> }
  | { type: "advance"; seconds: number }
  | { type: "diagnostics" }
  | { type: "ack" }
  | { type: "benchmark" }
);
export interface Response {
  id: number;
  type: "ready" | "snapshot" | "result" | "error";
  terrain?: Terrain;
  snapshot?: Snapshot;
  result?: CommandResult & { cost?: number };
  diagnostics?: unknown;
  error?: string;
}
