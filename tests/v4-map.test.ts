import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateMap } from '../src/v4/map';
import type { V4Map } from '../src/v4/types';
const original = JSON.parse(readFileSync('public/v4/map.json', 'utf8')) as V4Map;
describe('V4 malformed map rejection', () => {
  it('accepts the checked-in map', () => expect(validateMap(original)).toBe(original));
  const cases: [string, (m: V4Map) => void][] = [
    ['negative source', m => m.sourceCells = [-1]],
    ['fractional source', m => m.sourceCells = [1.5]],
    ['outside source', m => m.sourceCells = [m.width * m.height]],
    ['blocked source', m => m.sourceCells = [m.buildings[0].cells[0]]],
    ['missing sources', m => delete (m as Partial<V4Map>).sourceCells],
    ['infinite building value', m => m.buildings[0].value = Infinity],
    ['nonpositive building value', m => m.buildings[0].value = 0],
    ['infinite crest', m => m.barrierSegments[0].crestHeight = Infinity],
    ['nonpositive crest', m => m.barrierSegments[0].crestHeight = 0],
    ['missing roads', m => delete (m as Partial<V4Map>).roads],
    ['empty road geometry', m => m.roads[0].points = []],
    ['nonfinite road coordinate', m => m.roads[0].points[0][0] = NaN],
  ];
  it.each(cases)('rejects %s', (_name, mutate) => {
    const map = structuredClone(original); mutate(map);
    expect(() => validateMap(map)).toThrow();
  });
});
