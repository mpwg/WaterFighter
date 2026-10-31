import { describe, it, expect } from "vitest";
import { Session } from "../src/session";
describe("worker session", () => {
  it("validates previews with the actual core without reserving material", () => {
    const s = new Session();
    s.command(1, { type: "pause" });
    const points = [
      { x: 100, y: 150 },
      { x: 105, y: 150 },
    ];
    const before = s.snapshot();
    const p = s.preview({ type: "barrier", points });
    expect(p.ok).toBe(true);
    expect(p.cost).toBe(10);
    expect(s.snapshot().resources).toBe(before.resources);
    expect(s.command(2, { type: "barrier", points }).ok).toBe(true);
    expect(s.preview({ type: "barrier", points }).cost).toBe(0);
    expect(
      s.preview({
        type: "barrier",
        points: [
          { x: -1, y: 5 },
          { x: 4, y: 5 },
        ],
      }).ok,
    ).toBe(false);
  });
  it("rejects stale commands across reset and freezes queued work and rescue clocks", () => {
    const s = new Session();
    s.command(1, { type: "pause" });
    s.command(2, { type: "rescue", buildingId: 0 });
    s.advance(3);
    expect(s.snapshot().time).toBe(0);
    s.command(3, { type: "reset" });
    expect(s.command(2, { type: "pause" }).ok).toBe(false);
    expect(s.snapshot().phase).toBe("running");
    s.command(4, { type: "rescue", buildingId: s.terrain.buildings[0].id });
    s.advance(6);
    expect(s.snapshot().rescues[0].status).toBe("complete");
  });
  it("bounds real-time catchup, allows deterministic advancement and ends at360", () => {
    const s = new Session();
    s.tick(100);
    expect(s.snapshot().time).toBeLessThanOrEqual(0.201);
    s.advance(360);
    expect(s.snapshot().time).toBe(360);
    expect(s.snapshot().phase).toBe("finished");
  }, 60000);
});
