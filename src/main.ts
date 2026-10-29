import { isReady, type Response } from './protocol';
import { validateScenario } from './scenario';
import { World } from './render/world';
import type { Scenario } from './scenario';
import type { Action } from './simulation/game';
import { damPath, trenchPath } from './simulation/path';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<canvas aria-label="Kartenansicht des Wiener Szenarioentwurfs"></canvas>
  <header class="topbar"><div><span class="eyebrow">WIEN · BRIGITTENAU</span><h1>WaterFighter</h1></div><span class="badge">ENTWURF</span></header>
  <section class="panel" aria-label="Simulationsstatus"><span class="eyebrow">SZENARIOENTWURF</span><h2>Schütze das Viertel.</h2><p>Schütze das Viertel mit Dämmen, Gräben und gezieltem Abriss. Plane ohne Zeitdruck und starte dann die Flut. Ziel: höchstens <span id="target">–</span> Schaden.</p><p id="message" role="status">Szenario wird geladen …</p><div class="readouts"><div><span>ZEIT</span><strong id="time">00:00</strong></div><div><span>BUDGET</span><strong id="budget">–</strong></div><div><span>ZUSTAND</span><strong id="state">Lädt</strong></div></div><div class="tools" aria-label="Werkzeuge"><button data-mode="camera" aria-pressed="true">Karte</button><button data-mode="dam" aria-pressed="false">Damm</button><button data-mode="trench" aria-pressed="false">Graben</button><button data-mode="demolish" aria-pressed="false">Abriss</button></div><div id="preview" class="preview" hidden><p id="preview-text"></p><button id="confirm" disabled>Bestätigen</button> <button id="cancel">Verwerfen</button></div><div class="actions"><button id="run" disabled>Simulation starten</button><button id="reset" disabled>Neustart</button><button id="speed" disabled>1×</button></div></section>
  <section id="result" class="result" role="dialog" aria-labelledby="result-title" hidden><span class="eyebrow">RUNDE BEENDET</span><h2 id="result-title"></h2><p id="result-details"></p><button id="again">Neue Runde</button></section>
  <div class="map-controls" aria-label="Kartensteuerung"><button id="zoom-in" aria-label="Vergrößern">+</button><button id="zoom-out" aria-label="Verkleinern">−</button></div>
  <footer><details class="help"><summary>So wird gespielt</summary><p>Im Kartenmodus verschieben oder eine Stelle für Wassertiefe und Gebäudeschaden antippen. Mit + und − zoomen. Für Damm und Graben jeweils Start und Ende, für Abriss ein Gebäude wählen. Kosten prüfen und bestätigen. Die Flut ist pausierbar; 1×/2× ändert die Geschwindigkeit.</p></details><span>Verschieben: Karte ziehen · Zoom: + / −</span><details><summary>Quellen & Hinweise</summary><p>© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a> (ODbL). Datenquelle: Stadt Wien – data.wien.gv.at (CC BY 4.0). Gewässersohle und Spielereignis sind vereinfacht; keine Hochwasserprognose.</p></details></footer>`;
const canvas=app.querySelector('canvas')!;
const message=app.querySelector<HTMLParagraphElement>('#message')!;
const run=app.querySelector<HTMLButtonElement>('#run')!, reset=app.querySelector<HTMLButtonElement>('#reset')!, speedButton=app.querySelector<HTMLButtonElement>('#speed')!;
const timeLabel=app.querySelector<HTMLElement>('#time')!, stateLabel=app.querySelector<HTMLElement>('#state')!;
type Mode='camera'|'dam'|'trench'|'demolish';
let world:World|undefined, scenario:Scenario|undefined, round=0, running=false, finished=false, speed:1|2=1;
let mode:Mode='camera', first:{x:number;y:number}|undefined, draft:Action|undefined, previewId='', serial=0, awaiting=false;
const resultPanel=app.querySelector<HTMLElement>('#result')!, resultTitle=app.querySelector<HTMLElement>('#result-title')!, resultDetails=app.querySelector<HTMLElement>('#result-details')!;
app.querySelector<HTMLButtonElement>('#again')!.onclick=()=>{if(round)worker.postMessage({type:'reset',round});};
const preview=app.querySelector<HTMLDivElement>('#preview')!,previewText=app.querySelector<HTMLElement>('#preview-text')!,confirm=app.querySelector<HTMLButtonElement>('#confirm')!,budgetLabel=app.querySelector<HTMLElement>('#budget')!;
function clearDraft() {first=undefined;draft=undefined;previewId='';awaiting=false;preview.hidden=true;confirm.disabled=true;world?.showPreview();}
function chooseMode(next:Mode) { mode=next;clearDraft(); for(const b of app.querySelectorAll<HTMLButtonElement>('[data-mode]')) b.setAttribute('aria-pressed',String(b.dataset.mode===mode)); message.textContent=mode==='camera'?'Karte verschieben und zoomen.':mode==='demolish'?'Gebäude auf der Karte antippen.':'Start und Ende auf der Karte antippen.'; }
for(const b of app.querySelectorAll<HTMLButtonElement>('[data-mode]')) b.onclick=()=>chooseMode(b.dataset.mode as Mode);
app.querySelector<HTMLButtonElement>('#cancel')!.onclick=clearDraft;
confirm.onclick=()=>{if(!draft||!round||awaiting)return;awaiting=true;confirm.disabled=true;worker.postMessage({type:'action',round,id:previewId,action:draft});};
function showDraft(action:Action) {if(!round)return; draft=action;previewId=`${round}-${++serial}`;preview.hidden=false;confirm.disabled=true;previewText.textContent='Kosten werden geprüft …';world?.showPreview(action);worker.postMessage({type:'preview',round,id:previewId,action});}
function pathAction(a:{x:number;y:number},b:{x:number;y:number}):Action|undefined {
  if(!scenario)return; const {width:w,height:h,cellSize:c}=scenario.grid;
  if(mode==='trench') {
    let x=Math.max(0,Math.min(w-1,Math.floor(a.x/c))),y=Math.max(0,Math.min(h-1,Math.floor(a.y/c)));
    const tx=Math.max(0,Math.min(w-1,Math.floor(b.x/c))),ty=Math.max(0,Math.min(h-1,Math.floor(b.y/c)));return {kind:'trench',cells:trenchPath([x,y],[tx,ty],w)};
  }
  if(mode==='dam') {
    let x=Math.max(0,Math.min(w,Math.round(a.x/c))),y=Math.max(0,Math.min(h,Math.round(a.y/c)));
    const tx=Math.max(0,Math.min(w,Math.round(b.x/c))),ty=Math.max(0,Math.min(h,Math.round(b.y/c)));const faces=damPath([x,y],[tx,ty],w);
    return faces.length?{kind:'dam',faces}:undefined;
  }
}
function selectAt(x:number,y:number) {
  if(!world||!scenario||awaiting||finished)return;
  if(mode==='demolish') {const hit=world.pick(x,y,true);if(hit?.buildingId) showDraft({kind:'demolish',buildingId:hit.buildingId});else message.textContent='Bitte ein Gebäude auswählen.';return;}
  const hit=world.pick(x,y);if(!hit){message.textContent='Bitte innerhalb der Karte auswählen.';return;}
  if(!first){first=hit;message.textContent='Endpunkt auf der Karte antippen.';return;}
  const action=pathAction(first,hit);first=undefined;if(action)showDraft(action);else message.textContent='Bitte einen längeren Verlauf wählen.';
}
const worker=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
function fail(text:string) { running=false; run.disabled=true; speedButton.disabled=true; message.textContent=text; stateLabel.textContent='Fehler'; }
worker.onmessage=(event:MessageEvent<Response>)=>{
  const data=event.data;
  if(isReady(data)) {
    round=data.round; running=false; finished=false; speed=1; clearDraft(); resultPanel.hidden=true; run.textContent='Simulation starten'; speedButton.textContent='1×';
    run.disabled=false; reset.disabled=false; speedButton.disabled=false;
    message.textContent='Wiener Szenario geladen. Die Wasserberechnung ist bereit.'; stateLabel.textContent='Vorbereitung'; timeLabel.textContent='00:00';
  } else if(data.type==='snapshot') {
    if(data.round===round && world) {
      const n=data.buffer.byteLength/16;
      world.updateState(new Float32Array(data.buffer,n*12,n),data.buildings,data.dams,data.revision); world.updateWater(new Float32Array(data.buffer,0,n),new Float32Array(data.buffer,n*4,n),new Float32Array(data.buffer,n*8,n)); budgetLabel.textContent=Math.round(data.budget).toLocaleString('de-AT'); running=data.running;
      const seconds=Math.floor(data.time); timeLabel.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
      stateLabel.textContent=finished?'Beendet':running?'Läuft':data.time===0?'Vorbereitung':'Pausiert'; run.textContent=running?'Pause':data.time===0?'Simulation starten':'Fortsetzen';
      if(data.backlog>2) message.textContent=`Simulation holt ${data.backlog.toFixed(1)} s Rückstand auf.`;
    }
    worker.postMessage({type:'recycle',round:data.round,buffer:data.buffer},[data.buffer]);
  } else if(data.type==='action-result' && data.round===round && data.id===previewId) {
    if(data.preview) {confirm.disabled=!data.result.ok;previewText.textContent=data.result.ok?`Kosten: ${data.result.cost} · Budget danach: ${data.result.budget}`:data.result.reason;}
    else {awaiting=false;if(data.result.ok){message.textContent=`Maßnahme bestätigt. Kosten: ${data.result.cost}.`;clearDraft();}else{previewText.textContent=data.result.reason;confirm.disabled=true;}}
  }
  else if(data.type==='result' && data.round===round) { running=false; finished=true; clearDraft();run.disabled=true; stateLabel.textContent='Beendet'; message.textContent='Die Runde ist beendet.';
    const number=(n:number)=>Math.round(n).toLocaleString('de-AT');
    resultTitle.textContent=data.achieved?'Schadensziel erreicht':'Schadensziel verfehlt';
    resultDetails.textContent=`Flutschäden: ${number(data.floodDamage)} · Abrissverluste: ${number(data.demolitionLoss)} · Gesamtschaden: ${number(data.totalDamage)} · Ziel: höchstens ${number(data.target)} · Budgetrest: ${number(data.budget)}.`;
    resultPanel.hidden=false;
  }
  else if(data.type==='error' && data.round===round) fail(`Simulation angehalten: ${data.message}`);
};
worker.onerror=()=>fail('Der Worker ist ausgefallen. Bitte die Seite neu laden.');
run.onclick=()=>{ if(!round)return; worker.postMessage({type:running?'pause':'start',round}); };
reset.onclick=()=>{ if(round) worker.postMessage({type:'reset',round}); };
speedButton.onclick=()=>{ if(!round)return; speed=speed===1?2:1; speedButton.textContent=`${speed}×`; worker.postMessage({type:'speed',round,speed}); };
app.querySelector<HTMLButtonElement>('#zoom-in')!.onclick=()=>world?.setZoom(0.8);
app.querySelector<HTMLButtonElement>('#zoom-out')!.onclick=()=>world?.setZoom(1.25);
let pointer: {id:number;x:number;y:number;startX:number;startY:number}|undefined;
canvas.addEventListener('pointerdown',e=>{pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(pointer?.id===e.pointerId && mode==='camera'){world?.pan(e.clientX-pointer.x,e.clientY-pointer.y);pointer.x=e.clientX;pointer.y=e.clientY;}});
canvas.addEventListener('pointerup',e=>{if(pointer?.id===e.pointerId) {if(mode!=='camera') selectAt(e.clientX,e.clientY); else if(Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)<5) message.textContent=world?.inspect(e.clientX,e.clientY)??'Karte ist noch nicht bereit.';}pointer=undefined;}); canvas.addEventListener('pointercancel',()=>{pointer=undefined;});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(round)worker.postMessage({type:'pause',round});fail('Grafikkontext verloren. Bitte Seite neu laden.');});
fetch(`${import.meta.env.BASE_URL}scenarios/brigittenau-v1.json`).then(async response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return validateScenario(await response.json());}).then(loaded=>{
  scenario=loaded;app.querySelector<HTMLElement>('#target')!.textContent=loaded.parameters.damageTarget.toLocaleString('de-AT');world=new World(canvas,loaded); worker.postMessage({type:'init',scenario:loaded});
}).catch((error:unknown)=>fail(`Szenario oder Grafik konnte nicht geladen werden: ${error instanceof Error?error.message:String(error)}`));
