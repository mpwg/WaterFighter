import { describe, expect, it } from 'vitest';
import { uniqueSmallBuilding } from '../src/render/small-building-hit';

describe('Auswahlhilfe für kleine Gebäude',()=>{
  const small={id:'a',left:10,right:14,top:20,bottom:25};
  it('findet ein einzelnes kleines Ziel nahe der angezeigten Fläche',()=>{
    expect(uniqueSmallBuilding([small],20,23)).toBe('a');
    expect(uniqueSmallBuilding([small],23,23)).toBeUndefined();
  });
  it('vermeidet mehrdeutige oder große Ziele',()=>{
    expect(uniqueSmallBuilding([small,{...small,id:'b',left:21,right:25}],18,23)).toBeUndefined();
    expect(uniqueSmallBuilding([{...small,right:50}],20,23)).toBeUndefined();
    expect(uniqueSmallBuilding([{...small,left:20,right:10}],15,23)).toBeUndefined();
  });
});
