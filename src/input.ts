/** Latest-value throttle: one validation in flight, no starvation during continuous input. */
export class LatestThrottle<T> {
  private latest: T | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running = false;
  private lastStart = -Infinity;
  constructor(
    private interval: number,
    private task: (value: T) => Promise<void>,
  ) {}
  push(value: T) {
    this.latest = value;
    this.schedule();
  }
  cancel() {
    this.latest = undefined;
    clearTimeout(this.timer);
    this.timer = undefined;
  }
  private schedule() {
    if (this.running || this.timer !== undefined || this.latest === undefined)
      return;
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        const value = this.latest;
        this.latest = undefined;
        if (value === undefined) return;
        this.running = true;
        this.lastStart = Date.now();
        void this.task(value).finally(() => {
          this.running = false;
          this.schedule();
        });
      },
      Math.max(0, this.interval - (Date.now() - this.lastStart)),
    );
  }
}
