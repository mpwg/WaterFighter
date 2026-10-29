import { expect, it } from 'vitest';
import { trenchPath } from '../src/simulation/path';

it('connects endpoints with a direct face-connected path in either direction', () => {
  const width = 30;
  for (const [start, end] of [
    [[2, 3], [17, 12]], [[2, 12], [17, 3]], [[4, 1], [4, 20]], [[1, 4], [20, 4]], [[4, 4], [4, 4]],
  ] as [number, number][][]) {
    const a = start as [number, number], b = end as [number, number];
    const path = trenchPath(a, b, width);
    expect(path[0]).toBe(a[1] * width + a[0]);
    expect(path.at(-1)).toBe(b[1] * width + b[0]);
    expect(path.length).toBe(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + 1);
    expect(trenchPath(b, a, width)).toEqual([...path].reverse());
    for (let i = 1; i < path.length; i++) {
      expect(Math.abs(path[i] % width - path[i - 1] % width) + Math.abs(Math.floor(path[i] / width) - Math.floor(path[i - 1] / width))).toBe(1);
    }
  }
  expect(trenchPath([0, 0], [3, 3], width)).toEqual([0, 1, 31, 32, 62, 63, 93]);
});

it('permits the five-segment southern land corridor within the delivered budget', async () => {
  const { readFileSync } = await import('node:fs');
  const { Game } = await import('../src/simulation/game');
  const { validateScenario } = await import('../src/scenario');
  const scenario = validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json', 'utf8')));
  const game = new Game(scenario);
  const segments: [[number, number], [number, number]][] = [
    [[118,124],[118,126]], [[119,126],[123,133]], [[124,133],[136,150]],
    [[137,150],[149,167]], [[150,167],[172,199]],
  ];
  const used: number[] = [];
  for (const [i, [start, end]] of segments.entries()) {
    const cells = trenchPath(start, end, scenario.grid.width);
    expect(cells.every(cell => scenario.waterMask[cell] === 0)).toBe(true);
    const result = game.apply(`southern-${i}`, { kind: 'trench', cells });
    expect(result.ok).toBe(true);
    used.push(...cells);
  }
  expect(used).toHaveLength(130);
  expect(game.budget).toBe(6750);
});
