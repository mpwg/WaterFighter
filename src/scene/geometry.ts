import type { Terrain, Snapshot } from "../flood/types";
/** Cell-flat geometry preserves the exact hydraulic floor, including narrow levees. */
export function cellGeometry(t: Terrain, depths?: Float32Array) {
  const positions: number[] = [],
    indices: number[] = [],
    colors: number[] = [],
    uvs: number[] = [];
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      const i = y * t.width + x,
        d = depths?.[i] ?? 0;
      if (depths && (d <= 0.002 || t.obstacles[i])) continue;
      const h = t.heights[i] + (depths ? d + 0.012 : 0),
        s = t.cellSize,
        n = positions.length / 3;
      positions.push(
        x * s,
        h,
        y * s,
        (x + 1) * s,
        h,
        y * s,
        (x + 1) * s,
        h,
        (y + 1) * s,
        x * s,
        h,
        (y + 1) * s,
      );
      indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
      uvs.push(
        x / 8,
        y / 8,
        (x + 1) / 8,
        y / 8,
        (x + 1) / 8,
        (y + 1) / 8,
        x / 8,
        (y + 1) / 8,
      );
      const road = y > t.height * 0.4 && (y % 20 < 3 || x % 32 < 3);
      const noise =
        ((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1) * 0.018;
      const c = depths
        ? [0.09, 0.34 + Math.min(d, 2) * 0.025, 0.39]
        : t.river[i]
          ? [0.29, 0.32, 0.24]
          : road
            ? [0.37, 0.38, 0.36]
            : [0.31 + noise, 0.4 + noise, 0.2 + noise];
      for (let k = 0; k < 4; k++)
        colors.push(...c, depths?.[i] !== undefined ? 0.84 : 1);
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
