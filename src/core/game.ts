import { DEVICES, HOUSES, MAX_TIME, SLOTS, WAVES, pointOnRoute } from './arena';
import type { Command, GameEvent, GameState } from './types';
export const FIXED_DT=1/30;
const remainder=new WeakMap<GameState,number>();
function event(s:GameState,type:GameEvent['type'],targetId?:string,message?:string,position?:GameEvent['position']){s.events.push({id:s.nextEventId++,time:s.time,type,targetId,message,position});if(s.events.length>160)s.events.shift();}
function safe(s:GameState){s.safeResidents=s.houses.filter(h=>h.evacuated||h.health>0).reduce((a,h)=>a+h.residents,0);}
export function createGame():GameState{return{time:0,tick:0,phase:'ready',energy:100,score:0,houses:HOUSES.map(h=>({...h,position:{...h.position},health:3,evacuated:false,shieldUntil:0,evacuationAt:null,contact:0,threatened:false,damageIn:null})),devices:[],floods:[],cooldowns:{cushion:0,boat:0},events:[],completedWaves:[],warnedWaves:[],spawned:[],safeResidents:HOUSES.reduce((a,h)=>a+h.residents,0),totalResidents:HOUSES.reduce((a,h)=>a+h.residents,0),nextEventId:1,lastError:null};}
export function command(s:GameState,c:Command):boolean{
 const fail=(message:string)=>{s.lastError=message;return false;};
 if(c.type==='reset'){Object.assign(s,createGame());remainder.delete(s);return true;}
 if(c.type==='start'){if(s.phase!=='ready')return fail('Runde läuft bereits.');s.phase='running';s.lastError=null;return true;}
 if(c.type==='pause'){if(s.phase!=='running')return false;s.phase='paused';return true;}
 if(c.type==='resume'){if(s.phase!=='paused')return false;s.phase='running';return true;}
 if(s.phase!=='running')return fail('Starte die Runde oder setze sie fort.');
 if(c.type==='build'){
  if(!Object.hasOwn(DEVICES,c.kind))return fail('Unbekanntes Gerät.');
  const slot=SLOTS.find(x=>x.id===c.slotId),spec=DEVICES[c.kind];
  if(!slot||s.devices.some(d=>d.slotId===c.slotId))return fail('Bauplatz nicht frei.');
  if(s.energy<spec.cost)return fail('Zu wenig Energie.');
  s.energy-=spec.cost;s.devices.push({slotId:c.slotId,kind:c.kind,level:1,nextFire:s.time});event(s,'build',c.slotId,undefined,slot.position);
 }else if(c.type==='upgrade'){
  const d=s.devices.find(d=>d.slotId===c.slotId);if(!d||d.level===2)return fail('Kein Ausbau möglich.');const spec=DEVICES[d.kind];if(s.energy<spec.upgradeCost)return fail('Zu wenig Energie.');s.energy-=spec.upgradeCost;d.level=2;event(s,'upgrade',d.slotId);
 }else if(c.type==='ability'){
  const h=s.houses.find(h=>h.id===c.houseId);if(!h||h.health<=0)return fail('Haus bereits verloren.');if(!Object.hasOwn(s.cooldowns,c.kind)||s.cooldowns[c.kind]>s.time)return fail('Fähigkeit lädt noch.');
  if(c.kind==='cushion'){h.shieldUntil=s.time+6;h.contact=0;h.damageIn=null;s.cooldowns.cushion=s.time+20;event(s,'shield',h.id,undefined,h.position);}
  else{if(h.evacuated||h.evacuationAt!==null||!h.threatened)return fail('Wähle ein bedrohtes Haus mit Bewohnern.');h.evacuationAt=s.time+2;s.cooldowns.boat=s.time+25;event(s,'rescue-start',h.id,undefined,h.position);}
 }
 s.lastError=null;return true;
}
function finish(s:GameState){safe(s);s.phase=s.safeResidents>=s.totalResidents/2?'won':'lost';s.score+=s.houses.filter(h=>h.health>0).length*100;event(s,'finish',undefined,s.phase==='won'?'Wien ist gerettet!':'Die Flut war stärker.');}
export function step(s:GameState,dt=FIXED_DT):void{
 if(dt!==FIXED_DT)throw new Error('step benötigt den festen Zeitschritt 1/30.');if(s.phase!=='running')return;
 s.tick++;s.time=s.tick*FIXED_DT;s.energy=Math.min(250,s.energy+FIXED_DT*2);
 for(const w of WAVES){
  if(s.time>=w.warningAt&&!s.warnedWaves.includes(w.id)){s.warnedWaves.push(w.id);event(s,'warning',undefined,w.name);}
  w.spawns.forEach((spawn,i)=>{const id=`${w.id}-${i}`;if(s.time>=w.at+spawn.delay&&!s.spawned.includes(id)){s.spawned.push(id);s.floods.push({...spawn,id,waveId:w.id,progress:0,maxStrength:spawn.strength,frozenUntil:0,pushedAt:-1,spawnedAt:s.time});event(s,'spawn',id,w.name,pointOnRoute(spawn.routeId,0));}});
 }
 for(const d of s.devices){
  if(s.time+1e-8<d.nextFire)continue;
  const slot=SLOTS.find(x=>x.id===d.slotId)!,spec=DEVICES[d.kind],range=d.level===2?spec.upgradedRange:spec.range;
  const targets=s.floods.filter(f=>f.strength>0&&f.routeId===slot.routeId&&Math.abs(f.progress-slot.progress)<=range).sort((a,b)=>b.progress-a.progress||a.id.localeCompare(b.id));
  if(!targets.length)continue;
  const f=targets[0],power=d.level===2?spec.upgradedPower:spec.power;d.nextFire=s.time+spec.interval;
  if(d.kind==='pump'){f.strength=Math.max(0,f.strength-power);event(s,'pump',f.id,undefined,pointOnRoute(f.routeId,f.progress));}
  else if(d.kind==='freeze'){f.frozenUntil=s.time+3;f.frozenFactor=power;event(s,'freeze',f.id,undefined,pointOnRoute(f.routeId,f.progress));}
  else{f.progress=Math.max(0,f.progress-power);f.pushedAt=s.time;event(s,'push',f.id,undefined,pointOnRoute(f.routeId,f.progress));}
 }
 for(const f of s.floods){if(f.strength<=0){s.score+=Math.round(50*Math.max(0,1-f.progress));event(s,'defeated',f.id,undefined,pointOnRoute(f.routeId,f.progress));}else{
  f.progress+=f.speed*FIXED_DT*(s.time<f.frozenUntil?(f.frozenFactor??DEVICES.freeze.power):1);
 }}
 s.floods=s.floods.filter(f=>f.strength>0&&f.progress<=1+f.length);
 for(const h of s.houses){
  if(h.health<=0){h.threatened=false;h.damageIn=null;continue;}
  // Rescue completes before this tick's damage: a two-second evacuation can save residents on the next hit.
  if(h.evacuationAt!==null&&s.time+1e-8>=h.evacuationAt){h.evacuated=true;h.evacuationAt=null;event(s,'rescue',h.id,undefined,h.position);}
  h.threatened=s.floods.some(f=>f.routeId===h.routeId&&f.progress>=h.progress&&f.progress-f.length<=h.progress);
  if(h.threatened&&s.time>=h.shieldUntil){h.contact+=FIXED_DT;h.damageIn=Math.max(0,2-h.contact);if(h.contact+1e-8>=2){h.health--;h.contact=0;h.damageIn=2;event(s,h.health===0?'lost':'damage',h.id,undefined,h.position);if(h.health===0){h.evacuationAt=null;h.threatened=false;h.damageIn=null;}}}
  else{h.contact=0;h.damageIn=null;}
 }
 for(const w of WAVES){if(!s.completedWaves.includes(w.id)&&w.spawns.every((_,i)=>s.spawned.includes(`${w.id}-${i}`))&&!s.floods.some(f=>f.waveId===w.id)){s.completedWaves.push(w.id);s.energy=Math.min(250,s.energy+35);event(s,'wave-clear',undefined,`${w.name} abgeschlossen`);}}
 safe(s);if(s.safeResidents===0||s.time>=MAX_TIME||s.completedWaves.length===WAVES.length)finish(s);
}
export function advance(s:GameState,seconds:number):void{
 if(!Number.isFinite(seconds)||seconds<0)throw new Error('Ungültige Zeitspanne.');if(s.phase!=='running')return;
 let rest=(remainder.get(s)??0)+seconds;const ticks=Math.floor((rest+1e-9)/FIXED_DT);rest-=ticks*FIXED_DT;remainder.set(s,Math.max(0,rest));for(let i=0;i<ticks&&s.phase==='running';i++)step(s);
}
