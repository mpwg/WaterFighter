import { describe, it, expect, vi } from "vitest";
import { LatestThrottle } from "../src/input";
import { SessionClock } from "../src/session";
describe("live preview scheduling", () => {
  it("validates during uninterrupted motion instead of waiting for silence", async () => {
    vi.useFakeTimers();
    const values: number[] = [];
    const throttle = new LatestThrottle<number>(65, async (n) => {
      values.push(n);
    });
    for (let n = 0; n < 40; n++) {
      throttle.push(n);
      await vi.advanceTimersByTimeAsync(10);
    }
    expect(values.length).toBeGreaterThanOrEqual(6);
    expect(values.at(-1)).toBeGreaterThan(30);
    throttle.cancel();
    vi.useRealTimers();
  });
  it("bounds in-flight validation and discards queued work on cancel", async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    const values: number[] = [];
    const throttle = new LatestThrottle<number>(65, (n) => {
      values.push(n);
      return new Promise<void>((r) => (finish = r));
    });
    throttle.push(1);
    await vi.advanceTimersByTimeAsync(1);
    throttle.push(2);
    await vi.advanceTimersByTimeAsync(200);
    expect(values).toEqual([1]);
    throttle.cancel();
    finish();
    await vi.advanceTimersByTimeAsync(200);
    expect(values).toEqual([1]);
    vi.useRealTimers();
  });
});
it("holds realtime until explicit scene readiness without catchup or resetting on later starts", () => {
  const elapsed: number[] = [];
  const clock = new SessionClock((dt) => elapsed.push(dt));
  clock.tick(0);
  clock.tick(20000);
  expect(elapsed).toEqual([]);
  clock.start(20000);
  clock.tick(20100);
  expect(elapsed).toEqual([0.1]);
  clock.start(20200);
  clock.tick(20200);
  expect(elapsed).toEqual([0.1, 0.1]);
});
