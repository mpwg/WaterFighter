import { describe, expect, it } from 'vitest';
import { advance, command, createGame, FIXED_DT, step } from '../src/core/game';
import { DEVICES, HOUSES, MAX_TIME, SLOTS, WAVES, pointOnRoute } from '../src/core/arena';
import type { DeviceKind, GameState } from '../src/core/types';
function running(){const s=createGame();command(s,{type:'start'});return s;}
function scenario(kinds:DeviceKind[]){
 const s=running();let spent=0;
 for(let t=0;t<MAX_TIME;t++){
  for(let i=0;i<SLOTS.length;i++)if(!s.devices.some(d=>d.slotId===SLOTS[i].id)){
   if(command(s,{type:'build',slotId:SLOTS[i].id,kind:kinds[i%kinds.length]}))spent+=DEVICES[kinds[i%kinds.length]].cost;
  }
  advance(s,1);
 }
 return {s,spent};
}
describe('deterministischer Arcade-Core',()=>{
 it('liefert fünf überlappende Wellen und eine zweite angekündigte Route',()=>{
  expect(WAVES).toHaveLength(5);expect(WAVES[0].at).toBe(5);expect(WAVES[2].warningAt).toBeLessThan(WAVES[2].at);
  expect(pointOnRoute('danube',0)).toEqual({x:-15,z:3});expect(pointOnRoute('wien',1)).toEqual({x:15,z:-4});
 });
 it('startet mit Energie für genau zwei Geräte und vollen Häusern',()=>{
  const s=running();expect(command(s,{type:'build',slotId:SLOTS[0].id,kind:'pump'})).toBe(true);
  expect(command(s,{type:'build',slotId:SLOTS[1].id,kind:'freeze'})).toBe(true);
  expect(command(s,{type:'build',slotId:SLOTS[2].id,kind:'cannon'})).toBe(false);expect(s.houses.every(h=>h.health===3)).toBe(true);
 });
 it('führt unabhängig von Zeitportionen dieselben festen Schritte aus',()=>{
  const a=running(),b=running();advance(a,20);for(let i=0;i<200;i++)advance(b,.1);expect(a).toEqual(b);
  expect(()=>step(a,.1)).toThrow();expect(FIXED_DT).toBe(1/30);
 });
 it('verbietet Aktionen und Zeitfortschritt in Pause; Reset ist identisch',()=>{
  const s=running();advance(s,8);command(s,{type:'pause'});const before=structuredClone(s);advance(s,10);expect(s).toEqual(before);
  expect(command(s,{type:'build',slotId:SLOTS[0].id,kind:'pump'})).toBe(false);
  expect(command(s,{type:'ability',kind:'cushion',houseId:s.houses[0].id})).toBe(false);
  command(s,{type:'resume'});advance(s,1);expect(s.time).toBe(9);command(s,{type:'reset'});expect(s).toEqual(createGame());
 });
 it('bedroht ungeschützte Häuser vor Sekunde 15 und zeigt drei Schadenstufen',()=>{
  const s=running();advance(s,14);const h=s.houses[0];expect(h.threatened).toBe(true);expect(h.damageIn).toBeGreaterThan(0);expect(h.health).toBe(3);
  advance(s,2);expect(h.health).toBe(2);advance(s,2);expect(h.health).toBe(1);advance(s,2);expect(h.health).toBe(0);
 });
 it('Schutz ist sofort bereit, unterbricht Kontakt und lädt 20 Sekunden',()=>{
  const s=running();advance(s,14);const h=s.houses[0];expect(h.contact).toBeGreaterThan(0);
  expect(command(s,{type:'ability',kind:'cushion',houseId:h.id})).toBe(true);expect(h.contact).toBe(0);advance(s,6);expect(h.health).toBe(3);
  expect(command(s,{type:'ability',kind:'cushion',houseId:h.id})).toBe(false);expect(s.cooldowns.cushion).toBe(34);
 });
 it('evakuiert nach Durchbruch in zwei Sekunden und hält Bewohner nach Gebäudeverlust sicher',()=>{
  const s=running();advance(s,14);const h=s.houses[0];expect(command(s,{type:'ability',kind:'boat',houseId:h.id})).toBe(true);
  advance(s,1);expect(h.evacuated).toBe(false);advance(s,1);expect(h.evacuated).toBe(true);expect(s.cooldowns.boat).toBe(39);
  advance(s,164);expect(h.health).toBe(0);expect(s.safeResidents).toBe(h.residents);expect(s.phase).toBe('lost');
 });
 it('rettet aus einem Haus mit einem Trefferpunkt genau vor dem nächsten Schaden',()=>{
  const s=running(),h=s.houses[0];while(h.health===3||h.health===2)step(s);
  expect(h.health).toBe(1);expect(command(s,{type:'ability',kind:'boat',houseId:h.id})).toBe(true);
  advance(s,2);expect(h.evacuated).toBe(true);expect(h.health).toBe(0);
  expect(command(s,{type:'ability',kind:'cushion',houseId:h.id})).toBe(false);
  expect(command(s,{type:'ability',kind:'boat',houseId:h.id})).toBe(false);
 });
 it('kombiniert alle drei Werkzeuge erfolgreich; Wasserwerfer verbessert frühe Abwehr',()=>{
  const three=scenario(['pump','freeze','cannon']);const two=scenario(['pump','freeze','pump']);
  expect(three.spent).toBe(two.spent);expect(three.s.safeResidents).toBe(16);expect(three.s.phase).toBe('won');
  expect(three.s.score).toBeGreaterThan(two.s.score);
 });
 it('verweigert Boote für unbedrohte oder zerstörte Häuser',()=>{
  const s=running();expect(command(s,{type:'ability',kind:'boat',houseId:s.houses[0].id})).toBe(false);advance(s,20);
  expect(command(s,{type:'ability',kind:'boat',houseId:s.houses[0].id})).toBe(false);
 });
 it('jede Geräteart hat genau einen Ausbau und belastet Energie korrekt',()=>{
  const s=running();command(s,{type:'build',slotId:SLOTS[0].id,kind:'pump'});s.energy=200;
  expect(command(s,{type:'upgrade',slotId:SLOTS[0].id})).toBe(true);expect(s.energy).toBe(135);
  expect(command(s,{type:'upgrade',slotId:SLOTS[0].id})).toBe(false);expect(s.devices[0].level).toBe(2);
 });
 it('Wasserwerfer verursacht keinen Stärkeschaden und stößt zurück',()=>{
  const s=running();command(s,{type:'build',slotId:SLOTS[0].id,kind:'cannon'});advance(s,8);
  expect(s.events.some(e=>e.type==='push')).toBe(true);expect(s.floods[0].strength).toBe(s.floods[0].maxStrength);
 });
 it('Nichtstun verliert früh; Schaden selbst erzeugt keinen Punktebonus',()=>{
  const s=running();advance(s,180);expect(s.phase).toBe('lost');expect(s.time).toBeLessThan(180);expect(s.safeResidents).toBe(0);expect(s.score).toBe(0);
 });
 it('gleiche Budgets und Kaufroutine: kombinierte Abwehr rettet mehr als alle Monokulturen',()=>{
  const pure=(['pump','freeze','cannon'] as const).map(kind=>scenario([kind]));const mixed=scenario(['pump','freeze','pump']);
  expect(pure.map(x=>x.spent)).toEqual([300,300,300]);expect(mixed.spent).toBe(300);
  expect(pure.map(x=>x.s.safeResidents)).toEqual([0,0,0]);expect(mixed.s.safeResidents).toBe(16);expect(mixed.s.phase).toBe('won');
  expect(mixed.s.completedWaves).toHaveLength(5);expect(mixed.s.time).toBeLessThanOrEqual(MAX_TIME);expect(HOUSES).toHaveLength(6);
 });
 it('identische Eingaben erzeugen identische Endzustände',()=>{
  expect(scenario(['pump','freeze','pump'])).toEqual(scenario(['pump','freeze','pump']));
 });
 it('verändert nach Rundenende weder Zeit noch Wertung',()=>{
  const s=running();advance(s,180);const snapshot=structuredClone(s);advance(s,180);step(s);expect(s).toEqual(snapshot);
 });
});
