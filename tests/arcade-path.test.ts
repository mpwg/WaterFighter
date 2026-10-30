import {expect,it} from 'vitest';
import {arcadeDamPath,arcadeTrenchPath,damPath,trenchPath} from '../src/simulation/path';

it('verbindet nahe freie Dammenden und berechnet nur neue Kanten',()=>{
  const existing=damPath([5,2],[5,8],20).map(f=>`${f.axis}:${f.index}`);
  const path=arcadeDamPath([6,8],[12,10],20,20,existing);
  expect(path).toEqual(damPath([5,8],[12,10],20));
  expect(path.every(f=>!existing.includes(`${f.axis}:${f.index}`))).toBe(true);
  expect(arcadeDamPath([9,8],[12,10],20,20,existing)).toEqual(damPath([9,8],[12,10],20));
});
it('führt nahe Dammenden an den Kartenrand und vermeidet Randkanten',()=>{
  expect(arcadeDamPath([1,4],[5,4],20,20,[])).toEqual(damPath([0,4],[5,4],20));
  expect(arcadeDamPath([1,1],[1,5],20,20,[]).length).toBeGreaterThan(0);
});
it('schließt Grabenenden nur an offene Ränder oder bestehende Gräben an',()=>{
  expect(arcadeTrenchPath([1,10],[8,10],20,20,[],['left'])).toEqual(trenchPath([0,10],[8,10],20));
  expect(arcadeTrenchPath([1,10],[8,10],20,20,[],[])).toEqual(trenchPath([1,10],[8,10],20));
  expect(arcadeTrenchPath([5,10],[8,10],20,20,[10*20+4],[])).toEqual(trenchPath([4,10],[8,10],20));
});
