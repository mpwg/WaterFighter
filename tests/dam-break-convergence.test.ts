import { describe, expect, it } from 'vitest';
import { ShallowWaterSolver } from '../src/simulation/solver';

// Ritter solution for a sudden dam break from 1 m of still water into a dry bed.
// The wave stays well away from the reflecting ends during this 3 s test.
function exactDepth(x: number, time: number): number {
  const c = Math.sqrt(9.81), v = x / time;
  if (v <= -c) return 1;
  if (v >= 2 * c) return 0;
  return (2 * c - v) ** 2 / (9 * 9.81);
}

function depthError(cellSize: number): number {
  const width = 200 / cellSize, time = 3;
  const solver = new ShallowWaterSolver(width, 1, cellSize, new Float64Array(width),
    Array.from({ length: width }, (_, i) => i < width / 2 ? 1 : 0));
  solver.advance(time);
  let error = 0;
  for (let i = 0; i < width; i++) {
    // Average the analytic solution over the cell with midpoint quadrature;
    // finite-volume depths represent cell averages, not point samples.
    let average = 0;
    for (let j = 0; j < 16; j++) average += exactDepth((i + (j + 0.5) / 16) * cellSize - 100, time) / 16;
    error += Math.abs(solver.h[i] - average) * cellSize;
  }
  return error;
}

describe('Dammbruch gegen analytische Lösung', () => {
  it('verringert den integrierten Tiefenfehler bei verfeinertem Raster', () => {
    const errors = [2, 1, 0.5, 0.25].map(depthError);
    for (let i = 1; i < errors.length; i++) expect(errors[i]).toBeLessThan(errors[i - 1] * 0.9);
    expect(errors[errors.length - 1]).toBeLessThan(0.65);
  });
});
