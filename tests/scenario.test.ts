import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateScenario } from '../src/scenario';
const scenario = JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json', 'utf8'));
describe('Szenariolader', () => {
  it('prüft das tatsächlich ausgelieferte Paket', () => {
    const parsed = validateScenario(scenario);
    expect(parsed.grid.width * parsed.grid.cellSize).toBe(800);
    expect(parsed.buildings.length).toBeGreaterThan(0);
    expect(parsed.version).toBe('1.3-draft');
    expect(parsed.parameters.inflowCells).toHaveLength(90);
    expect(parsed.parameters.inflowCurve).toEqual([[0,0],[60,3375],[140,11250],[210,7875],[300,0]]);
  });
  it('weist beschädigte Raster und unbekannte Versionen zurück', () => {
    expect(() => validateScenario({ ...scenario, version: 'unknown' })).toThrow();
    expect(() => validateScenario({ ...scenario, terrain: [NaN] })).toThrow();
    expect(() => validateScenario({ ...scenario, initialDepth: scenario.initialDepth.map(() => -1) })).toThrow();
  });
});
