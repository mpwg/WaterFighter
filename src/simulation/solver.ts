/** Finite-volume shallow-water solver; cell-centred bed and conserved momenta.
 * Reflecting closed boundaries, Rusanov flux and hydrostatic reconstruction.
 * SI units: metres, seconds, m²/s. No DOM or worker dependencies.
 */
export class ShallowWaterSolver {
  readonly h: Float64Array;
  readonly qx: Float64Array;
  readonly qy: Float64Array;
  readonly bed: Float64Array;
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  time = 0;
  steps = 0;
  readonly gravity = 9.81;
  /** Absolute crest elevations at vertical and horizontal cell faces, metres. */
  readonly crestX: Float64Array;
  readonly crestY: Float64Array;
  /** Manning roughness; zero disables friction. */
  manning = 0;
  readonly openBoundary = { left: false, right: false, top: false, bottom: false };
  inflow = 0;
  outflow = 0;
  roundoffVolume = 0;
  private readonly dh: Float64Array;
  private readonly dx: Float64Array;
  private readonly dy: Float64Array;

  constructor(width: number, height: number, cellSize: number, bed: ArrayLike<number>, depth: ArrayLike<number>) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || !Number.isFinite(cellSize) || cellSize <= 0 || bed.length !== width * height || depth.length !== width * height) throw new Error('Ungültiges Simulationsraster');
    this.width = width; this.height = height; this.cellSize = cellSize;
    this.bed = Float64Array.from(bed); this.h = Float64Array.from(depth);
    if (this.bed.some(x => !Number.isFinite(x)) || this.h.some(x => !Number.isFinite(x) || x < 0)) throw new Error('Ungültiger Anfangszustand');
    this.crestX = new Float64Array((width+1)*height); this.crestX.fill(-Infinity);
    this.crestY = new Float64Array(width*(height+1)); this.crestY.fill(-Infinity);
    this.qx = new Float64Array(this.h.length); this.qy = new Float64Array(this.h.length);
    this.dh = new Float64Array(this.h.length); this.dx = new Float64Array(this.h.length); this.dy = new Float64Array(this.h.length);
  }

  volume(): number { let sum = 0; for (const h of this.h) sum += h; return sum * this.cellSize ** 2; }

  /** Add a measured volume at a boundary cell; positive volume only. */
  addInflow(cell: number, volume: number): void {
    const x = cell % this.width, y = Math.floor(cell / this.width);
    if (!Number.isInteger(cell) || cell < 0 || cell >= this.h.length || (x !== 0 && x !== this.width-1 && y !== 0 && y !== this.height-1) || !Number.isFinite(volume) || volume < 0) throw new Error('Ungültiger Zufluss');
    this.h[cell] += volume / this.cellSize ** 2;
    this.inflow += volume;
  }

  /** A conservative CFL bound in both directions; dry cells impose no bound. */
  stableStep(maximum: number): number {
    if (!Number.isFinite(maximum) || maximum <= 0) throw new Error('Ungültiger Zeitschritt');
    let speed = 0;
    for (let i = 0; i < this.h.length; i++) {
      const h = this.h[i];
      if (h > 1e-10) {
        const c = Math.sqrt(this.gravity * h);
        speed = Math.max(speed, Math.abs(this.qx[i] / h) + c, Math.abs(this.qy[i] / h) + c);
      }
    }
    return speed > 0 ? Math.min(maximum, 0.24 * this.cellSize / speed) : maximum;
  }

  /** One step no larger than maxDt; caller may repeatedly call until target time. */
  step(maxDt: number): number {
    if (!Number.isFinite(this.manning) || this.manning < 0) throw new Error('Ungültige Bodenreibung');
    const dt = this.stableStep(maxDt), factor = dt / this.cellSize, g = this.gravity;
    let stepOutflow = 0;
    this.dh.fill(0); this.dx.fill(0); this.dy.fill(0);
    const h = this.h, qx = this.qx, qy = this.qy, bed = this.bed;
    const dh = this.dh, dx = this.dx, dy = this.dy;
    // Each face has one shared mass flux and side-specific hydrostatic pressure corrections.
    const face = (left: number, right: number, axis: 0 | 1, crest: number, open = false) => {
      const li = left < 0 ? right : left, ri = right < 0 ? left : right;
      const hl = h[li], hr = h[ri], zl = bed[li], zr = bed[ri];
      let unl = axis === 0 ? qx[li] : qy[li], unr = axis === 0 ? qx[ri] : qy[ri];
      const utl = axis === 0 ? qy[li] : qx[li], utr = axis === 0 ? qy[ri] : qx[ri];
      // Open boundaries are zero-gradient only when momentum points outward.
      // Otherwise they act as a wall; explicit inflows are accounted separately.
      if (left < 0 && (!open || unr >= 0)) unl = -unr;
      if (right < 0 && (!open || unl <= 0)) unr = -unl;
      const zface = Math.max(zl, zr, crest);
      const al = Math.max(0, hl + zl - zface), ar = Math.max(0, hr + zr - zface);
      const nl = hl > 1e-10 ? unl * al / hl : 0, nr = hr > 1e-10 ? unr * ar / hr : 0;
      const tl = hl > 1e-10 ? utl * al / hl : 0, tr = hr > 1e-10 ? utr * ar / hr : 0;
      const ul = al > 1e-10 ? nl / al : 0, ur = ar > 1e-10 ? nr / ar : 0;
      const wave = Math.max(Math.abs(ul) + Math.sqrt(g * al), Math.abs(ur) + Math.sqrt(g * ar));
      const fh = 0.5 * (nl + nr - wave * (ar - al));
      const fn = 0.5 * (nl * ul + 0.5*g*al*al + nr*ur + 0.5*g*ar*ar - wave*(nr-nl));
      const ft = 0.5 * (tl*ul + tr*ur - wave*(tr-tl));
      if (left < 0) stepOutflow += Math.max(0, -fh) * dt * this.cellSize;
      if (right < 0) stepOutflow += Math.max(0, fh) * dt * this.cellSize;
      const correctionL = 0.5*g*(hl*hl-al*al), correctionR = 0.5*g*(hr*hr-ar*ar);
      if (left >= 0) {
        dh[left] -= factor*fh;
        if (axis === 0) { dx[left] -= factor*(fn+correctionL); dy[left] -= factor*ft; }
        else { dy[left] -= factor*(fn+correctionL); dx[left] -= factor*ft; }
      }
      if (right >= 0) {
        dh[right] += factor*fh;
        if (axis === 0) { dx[right] += factor*(fn+correctionR); dy[right] += factor*ft; }
        else { dy[right] += factor*(fn+correctionR); dx[right] += factor*ft; }
      }
    };
    for (let y=0; y<this.height; y++) for (let x=0; x<=this.width; x++) {
      face(x === 0 ? -1 : y*this.width+x-1, x === this.width ? -1 : y*this.width+x, 0, this.crestX[y*(this.width+1)+x], x === 0 ? this.openBoundary.left : x === this.width && this.openBoundary.right);
    }
    for (let y=0; y<=this.height; y++) for (let x=0; x<this.width; x++) {
      face(y === 0 ? -1 : (y-1)*this.width+x, y === this.height ? -1 : y*this.width+x, 1, this.crestY[y*this.width+x], y === 0 ? this.openBoundary.top : y === this.height && this.openBoundary.bottom);
    }
    // Validate before mutating cells, so an unstable step cannot leave a partially updated grid.
    for (let i=0; i<h.length; i++) {
      if (!Number.isFinite(h[i]+dh[i]) || h[i]+dh[i] < -1e-9 || !Number.isFinite(qx[i]+dx[i]) || !Number.isFinite(qy[i]+dy[i])) throw new Error(`Instabiler Zustand in Zelle ${i}`);
    }
    for (let i=0; i<h.length; i++) {
      const next = h[i]+dh[i];
      if (!Number.isFinite(next) || next < -1e-9) throw new Error(`Instabile Wassertiefe in Zelle ${i}: ${next}`);
      // Only floating-point roundoff may be corrected; track this in future diagnostics.
      if (next < 0) this.roundoffVolume += -next * this.cellSize ** 2;
      h[i] = Math.max(0,next);
      qx[i] += dx[i]; qy[i] += dy[i];
      if (h[i] < 1e-10) { qx[i]=0; qy[i]=0; }
      else if (this.manning > 0) {
        // Semi-implicit Manning friction cannot reverse velocity or alter volume.
        const damping = 1 + dt*g*this.manning*this.manning*Math.hypot(qx[i],qy[i])/Math.pow(h[i],7/3);
        qx[i] /= damping; qy[i] /= damping;
      }
      if (!Number.isFinite(qx[i]) || !Number.isFinite(qy[i])) throw new Error(`Instabiler Impuls in Zelle ${i}`);
    }
    this.outflow += stepOutflow;
    this.time += dt; this.steps++;
    return dt;
  }
  advance(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Ungültige Simulationsdauer');
    const end = this.time + seconds;
    while (end - this.time > 1e-9) this.step(end-this.time);
  }
}
