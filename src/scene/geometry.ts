import type { Terrain, Snapshot } from "../flood/types";
/** Shared corner heights join wet cells; wet topology and obstacle holes remain exact. */
export function cellGeometry(t: Terrain, depths?: Float32Array) {
  const positions: number[] = [],
    indices: number[] = [],
    colors: number[] = [],
    uvs: number[] = [];
  const vertices = new Map<string, number>();
  const wet = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < t.width &&
    y < t.height &&
    (!depths ||
      (depths[y * t.width + x] > 0.002 && !t.obstacles[y * t.width + x]));
  const corner = (x: number, y: number, own: number) => {
    let sum = 0,
      count = 0,
      max = -Infinity,
      min = Infinity;
    for (const dx of [-1, 0])
      for (const dy of [-1, 0])
        if (wet(x + dx, y + dy)) {
          const i = (y + dy) * t.width + x + dx,
            h = t.heights[i] + (depths ? depths[i] + 0.018 : 0);
          sum += h;
          count++;
          max = Math.max(max, h);
          min = Math.min(min, h);
        }
    // Sharp hydraulic ridges remain visible; gentle slopes get continuous shading.
    return depths
      ? max - min > 0.35
        ? own
        : sum / count
      : max - min > 0.8
        ? max
        : sum / count;
  };
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      if (!wet(x, y)) continue;
      const i = y * t.width + x,
        d = depths?.[i] ?? 0;
      const ids: number[] = [];
      for (const [xx, yy] of [
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ]) {
        // Ground color boundaries retain vertices, water shares vertices across all wet cells.
        const elevation = corner(
          xx,
          yy,
          t.heights[i] + (depths ? d + 0.018 : 0),
        );
        const key = depths
          ? `${xx},${yy},${elevation.toFixed(4)}`
          : `${xx},${yy},${t.roads?.[i] ?? 0},${t.river[i]}`;
        let id = vertices.get(key);
        if (id === undefined) {
          id = positions.length / 3;
          vertices.set(key, id);
          positions.push(xx * t.cellSize, elevation, yy * t.cellSize);
          const line = t.riverCenterline?.[Math.min(t.width - 1, xx)];
          uvs.push(xx / 11, (yy - (line?.y ?? 0)) / 8);
          const grain =
            Math.sin(xx * 0.13 + Math.sin(yy * 0.08) * 3) * 0.017 +
            Math.sin(yy * 0.29) * 0.009;
          const patch =
            Math.sin(xx * 0.035 + yy * 0.017) *
            Math.cos(yy * 0.047 - xx * 0.009);
          const road = !!t.roads?.[i];
          const c = depths
            ? [
                0.47 - Math.min(d, 2) * 0.055,
                0.43 - Math.min(d, 2) * 0.018,
                0.32 + Math.min(d, 2) * 0.018,
              ]
            : t.river[i]
              ? [0.33, 0.32, 0.25]
              : road
                ? [0.48, 0.45, 0.37]
                : [
                    0.3 + grain + patch * 0.045,
                    0.38 + grain + patch * 0.028,
                    0.19 + grain,
                  ];
          if (depths) {
            const head = t.heights[i] + d;
            let gradient = 0;
            for (const [dx, dy] of [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ]) {
              const j = (y + dy) * t.width + x + dx;
              if (
                x + dx >= 0 &&
                x + dx < t.width &&
                y + dy >= 0 &&
                y + dy < t.height &&
                !t.obstacles[j] &&
                depths[j] > 0.002
              )
                gradient = Math.max(
                  gradient,
                  Math.abs(head - t.heights[j] - depths[j]),
                );
            }
            const foam =
              Math.min(0.18, Math.max(0, gradient - 0.1) * 0.22) *
              (0.5 + 0.5 * Math.sin(xx * 2.7 + yy * 3.1));
            c[0] += foam;
            c[1] += foam;
            c[2] += foam;
          }
          if (!depths)
            for (let channel = 0; channel < 3; channel++) c[channel] *= 2.15;
          colors.push(...c, 1);
        }
        ids.push(id);
      }
      indices.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
    }
  return { positions, indices, colors, uvs };
}
export function assertSnapshot(t: Terrain, s: Snapshot) {
  if (
    s.width !== t.width ||
    s.height !== t.height ||
    s.cellSize !== t.cellSize ||
    s.depths.length !== t.heights.length
  )
    throw new Error("Scene snapshot does not match terrain");
}
/** Quarter-cell sampling follows levees and current water; rendered in a depth-cleared overlay. */
export function previewGeometry(
  t: Terrain,
  points: import("../flood/types").Point[],
  depths?: Float32Array,
) {
  const result: { x: number; y: number; z: number }[] = [];
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1],
      b = points[k],
      steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 4));
    for (let n = k === 1 ? 0 : 1; n <= steps; n++) {
      const x = a.x + ((b.x - a.x) * n) / steps,
        y = a.y + ((b.y - a.y) * n) / steps;
      let h = -Infinity;
      for (const ox of [-0.05, 0.05])
        for (const oy of [-0.05, 0.05]) {
          const cx = Math.max(0, Math.min(t.width - 1, Math.floor(x + ox))),
            cy = Math.max(0, Math.min(t.height - 1, Math.floor(y + oy))),
            i = cy * t.width + cx;
          h = Math.max(h, t.heights[i] + (depths?.[i] ?? 0));
        }
      result.push({ x: x * t.cellSize, y: h + 0.35, z: y * t.cellSize });
    }
  }
  return result;
}
/** Outward clockwise faces in Babylon's left-handed coordinate system. */
export function roofGeometry(w: number, d: number, height: number) {
  return {
    positions: [
      -w / 2,
      0,
      -d / 2,
      w / 2,
      0,
      -d / 2,
      0,
      height,
      -d / 2,
      -w / 2,
      0,
      d / 2,
      w / 2,
      0,
      d / 2,
      0,
      height,
      d / 2,
    ],
    indices: [0, 1, 2, 3, 5, 4, 0, 5, 3, 0, 2, 5, 1, 5, 2, 1, 4, 5],
  };
}
