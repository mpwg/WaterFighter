import {describe, expect, it} from 'vitest';
import {displayDamage} from '../src/render/building-status';

describe('Schadensanzeige',()=>{
  it('unterscheidet einen kleinen positiven Schaden von null',()=>{
    expect(displayDamage(0)).toBe('0');
    expect(displayDamage(0.001)).toBe('< 1');
    expect(displayDamage(0.499)).toBe('< 1');
    expect(displayDamage(0.5)).toBe('1');
    expect(displayDamage(1.6)).toBe('2');
  });
});
