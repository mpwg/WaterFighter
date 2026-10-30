import { createGame, commandGame, snapshotGame, stepGame } from "./flood/game";
import type { Command, CommandResult } from "./flood/types";
export const FIXED_STEP = 1 / 30;
/** Worker-owned deterministic session. Preview invokes the exact command on an isolated copy. */
export class Session {
  readonly game = createGame();
  readonly terrain = this.game.terrain;
  private lastCommand = 0;
  private accumulator = 0;
  readonly samples: number[] = [];
  command(sequence: number, command: Command): CommandResult {
    if (sequence <= this.lastCommand)
      return { ok: false, reason: "Stale command" };
    this.lastCommand = sequence;
    const result = commandGame(this.game, command);
    if (
      command.type === "reset" ||
      command.type === "pause" ||
      command.type === "resume"
    )
      this.accumulator = 0;
    return result;
  }
  preview(
    command: Extract<Command, { points: unknown }>,
  ): CommandResult & { cost: number } {
    const copy = structuredClone(this.game),
      before = copy.resources;
    return { ...commandGame(copy, command), cost: before - copy.resources };
  }
  private step() {
    const begin = performance.now();
    stepGame(this.game, FIXED_STEP);
    this.samples.push(performance.now() - begin);
    if (this.samples.length > 1000) this.samples.shift();
  }
  tick(elapsed: number) {
    if (this.game.phase !== "running") {
      this.accumulator = 0;
      return;
    }
    this.accumulator += Math.min(0.2, Math.max(0, elapsed));
    while (this.accumulator + 1e-9 >= FIXED_STEP) {
      this.step();
      this.accumulator -= FIXED_STEP;
    }
  }
  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 360)
      throw new Error("Advance must be 0…360 seconds");
    for (
      let n = 0;
      n < Math.round(seconds / FIXED_STEP) && this.game.phase === "running";
      n++
    )
      this.step();
  }
  benchmark() {
    const isolated = new Session();
    for (let i = 0; i < 100; i++) isolated.step();
    isolated.samples.length = 0;
    for (let i = 0; i < 1000; i++) isolated.step();
    return isolated.diagnostics();
  }
  snapshot() {
    return snapshotGame(this.game);
  }
  diagnostics() {
    const sorted = [...this.samples].sort((a, b) => a - b);
    return {
      fixedStep: FIXED_STEP,
      snapshotHz: 10,
      samples: sorted.length,
      coreP95Ms: sorted[Math.floor((sorted.length - 1) * 0.95)] ?? 0,
    };
  }
}

/** Realtime starts only when the initial landscape is ready. Later readiness is idempotent. */
export class SessionClock {
  private started = false;
  private last = 0;
  constructor(private advance: (seconds: number) => void) {}
  start(now: number) {
    if (this.started) return;
    this.started = true;
    this.last = now;
  }
  rebase(now: number) {
    this.last = now;
  }
  tick(now: number) {
    if (!this.started) return;
    this.advance(Math.max(0, now - this.last) / 1000);
    this.last = now;
  }
}
