import { describe, it, expect } from "vitest";
import { createTerrain } from "../src/flood/terrain";
import { cellGeometry, assertSnapshot } from "../src/scene/geometry";
import { createGame, snapshotGame } from "../src/flood/game";
describe("scene hydraulic geometry", () => {
  it("uses exact cell floor and world scale with no dry water faces", () => {
    const t = createTerrain(8, 8),
      d = new Float32Array(64);
    d[3] = 0.5;
    const g = cellGeometry(t, d);
    expect(g.indices.length).toBe(6);
    expect(g.positions[0]).toBe(6);
    expect(g.positions[1]).toBeCloseTo(t.heights[3] + 0.518);
    expect(g.positions[3]).toBe(8);
    expect(cellGeometry(t, new Float32Array(64)).indices).toHaveLength(0);
  });
  it("does not render water through buildings and rejects mismatched snapshots", () => {
    const t = createTerrain(8, 8),
      d = new Float32Array(64);
    t.obstacles[0] = 1;
    d[0] = 1;
    expect(cellGeometry(t, d).indices).toHaveLength(0);
    const s = snapshotGame(createGame(t));
    expect(() => assertSnapshot(t, s)).not.toThrow();
    expect(() => assertSnapshot(t, { ...s, width: 9 })).toThrow();
  });
});

import { createPointerTrack } from "../src/scene/input";
describe("scene pointer termination", () => {
  const event = (pointerId: number) => ({ pointerId }) as PointerEvent;
  it("delivers off-terrain release using last valid pick, exactly once", () => {
    const calls: unknown[] = [];
    const track = createPointerTrack((phase, pick) =>
      calls.push([phase, pick]),
    );
    track("down", event(1), { x: 1 });
    track("move", event(1), { x: 2 });
    track("up", event(1));
    track("cancel", event(1));
    expect(calls).toEqual([
      ["down", { x: 1 }],
      ["move", { x: 2 }],
      ["up", { x: 2 }],
    ]);
  });
  it("cancels on capture loss and ignores unrelated pointers or unstarted gestures", () => {
    const calls: unknown[] = [];
    const track = createPointerTrack((phase, pick) =>
      calls.push([phase, pick]),
    );
    track("up", event(1));
    track("down", event(1), 4);
    track("up", event(2), 8);
    track("cancel", event(1));
    track("up", event(1));
    expect(calls).toEqual([
      ["down", 4],
      ["cancel", 4],
    ]);
  });
});
import { previewGeometry } from "../src/scene/geometry";
it("tessellates a long preview over levees and current floodwater", () => {
  const t = createTerrain(8, 8);
  t.heights.fill(0);
  t.heights[3 * 8 + 4] = 1.55;
  const d = new Float32Array(64);
  d[3 * 8 + 5] = 2;
  const path = previewGeometry(
    t,
    [
      { x: 1, y: 3.5 },
      { x: 7, y: 3.5 },
    ],
    d,
  );
  expect(path.length).toBe(25);
  expect(path.find((p) => p.x === 9)?.y).toBeCloseTo(1.9);
  expect(path.find((p) => p.x === 11)?.y).toBeCloseTo(2.35);
});
it("keeps the first pointer owner when additional or repeated downs arrive", () => {
  const event = (pointerId: number) => ({ pointerId }) as PointerEvent,
    calls: unknown[] = [];
  const track = createPointerTrack((phase, pick) => calls.push([phase, pick]));
  track("down", event(1), 10);
  track("down", event(2), 20);
  track("down", event(1), 30);
  track("move", event(2), 40);
  track("up", event(2), 50);
  track("up", event(1));
  track("down", event(2), 60);
  track("cancel", event(2));
  expect(calls).toEqual([
    ["down", 10],
    ["up", 10],
    ["down", 60],
    ["cancel", 60],
  ]);
});

import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
it("orients the hydraulic surface upward for Babylon left-handed face culling and lighting", () => {
  const t = createTerrain(8, 8),
    g = cellGeometry(t),
    normals: number[] = [];
  VertexData.ComputeNormals(g.positions, g.indices, normals);
  expect(normals[1]).toBeGreaterThan(0);
});

import { roofGeometry } from "../src/scene/geometry";
import { gatePose } from "../src/scene/gate";
import { readFileSync } from "node:fs";
it("faces roof gables outward and pitched slopes toward the sky", () => {
  const g = roofGeometry(10, 12, 3),
    normals: number[] = [];
  VertexData.ComputeNormals(g.positions, g.indices, normals);
  expect(normals[2]).toBeLessThan(0);
  expect(normals[1]).toBeGreaterThan(0);
});

it("shares water corners without filling a dry or obstructed neighbor", () => {
  const t = createTerrain(8, 8);
  t.heights.fill(0);
  t.obstacles.fill(0);
  const d = new Float32Array(64);
  d[10] = 1;
  d[11] = 1;
  const g = cellGeometry(t, d);
  expect(g.indices).toHaveLength(12);
  expect(g.positions).toHaveLength(18);
  t.obstacles[11] = 1;
  expect(cellGeometry(t, d).indices).toHaveLength(6);
});
it("keeps the closed gate on its control-cell base and raises it to the sill", () => {
  const terrain = createTerrain(256, 192),
    gate = terrain.gates[0],
    base = terrain.heights[gate.a],
    closed = gatePose(gate, base, false),
    opened = gatePose(gate, base, true);
  expect(closed.bottom).toBeCloseTo(base);
  expect(closed.top).toBeCloseTo(gate.sill);
  expect(opened.bottom).toBeGreaterThanOrEqual(gate.sill);

  const changedSill = { ...gate, sill: gate.sill + 0.47 },
    changedClosed = gatePose(changedSill, base, false),
    changedOpen = gatePose(changedSill, base, true);
  expect(changedClosed.bottom).toBeCloseTo(base);
  expect(changedClosed.top).toBeCloseTo(changedSill.sill);
  expect(changedOpen.bottom).toBeGreaterThanOrEqual(changedSill.sill);

  const sceneSource = readFileSync(new URL("../src/scene/index.ts", import.meta.url), "utf8");
  expect(sceneSource.match(/gatePose\(/g)).toHaveLength(2);
});
it("does not average a sharp hydraulic jump into a sloping water sheet", () => {
  const t = createTerrain(8, 8);
  t.heights.fill(0);
  t.obstacles.fill(0);
  const d = new Float32Array(64);
  d[10] = 1;
  d[11] = 2;
  const g = cellGeometry(t, d);
  expect(g.positions.filter((_, i) => i % 3 === 1)).toContain(1.018);
  expect(g.positions.filter((_, i) => i % 3 === 1)).toContain(2.018);
});
