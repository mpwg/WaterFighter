/** Track the last valid pick for one captured pointer; terminal events work off terrain. */
export function createPointerTrack<T>(emit:(phase:'down'|'move'|'up'|'cancel',value:T,event:PointerEvent)=>void) {
 let active:number|undefined,last:T|undefined;
 return (phase:'down'|'move'|'up'|'cancel',event:PointerEvent,pick?:T)=>{
  if(phase==='down') {if(active!==undefined||pick===undefined)return;active=event.pointerId;last=pick;emit(phase,pick,event);return;}
  if(phase==='move') {if(active!==undefined&&event.pointerId!==active)return;if(pick!==undefined){if(active!==undefined)last=pick;emit(phase,pick,event);}return;}
  if(event.pointerId!==active)return;
  const value=pick??last;active=undefined;last=undefined;
  if(value!==undefined)emit(phase,value,event);
 };
}
