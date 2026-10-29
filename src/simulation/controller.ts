import type { Request, Response } from '../protocol';
import { validateScenario, type Scenario } from '../scenario';
import { ShallowWaterSolver } from './solver';
import { Game } from './game';

type Emit = (message: Response, transfer?: Transferable[]) => void;
/** Authoritative clock and round ownership. `tick` is driven by the worker's monotonic clock. */
export class Controller {
  private scenario?: Scenario;
  private solver?: ShallowWaterSolver;
  private game?: Game;
  private round = 0;
  private running = false;
  private speed: 1 | 2 = 1;
  private lastClock?: number;
  private backlog = 0;
  private pool: ArrayBuffer[] = [];
  private outstanding = 0;
  private completed = false;
  private dirty = false;
  private revision = 0;
  constructor(private readonly emit: Emit) {}

  private initialize(scenario: Scenario): void {
    this.scenario = scenario;
    this.round++;
    this.game = new Game(scenario);
    this.solver = this.game.solver;
    this.running = false; this.speed = 1; this.backlog = 0; this.lastClock = undefined; this.completed = false; this.revision = 0;
    const bytes = scenario.grid.width * scenario.grid.height * 4 * Float32Array.BYTES_PER_ELEMENT;
    this.pool = [new ArrayBuffer(bytes), new ArrayBuffer(bytes)];
    this.outstanding = 0; this.dirty = true;
    this.emit({type:'ready', version:1, scenarioId:scenario.id, round:this.round});
    this.snapshot();
  }

  handle(message: Request, now = performance.now()): void {
    try {
      if (message.type === 'init') { if (!this.scenario) this.initialize(validateScenario(message.scenario)); return; }
      if (!this.scenario || !this.solver || message.round !== this.round) return;
      if (this.running && (message.type === 'pause' || message.type === 'speed' || message.type === 'action')) this.tick(now);
      switch (message.type) {
        case 'reset': this.initialize(this.scenario); break;
        case 'start': if (!this.completed && !this.running) { this.running = true; this.lastClock = now; this.dirty = true; this.snapshot(); } break;
        case 'pause': this.running = false; this.lastClock = undefined; this.dirty = true; this.snapshot(); break;
        case 'speed': if (message.speed === 1 || message.speed === 2) { this.speed = message.speed; this.dirty = true; this.snapshot(); } else throw new Error('Ungültige Geschwindigkeit'); break;
        case 'preview': case 'action': {
          if (!this.game) break;
          const result=this.completed ? {ok:false as const,reason:'Runde bereits beendet.',budget:this.game.budget} : message.type==='preview' ? this.game.preview(message.action) : this.game.apply(message.id,message.action);
          this.emit({type:'action-result',round:this.round,id:message.id,preview:message.type==='preview',result});
          if(message.type==='action' && result.ok) { this.revision++; this.dirty=true; this.snapshot(); }
          break;
        }
        case 'recycle': {
          const size = this.solver.h.length * 4 * Float32Array.BYTES_PER_ELEMENT;
          // Transferred buffers return as a new object, so outstanding count, size and round bound the pool.
          if (message.buffer instanceof ArrayBuffer && message.buffer.byteLength === size && this.outstanding > 0 && this.pool.length < 2) {
            this.outstanding--; this.pool.push(message.buffer);
            if (this.dirty) this.snapshot();
          }
          break;
        }
      }
    } catch (error) { this.fail(error); }
  }

  tick(now: number): void {
    if (!this.solver || !this.scenario || !this.running) return;
    try {
      if (!Number.isFinite(now)) throw new Error('Ungültige Uhrzeit');
      if (this.lastClock === undefined) { this.lastClock = now; return; }
      const elapsed = Math.max(0, (now-this.lastClock)/1000); this.lastClock = now;
      this.backlog += elapsed*this.speed;
      // Limit one event-loop task, preserving all unfinished simulated time as backlog.
      let allowance = Math.min(this.backlog, 1, this.scenario.parameters.duration-this.solver.time);
      while (allowance > 1e-9) {
        const t0=this.solver.time;
        const dt = this.solver.step(allowance);
        this.game?.addInflow(t0,dt);
        this.game?.updateDamage(dt);
        this.backlog = Math.max(0,this.backlog-dt); allowance -= dt;
      }
      if (this.solver.time >= this.scenario.parameters.duration-1e-8) {
        this.running = false; this.completed = true; this.backlog = 0;
        const totals=this.game!.totals(),target=this.scenario.parameters.damageTarget;
        this.emit({type:'result',round:this.round,time:this.solver.time,...totals,budget:this.game!.budget,target,achieved:totals.totalDamage<=target});
      }
      this.dirty = true; this.snapshot();
    } catch (error) { this.fail(error); }
  }

  private snapshot(): void {
    if (!this.solver || !this.game || !this.pool.length || !this.dirty) return;
    this.dirty = false;
    const buffer=this.pool.pop()!; const target=new Float32Array(buffer), n=this.solver.h.length;
    target.set(this.solver.h,0); target.set(this.solver.qx,n); target.set(this.solver.qy,2*n); target.set(this.solver.bed,3*n);
    this.outstanding++;
    this.emit({type:'snapshot',round:this.round,revision:this.revision,budget:this.game.budget,buildings:this.game.status(),dams:[...this.game.damFaces],time:this.solver.time,running:this.running,speed:this.speed,backlog:this.backlog,volume:this.solver.volume(),inflow:this.solver.inflow,outflow:this.solver.outflow,roundoffVolume:this.solver.roundoffVolume,buffer},[buffer]);
  }
  private fail(error: unknown): void {
    this.running=false; this.lastClock=undefined;
    this.emit({type:'error',round:this.round,message:error instanceof Error ? error.message : String(error)});
  }
}
