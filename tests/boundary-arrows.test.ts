import {expect,it} from 'vitest';
import {boundaryArrowLines,boundaryArrows} from '../src/render/boundary-arrows';
import type {Scenario} from '../src/scenario';

it('markiert zusammenhängende Zuflussbereiche und ausschließlich konfigurierte offene Ränder',()=>{
 const scenario={grid:{width:10,height:8},parameters:{inflowCells:[1,2,3,7,70],outflowEdges:['right','bottom']}} as unknown as Scenario;
 const arrows=boundaryArrows(scenario);
 expect(arrows.filter(a=>a.kind==='inflow')).toEqual([
  {edge:'top',position:2.5,kind:'inflow'}, {edge:'top',position:7.5,kind:'inflow'}, {edge:'bottom',position:0.5,kind:'inflow'},
 ]);
 expect(arrows.filter(a=>a.kind==='outflow').map(a=>a.edge)).toEqual(['bottom','bottom','bottom','right','right','right']);
});

it('richtet Pfeile für Zu- und Abfluss zu beiden Seiten des Modellrands aus',()=>{
 const inLine=boundaryArrowLines({edge:'top',position:2,kind:'inflow'},10,8,4)[0];
 const outLine=boundaryArrowLines({edge:'top',position:2,kind:'outflow'},10,8,4)[0];
 expect(inLine).toEqual([[8,-28],[8,28]]);expect(outLine).toEqual([[8,28],[8,-28]]);
 const right=boundaryArrowLines({edge:'right',position:4,kind:'outflow'},10,8,4)[0];
 expect(right).toEqual([[12,16],[68,16]]);
});
