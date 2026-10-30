import type { DeviceKind, DeviceSpec, HouseSpec, Route, Slot, Vec2, WaveSpec } from './types';
export const MAX_TIME = 180;
export const ROUTES: Route[] = [
 {id:'danube',name:'Donaukanal',points:[{x:-15,z:3},{x:-6,z:3},{x:0,z:0},{x:7,z:0},{x:15,z:3}],length:32},
 {id:'wien',name:'Wienfluss',points:[{x:0,z:-15},{x:0,z:-7},{x:4,z:-5},{x:8,z:-5},{x:15,z:-4}],length:32},
];
export function pointOnRoute(routeId:string, progress:number):Vec2 {
 const r=ROUTES.find(r=>r.id===routeId); if(!r) throw new Error('Unbekannte Route');
 const lengths=r.points.slice(1).map((p,i)=>Math.hypot(p.x-r.points[i].x,p.z-r.points[i].z));
 let d=Math.max(0,Math.min(1,progress))*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const t=d/lengths[i];return{x:r.points[i].x+(r.points[i+1].x-r.points[i].x)*t,z:r.points[i].z+(r.points[i+1].z-r.points[i].z)*t};}d-=lengths[i];}return {...r.points.at(-1)!};
}
export const SLOTS:Slot[]=ROUTES.flatMap(r=>[.18,.36,.53].map((progress,i)=>{const p=pointOnRoute(r.id,progress);return{id:`${r.id}-${i+1}`,routeId:r.id,progress,position:{x:p.x+(r.id==='wien'?2:0),z:p.z+(r.id==='danube'?2:0)}};}));
export const HOUSES:HouseSpec[]=ROUTES.flatMap(r=>[.30,.54,.76].map((progress,i)=>{const p=pointOnRoute(r.id,progress);return{id:`${r.id}-house-${i+1}`,name:`${r.id==='wien'?'Wieden':'Leopoldstadt'} ${i+1}`,routeId:r.id,progress,position:{x:p.x+(r.id==='wien'?-2:0),z:p.z+(r.id==='danube'?-2:0)},residents:4};}));
export const DEVICES:Record<DeviceKind,DeviceSpec>={
 pump:{name:'Wirbelpumpe',description:'Entzieht der Flut Stärke.',cost:50,upgradeCost:65,range:.17,upgradedRange:.22,interval:1,power:.65,upgradedPower:1.15,color:'#ffbd55'},
 freeze:{name:'Gefriergerät',description:'Verlangsamt die Flut für drei Sekunden.',cost:50,upgradeCost:55,range:.17,upgradedRange:.23,interval:2,power:.38,upgradedPower:.22,color:'#7ee9ff'},
 cannon:{name:'Wasserwerfer',description:'Schiebt die vorderste Flut zurück.',cost:50,upgradeCost:60,range:.17,upgradedRange:.22,interval:3,power:.045,upgradedPower:.075,color:'#ce9aff'},
};
const spawn=(routeId:string,strength:number,speed:number,length:number,delay=0)=>({routeId,strength,speed,length,delay});
export const WAVES:WaveSpec[]=[
 {id:1,name:'Erste Flut',at:5,warningAt:0,spawns:[spawn('danube',8,.037,.24)]},
 {id:2,name:'Schnelle Wellen',at:30,warningAt:24,spawns:[spawn('danube',5,.065,.18),spawn('danube',5,.065,.18,6)]},
 {id:3,name:'Zweiter Zufluss',at:53,warningAt:43,spawns:[spawn('wien',12,.04,.26)]},
 {id:4,name:'Doppelte Gefahr',at:78,warningAt:70,spawns:[spawn('danube',14,.04,.28),spawn('wien',10,.055,.22,4)]},
 {id:5,name:'Schlussflut',at:116,warningAt:105,spawns:[spawn('danube',22,.035,.32),spawn('wien',22,.035,.32,3)]},
];
