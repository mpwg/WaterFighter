import { describe, expect, it } from 'vitest';
import { isReady } from '../src/protocol';
describe('Worker-Protokoll', () => {
  it('akzeptiert nur den erwarteten Initialisierungszustand', () => {
    expect(isReady({ type: 'ready', version: 1, scenarioId: 'brigittenau', round: 1 })).toBe(true);
    expect(isReady({ type: 'ready', version: 2 })).toBe(false);
    expect(isReady(null)).toBe(false);
  });
});
