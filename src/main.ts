import { isReady, type Response } from './protocol';
import { validateScenario } from './scenario';
import { World } from './render/world';
import { displayDamage } from './render/building-status';
import type { Scenario } from './scenario';
import type { Action } from './simulation/game';
import { arcadeDamPath, arcadeTrenchPath } from './simulation/path';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<canvas aria-label="Kartenansicht des Wiener Szenarioentwurfs"></canvas>
  <header class="topbar"><div><span class="eyebrow">WIEN · BRIGITTENAU</span><h1>WaterFighter</h1></div><span class="badge">ENTWURF</span><button id="panel-toggle" aria-controls="game-panel" aria-expanded="true">Menü ausblenden</button></header>
  <section id="game-panel" class="panel" aria-label="Simulationsstatus"><span class="eyebrow">SZENARIOENTWURF</span><h2>Schütze das Viertel.</h2><p>Schütze das Viertel mit Dämmen, Gräben und gezieltem Abriss. Plane ohne Zeitdruck und starte dann die Flut. Ziel: höchstens <span id="target">–</span> Schaden.</p><p id="message" role="status">Szenario wird geladen …</p><div class="readouts"><div><span>ZEIT</span><strong id="time">00:00</strong></div><div><span>BUDGET</span><strong id="budget">–</strong></div><div><span>ZUSTAND</span><strong id="state">Lädt</strong></div></div><div class="tools" aria-label="Werkzeuge"><button data-mode="camera" aria-pressed="true">Karte</button><button data-mode="dam" aria-pressed="false">Damm</button><button data-mode="trench" aria-pressed="false">Graben</button><button data-mode="demolish" aria-pressed="false">Abriss</button></div><div class="actions"><button id="run" disabled>Simulation starten</button><button id="reset" disabled>Neustart</button><button id="speed" disabled>1×</button></div></section>
  <div id="preview" class="preview" hidden><p id="preview-text"></p><button id="confirm" disabled>Bestätigen</button> <button id="cancel">Verwerfen</button></div>
  <section id="result" class="result" role="dialog" aria-labelledby="result-title" hidden><span class="eyebrow">RUNDE BEENDET</span><h2 id="result-title"></h2><p id="result-details"></p><button id="again">Neue Runde</button></section>
  <div class="map-controls" aria-label="Kartensteuerung"><button id="zoom-in" aria-label="Vergrößern">+</button><button id="zoom-out" aria-label="Verkleinern">−</button></div>
  <footer><div class="credits">© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a> · Datenquelle: <a href="https://data.wien.gv.at/">Stadt Wien – data.wien.gv.at</a></div><details class="help"><summary>So wird gespielt</summary><p>Karte durch Ziehen verschieben und mit + und − zoomen. Im Kartenmodus eine Stelle für Wassertiefe und Gebäudeschaden antippen. Für Damm und Graben jeweils Start und Ende wählen; ein Kreuz markiert den Startpunkt. Für Abriss ein Gebäude auswählen. Abriss zählt den Gebäudewert als Verlust und öffnet den Grundriss für Wasser. Vergleiche, welche Gebäude dadurch betroffen sein können: Ist das Gebäude bereits geschützt, kann der Abriss zusätzlichen Schaden verursachen. Bei kleinen Gebäuden genügt ein naher Treffer, sofern das Ziel eindeutig ist; ein Kreuz markiert die Auswahl. Kosten und Hinweise zur Geländeveränderung prüfen und bestätigen. Ein weiterer Kartentipp verwirft eine unbestätigte Vorschau und beginnt eine neue Auswahl. Bestätigte Gräben sind braun markiert; ein schematisches goldgelbes Band zeigt ihren Verlauf auch über Wasser und Gebäuden. Dämme erscheinen als breite orange Bänder; ihre Breite ist eine schematische Darstellung der Sperrkanten. Pfeile zeigen die berechnete Strömungsrichtung: auf dem Wasser hell, entlang bestätigter Gräben dunkelblau. Blaue Pfeile zeigen, wo die Flut eintritt; violette Pfeile markieren offene Modellränder und Randanschlüsse von Gräben, nicht einen tatsächlich gemessenen Abfluss. Plane Dämme quer zum anströmenden Wasser, um Gebäude abzuschirmen. Ein Graben kann Wasser zu einem offenen Rand ableiten; prüfe seinen Verlauf und Hindernisse. Endet er eine Zelle vor einem offenen Rand, weist die Vorschau darauf hin. Die Strömungspfeile zeigen die örtliche Richtung; außerhalb des Modellrands wird das Wasser nicht weiter berechnet. Beobachte die Flut und frage gefährdete Gebäude im Kartenmodus ab. Auf Wasser zeigt die Abfrage auch den Wasserspiegel: Vergleiche ihn auf beiden Seiten eines Damms, um Rückstau zu erkennen. Du kannst jederzeit pausieren, Maßnahmen bestätigen und danach weiterlaufen lassen. Gebäude antippen zeigt Zustand und Schaden: Gelb steht für gefährdet, Orange für beschädigt, Dunkel für vollständigen Verlust. Gefährdet bedeutet mindestens 5 cm Wasser am Rand und weniger als 5 % Schaden. Die Flut ist pausierbar; 1×/2× ändert die Geschwindigkeit.</p></details><span>Verschieben: Karte ziehen · Zoom: + / −</span><details><summary>Quellen & Hinweise</summary><p>OSM-Daten und abgeleitete Geometrien: <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL 1.0</a>. Wiener Geländedaten: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Gewässersohle und Spielereignis sind vereinfacht; Wasser außerhalb des Modellrands wird nicht berechnet. Keine Hochwasserprognose oder reale Schutzempfehlung. <a href="${import.meta.env.BASE_URL}scenarios/DATENQUELLEN.md">Datenquellen und Änderungen</a> · <a href="${import.meta.env.BASE_URL}scenarios/brigittenau-v1.json.bin" download>Szenariodaten (gzip)</a> · <a href="https://github.com/mpwg/WaterFighter/blob/main/docs/geodaten-voruntersuchung.md">Aufbereitung und Prüfsummen</a>.</p></details></footer>`;
const canvas=app.querySelector('canvas')!;
const boundaryLegend=document.createElement('div');boundaryLegend.className='boundary-legend';boundaryLegend.innerHTML='<span class="inflow-key">↑ Zufluss</span> · <span class="outflow-key">↗ offener Modellrand</span>';
app.querySelector('footer .credits')!.after(boundaryLegend);
const help=app.querySelector<HTMLDetailsElement>('footer .help')!;help.id='game-help';
const compactHelp=document.createElement('button');compactHelp.id='compact-help';compactHelp.textContent='Hilfe';compactHelp.setAttribute('aria-controls',help.id);compactHelp.setAttribute('aria-expanded','false');app.append(compactHelp);
compactHelp.onclick=()=>{help.open=!help.open;if(help.open)help.querySelector('summary')!.scrollIntoView({block:'start'});else app.querySelector('footer')!.scrollTop=0;};
help.addEventListener('toggle',()=>compactHelp.setAttribute('aria-expanded',String(help.open)));
const damageSummary=document.createElement('div');damageSummary.className='damage-summary';damageSummary.setAttribute('aria-label','Aktuelle Schäden');
damageSummary.innerHTML='<strong id="damage-total">Schaden – / –</strong><span id="damage-breakdown">Flut – · Abriss –</span><span id="compact-status" hidden>– · Budget – · Lädt</span>';
app.querySelector('.topbar h1')!.after(damageSummary);
const damageTotal=damageSummary.querySelector<HTMLElement>('#damage-total')!,damageBreakdown=damageSummary.querySelector<HTMLElement>('#damage-breakdown')!;
const panelToggle=app.querySelector<HTMLButtonElement>('#panel-toggle')!,gamePanel=app.querySelector<HTMLElement>('#game-panel')!,compactStatus=app.querySelector<HTMLElement>('#compact-status')!;
const inspection=document.createElement('div');inspection.id='inspection';inspection.className='inspection';inspection.setAttribute('role','status');inspection.hidden=true;const toolHint=document.createElement('div');toolHint.id='tool-hint';toolHint.className='inspection';toolHint.setAttribute('role','status');toolHint.hidden=true;canvas.after(inspection,toolHint);
panelToggle.onclick=()=>{const open=panelToggle.getAttribute('aria-expanded')==='true';gamePanel.hidden=open;compactStatus.hidden=!open;inspection.hidden=!open||!inspection.textContent;panelToggle.setAttribute('aria-expanded',String(!open));panelToggle.textContent=open?'Menü anzeigen':'Menü ausblenden';syncToolHint();};
const message=app.querySelector<HTMLParagraphElement>('#message')!;
const reloadButton=document.createElement('button');
reloadButton.textContent='Seite neu laden';reloadButton.hidden=true;reloadButton.onclick=()=>location.reload();message.after(reloadButton);
const run=app.querySelector<HTMLButtonElement>('#run')!, reset=app.querySelector<HTMLButtonElement>('#reset')!, speedButton=app.querySelector<HTMLButtonElement>('#speed')!;
const timeLabel=app.querySelector<HTMLElement>('#time')!, stateLabel=app.querySelector<HTMLElement>('#state')!;
type Mode='camera'|'dam'|'trench'|'demolish';
let world:World|undefined, scenario:Scenario|undefined, round=0, running=false, finished=false, fatalError=false, speed:1|2=1;
const pendingPresentation=new Map<string,{round:number;confirmedAt:number;confirmedRunning:boolean;confirmedSpeed:1|2;confirmedVisible:boolean;revision?:number;scheduled?:boolean}>();
let visibleDams:string[]=[],visibleTrenches:number[]=[];
let mode:Mode='camera', modeRevision=0, first:{x:number;y:number}|undefined, draft:Action|undefined, previewId='', serial=0, awaiting=false;
let confirmationTimer:ReturnType<typeof setTimeout>|undefined;
let backlogActive=false, backlogMessageVisible=false;
const resultPanel=app.querySelector<HTMLElement>('#result')!, resultTitle=app.querySelector<HTMLElement>('#result-title')!, resultDetails=app.querySelector<HTMLElement>('#result-details')!;
app.querySelector<HTMLButtonElement>('#again')!.onclick=()=>{if(round)worker?.postMessage({type:'reset',round});};
const preview=app.querySelector<HTMLDivElement>('#preview')!,previewText=app.querySelector<HTMLElement>('#preview-text')!,confirm=app.querySelector<HTMLButtonElement>('#confirm')!,cancel=app.querySelector<HTMLButtonElement>('#cancel')!,budgetLabel=app.querySelector<HTMLElement>('#budget')!;
function syncToolHint(){
  const cameraBacklog=mode==='camera'&&backlogMessageVisible&&gamePanel.hidden&&!finished&&!fatalError;
  if(cameraBacklog)inspection.hidden=true;
  else if(mode==='camera'&&gamePanel.hidden&&inspection.textContent&&!finished&&!fatalError)inspection.hidden=false;
  toolHint.textContent=message.textContent;
  toolHint.hidden=!gamePanel.hidden||(mode==='camera'&&!cameraBacklog)||!preview.hidden||finished||fatalError||!toolHint.textContent;
}
function setMessage(text:string,backlog=false){if(confirmationTimer!==undefined){clearTimeout(confirmationTimer);confirmationTimer=undefined;}backlogMessageVisible=backlog;message.textContent=text;syncToolHint();}
function setAwaiting(value:boolean) {awaiting=value;cancel.disabled=value;for(const button of app.querySelectorAll<HTMLButtonElement>('[data-mode]')) button.disabled=value||fatalError;}
function clearDraft() {first=undefined;draft=undefined;previewId='';setAwaiting(false);preview.hidden=true;confirm.disabled=true;world?.showPreview();syncToolHint();}
function chooseMode(next:Mode) { mode=next;modeRevision++;inspection.hidden=true;inspection.textContent='';clearDraft(); for(const b of app.querySelectorAll<HTMLButtonElement>('[data-mode]')) b.setAttribute('aria-pressed',String(b.dataset.mode===mode)); setMessage(mode==='camera'?'Karte verschieben und zoomen.':mode==='demolish'?'Gebäude auf der Karte antippen.':'Start und Ende auf der Karte antippen.'); }
for(const b of app.querySelectorAll<HTMLButtonElement>('[data-mode]')) b.onclick=()=>chooseMode(b.dataset.mode as Mode);
cancel.onclick=()=>{clearDraft();setMessage(mode==='demolish'?'Gebäude auf der Karte antippen.':'Start und Ende auf der Karte antippen.');};
confirm.onclick=()=>{if(!draft||!round||awaiting)return;setAwaiting(true);confirm.disabled=true;previewText.textContent='Maßnahme wird ausgeführt …';pendingPresentation.set(previewId,{round,confirmedAt:performance.now(),confirmedRunning:running,confirmedSpeed:speed,confirmedVisible:document.visibilityState==='visible'});worker?.postMessage({type:'action',round,id:previewId,action:draft});};
function describeDraft(action:Action):string {
  if(!scenario)return '';
  const p=scenario.parameters, number=(n:number)=>n.toLocaleString('de-AT');
  if(action.kind==='dam')return `Dammhöhe: ${number(p.damHeight)} m über der höheren Sohle`;
  if(action.kind==='trench')return `Geländeabsenkung: ${number(p.trenchDepth)} m`;
  const building=scenario.buildings.find(b=>b.id===action.buildingId);
  return building?`Gebäudeverlust insgesamt: ${number(Math.round(building.area*p.buildingValuePerSquareMetre))}`:'Gebäudeabriss';
}
function showDraft(action:Action) {if(!round)return; draft=action;previewId=`${round}-${++serial}`;preview.hidden=false;syncToolHint();confirm.disabled=true;previewText.textContent='Kosten werden geprüft …';world?.showPreview(action);worker?.postMessage({type:'preview',round,id:previewId,action});}
function pathAction(a:{x:number;y:number},b:{x:number;y:number}):Action|undefined {
  if(!scenario)return; const {width:w,height:h,cellSize:c}=scenario.grid;
  if(mode==='trench') {
    let x=Math.max(0,Math.min(w-1,Math.floor(a.x/c))),y=Math.max(0,Math.min(h-1,Math.floor(a.y/c)));
    const tx=Math.max(0,Math.min(w-1,Math.floor(b.x/c))),ty=Math.max(0,Math.min(h-1,Math.floor(b.y/c)));return {kind:'trench',cells:arcadeTrenchPath([x,y],[tx,ty],w,h,visibleTrenches,scenario.parameters.outflowEdges)};
  }
  if(mode==='dam') {
    let x=Math.max(0,Math.min(w,Math.round(a.x/c))),y=Math.max(0,Math.min(h,Math.round(a.y/c)));
    const tx=Math.max(0,Math.min(w,Math.round(b.x/c))),ty=Math.max(0,Math.min(h,Math.round(b.y/c)));const faces=arcadeDamPath([x,y],[tx,ty],w,h,visibleDams);
    return faces.length?{kind:'dam',faces}:undefined;
  }
}
function selectAt(x:number,y:number) {
  if(!world||!scenario||awaiting||finished||fatalError)return;
  // A new map selection replaces the unconfirmed preview and its action.
  if(!preview.hidden)clearDraft();
  if(mode==='demolish') {const hit=world.pickDemolition(x,y);if(hit?.buildingId) showDraft({kind:'demolish',buildingId:hit.buildingId});else setMessage('Bitte ein Gebäude auswählen.');return;}
  const hit=world.pick(x,y);if(!hit){setMessage('Bitte innerhalb der Karte auswählen.');return;}
  if(!first){first=hit;world.showStart(hit);setMessage('Endpunkt auf der Karte antippen.');return;}
  const action=pathAction(first,hit);first=undefined;if(action)showDraft(action);else {world.showPreview();setMessage('Bitte einen längeren Verlauf wählen.');}
}
let worker:Worker|undefined;
function fail(text:string) { inspection.hidden=true;inspection.textContent='';compactStatus.hidden=true;pendingPresentation.clear(); fatalError=true; running=false; world?.setFlowRunning(false,speed);worker?.terminate(); run.disabled=true; reset.disabled=true; speedButton.disabled=true; for(const button of app.querySelectorAll<HTMLButtonElement>('[data-mode]')) button.disabled=true; clearDraft(); resultPanel.hidden=true; gamePanel.hidden=false; gamePanel.scrollTop=0; panelToggle.setAttribute('aria-expanded','true'); panelToggle.textContent='Menü ausblenden'; setMessage(text); stateLabel.textContent='Fehler'; reloadButton.hidden=false; }
try {worker=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});}
catch {fail('Der Worker konnte nicht gestartet werden. Bitte die Seite neu laden.');}
if(worker) worker.onmessage=(event:MessageEvent<Response>)=>{
  if(fatalError)return;
  try {
  const data=event.data;
  if(!data || typeof data!=='object' || !['ready','snapshot','action-result','result','error'].includes(data.type) || (data.type==='ready' && !isReady(data))) throw new Error('Ungültiges Worker-Protokoll');
  if(isReady(data) && !fatalError) {
    if(data.round<=round)return;
    if(data.round!==round+1 || data.scenarioId!==scenario?.id)throw new Error('Ungültige Rundenfolge');
    round=data.round; visibleDams=[];visibleTrenches=[];pendingPresentation.clear(); running=false; finished=false; backlogActive=false; speed=1; chooseMode('camera'); world?.resetView(); resultPanel.hidden=true; run.textContent='Simulation starten'; speedButton.textContent='1×';
    damageTotal.textContent=`Schaden 0 / ${scenario?.parameters.damageTarget.toLocaleString('de-AT')??'–'}`;damageBreakdown.textContent='Flut 0 · Abriss 0';
    run.disabled=false; reset.disabled=false; speedButton.disabled=false;
    setMessage('Wiener Szenario geladen. Die Wasserberechnung ist bereit.'); stateLabel.textContent='Vorbereitung'; timeLabel.textContent='00:00';compactStatus.textContent=`${timeLabel.textContent} · Budget ${budgetLabel.textContent} · ${stateLabel.textContent}`;
  } else if(data.type==='snapshot') {
    if(data.round===round && world && !fatalError) {
      const n=data.buffer.byteLength/16;
      visibleDams=data.dams.map(([key])=>key);visibleTrenches=data.trenches;
      world.setFlowRunning(data.running && !finished,data.speed);world.updateState(new Float32Array(data.buffer,n*12,n),data.buildings,data.dams,data.revision,data.trenches); world.updateWater(new Float32Array(data.buffer,0,n),new Float32Array(data.buffer,n*4,n),new Float32Array(data.buffer,n*8,n)); budgetLabel.textContent=Math.round(data.budget).toLocaleString('de-AT'); running=data.running;
      damageTotal.textContent=`Schaden ${displayDamage(data.totalDamage)} / ${displayDamage(scenario!.parameters.damageTarget)}`;damageBreakdown.textContent=`Flut ${displayDamage(data.floodDamage)} · Abriss ${displayDamage(data.demolitionLoss)}`;
      const seconds=Math.floor(data.time); timeLabel.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
      stateLabel.textContent=finished?'Beendet':running?'Läuft':data.time===0?'Vorbereitung':'Pausiert';compactStatus.textContent=`${timeLabel.textContent} · Budget ${budgetLabel.textContent} · ${stateLabel.textContent}`; run.textContent=running?'Pause':data.time===0?'Simulation starten':'Fortsetzen';
      window.dispatchEvent(new CustomEvent('waterfighter:diagnostics',{detail:{round:data.round,time:data.time,backlog:data.backlog,running:data.running,speed:data.speed}}));
      for(const [id,pending] of pendingPresentation) if(pending.round===data.round && pending.revision!==undefined && data.revision>=pending.revision && !pending.scheduled) {
        pending.scheduled=true;
        world.scene.onAfterRenderObservable.addOnce(()=>{
          if(pendingPresentation.get(id)!==pending || round!==pending.round || fatalError)return;
          const presentedAt=performance.now();pendingPresentation.delete(id);
          window.dispatchEvent(new CustomEvent('waterfighter:action-displayed',{detail:{id,round,confirmedAt:pending.confirmedAt,confirmedRunning:pending.confirmedRunning,confirmedSpeed:pending.confirmedSpeed,confirmedVisible:pending.confirmedVisible,presentedAt,latencyMs:presentedAt-pending.confirmedAt}}));
        });
      }
      const catchingUp=data.running && !finished && data.backlog>2;
      if(catchingUp && (!backlogActive || backlogMessageVisible)) {
        const text=`Simulation holt ${data.backlog.toFixed(1)} s Rückstand auf.`;
        if(message.textContent!==text||!backlogMessageVisible)setMessage(text,true);
      } else if(!catchingUp && backlogMessageVisible) {
        setMessage(mode==='camera'?'Karte verschieben und zoomen.':mode==='demolish'?'Gebäude auf der Karte antippen.':first?'Endpunkt auf der Karte antippen.':'Start und Ende auf der Karte antippen.');
      }
      backlogActive=catchingUp;
    }
    worker?.postMessage({type:'recycle',round:data.round,buffer:data.buffer},[data.buffer]);
  } else if(data.type==='action-result' && data.round===round) {
    const pending=pendingPresentation.get(data.id);
    if(!data.preview && pending) {if(data.result.ok) pending.revision=data.revision;else pendingPresentation.delete(data.id);}
    if(data.id!==previewId) return;
    if(data.preview) {confirm.disabled=!data.result.ok;previewText.textContent=data.result.ok?`${draft?describeDraft(draft)+' · ':''}Kosten: ${data.result.cost} · Budget danach: ${data.result.budget}${data.result.loweredCrests?` · Senkt ${data.result.loweredCrests} modellierte ${data.result.loweredCrests===1?'Geländekante':'Geländekanten'}; der Wasserverlauf kann sich ändern.`:''}${data.result.buildingBlockedFaces?` · ${data.result.buildingBlockedFaces} ${data.result.buildingBlockedFaces===1?'Dammkante ist':'Dammkanten sind'} durch Gebäude bereits gesperrt.`:''}${data.result.nearBoundaryGap?' · Ein Dammende liegt eine Rasterkante vor dem Kartenrand; dort kann eine Öffnung bleiben.':''}${data.result.nearDamGap?' · Ein Dammende liegt eine Rasterkante von einem bestehenden Damm entfernt; dazwischen kann eine Öffnung bleiben.':''}${data.result.nearOutletGap?' · Ein Grabenende liegt eine Zelle vor einem offenen Modellrand. Prüfe den Anschluss.':''}${data.result.reusedCells?` · ${data.result.reusedCells} ${data.result.reusedCells===1?'Zelle ist':'Zellen sind'} bereits ausgehoben und werden nicht erneut vertieft oder bezahlt.`:''}`:data.result.reason;}
    else {setAwaiting(false);if(data.result.ok){setMessage(`Maßnahme bestätigt. Kosten: ${data.result.cost}.`);clearDraft();confirmationTimer=setTimeout(()=>{confirmationTimer=undefined;setMessage(mode==='demolish'?'Gebäude auf der Karte antippen.':'Start und Ende auf der Karte antippen.');},4000);}else{previewText.textContent=data.result.reason;confirm.disabled=true;}}
  }
  else if(data.type==='result' && data.round===round && !fatalError) { running=false; finished=true; world?.setFlowRunning(false,speed);inspection.hidden=true;inspection.textContent='';clearDraft();run.disabled=true; stateLabel.textContent='Beendet';compactStatus.textContent=`${timeLabel.textContent} · Budget ${budgetLabel.textContent} · ${stateLabel.textContent}`; setMessage('Die Runde ist beendet.');
    const number=(n:number)=>Math.round(n).toLocaleString('de-AT');
    resultTitle.textContent=data.achieved?'Schadensziel erreicht':'Schadensziel verfehlt';
    resultDetails.textContent=`Flutschäden: ${number(data.floodDamage)} · Abrissverluste: ${number(data.demolitionLoss)} · Gesamtschaden: ${number(data.totalDamage)} · Ziel: höchstens ${number(data.target)} · Budgetrest: ${number(data.budget)}.`;
    resultPanel.hidden=false;
  }
  else if(data.type==='error' && (data.round===round || (round===0 && data.round===1))) fail(`Simulation angehalten: ${data.message}. Bitte die Seite neu laden.`);
  } catch {
    fail('Die Worker-Nachricht konnte nicht verarbeitet werden. Bitte die Seite neu laden.');
  }
};
if(worker) {
  worker.onerror=()=>fail('Der Worker ist ausgefallen. Bitte die Seite neu laden.');
  worker.onmessageerror=()=>fail('Die Worker-Nachricht konnte nicht gelesen werden. Bitte die Seite neu laden.');
}
run.onclick=()=>{ if(!round)return; worker?.postMessage({type:running?'pause':'start',round}); };
reset.onclick=()=>{ if(round) worker?.postMessage({type:'reset',round}); };
speedButton.onclick=()=>{ if(!round)return; speed=speed===1?2:1; speedButton.textContent=`${speed}×`; worker?.postMessage({type:'speed',round,speed}); };
app.querySelector<HTMLButtonElement>('#zoom-in')!.onclick=()=>world?.setZoom(0.8);
app.querySelector<HTMLButtonElement>('#zoom-out')!.onclick=()=>world?.setZoom(1.25);
let pointer: {id:number;modeRevision:number;x:number;y:number;startX:number;startY:number;moved:boolean}|undefined;
// A preview can appear beneath the finger during pointerup. Suppress the
// associated click so it cannot activate a newly appeared preview button.
const canvasPointers=new Map<number,symbol>();
document.addEventListener('pointerdown',e=>{if(e.target===canvas)canvasPointers.set(e.pointerId,Symbol());else canvasPointers.delete(e.pointerId);},true);
document.addEventListener('pointercancel',e=>canvasPointers.delete(e.pointerId),true);
document.addEventListener('pointerup',e=>{const token=canvasPointers.get(e.pointerId);if(token)setTimeout(()=>{if(canvasPointers.get(e.pointerId)===token)canvasPointers.delete(e.pointerId);},1000);},true);
document.addEventListener('click',e=>{if(e instanceof PointerEvent && canvasPointers.delete(e.pointerId)){e.preventDefault();e.stopImmediatePropagation();}},true);
canvas.addEventListener('pointerdown',e=>{if(pointer)return;pointer={id:e.pointerId,modeRevision,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(pointer?.id!==e.pointerId||pointer.modeRevision!==modeRevision)return;pointer.moved ||= Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>=(mode==='camera'?5:8);if(mode==='camera'||pointer.moved){world?.pan(e.clientX-pointer.x,e.clientY-pointer.y);pointer.x=e.clientX;pointer.y=e.clientY;}});
canvas.addEventListener('pointerup',e=>{if(pointer?.id!==e.pointerId)return; if(pointer.modeRevision!==modeRevision){pointer=undefined;return;} const moved=pointer.moved||Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>=(mode==='camera'?5:8);if(mode!=='camera') {if(moved)setMessage(mode==='demolish'?'Karte verschoben. Gebäude antippen.':first?'Karte verschoben. Endpunkt antippen.':'Karte verschoben. Startpunkt antippen.');else selectAt(e.clientX,e.clientY);} else if(!moved) {const text=world?.inspect(e.clientX,e.clientY)??'Karte ist noch nicht bereit.';setMessage(text);inspection.textContent=`Stand ${timeLabel.textContent}: ${text}`;inspection.hidden=!gamePanel.hidden;}pointer=undefined;});
for(const event of ['pointercancel','lostpointercapture'] as const) canvas.addEventListener(event,e=>{if(pointer?.id===e.pointerId)pointer=undefined;});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(round)worker?.postMessage({type:'pause',round});fail('Grafikkontext verloren. Bitte Seite neu laden.');});
fetch(`${import.meta.env.BASE_URL}scenarios/brigittenau-v1.json.bin`).then(async response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);if(!response.body)throw new Error('Szenariodaten fehlen');return validateScenario(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json());}).then(loaded=>{
  if(fatalError)return;
  scenario=loaded;app.querySelector<HTMLElement>('#target')!.textContent=loaded.parameters.damageTarget.toLocaleString('de-AT');world=new World(canvas,loaded); worker?.postMessage({type:'init',scenario:loaded});
}).catch((error:unknown)=>fail(`Szenario oder Grafik konnte nicht geladen werden: ${error instanceof Error?error.message:String(error)}`));
