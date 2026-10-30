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

 it('vertauscht Dammendpunkte ohne Änderung der tatsächlich erzeugten Strecke',()=>{
  const existing=damPath([5,2],[5,8],20).map(f=>`${f.axis}:${f.index}`);
  for(let x=3;x<=7;x++)for(let y=7;y<=9;y++)for(let X=3;X<=7;X++)for(let Y=7;Y<=9;Y++){
    const a:[number,number]=[x,y],b:[number,number]=[X,Y];
    expect(arcadeDamPath(a,b,20,20,existing)).toEqual(arcadeDamPath(b,a,20,20,existing).reverse());
    if(x===X&&y===Y)expect(arcadeDamPath(a,b,20,20,existing)).toEqual([]);
  }
});
it('erhält einen kurzen Graben, wenn beide Enden auf dieselbe Zelle einrasten würden',()=>{
  const path=arcadeTrenchPath([4,10],[5,10],20,20,[204],[]);
  expect(path).toEqual(trenchPath([4,10],[5,10],20));
});

it('verbindet einen neuen Damm seitlich mit der Mitte eines bestehenden Damms',()=>{
  const existing=damPath([5,2],[5,10],20).map(f=>`${f.axis}:${f.index}`);
  const path=arcadeDamPath([6,6],[12,6],20,20,existing);
  expect(path).toEqual(damPath([5,6],[12,6],20));
  expect(path.every(f=>!existing.includes(`${f.axis}:${f.index}`))).toBe(true);
  expect(arcadeDamPath([12,6],[6,6],20,20,existing)).toEqual([...path].reverse());
});
