/** Smoke test against an official Firefox via a locally started geckodriver. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const base=process.env.WATERFIGHTER_GECKODRIVER??'http://127.0.0.1:4444';
async function command(path,body,method='POST') {const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(JSON.stringify(d));return d.value;}
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'firefox','moz:firefoxOptions':{binary:process.env.WATERFIGHTER_FIREFOX,args:process.env.WATERFIGHTER_FIREFOX_HEADLESS==='0'?[]:['-headless'],prefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}}}});
const sid=session.sessionId,prefix=`/session/${sid}`;
let failed=false,phase="Initialisierung";
try {
  const url=process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/';
  await command(prefix+'/url',{url});
  const response=await fetch(new URL('scenarios/brigittenau-v1.json.bin',url));
  if(!response.ok)throw new Error(`Szenariodownload: HTTP ${response.status}`);
  const bytes=gunzipSync(Buffer.from(await response.arrayBuffer()));
  const scenarioHash=createHash('sha256').update(bytes).digest('hex');
  const expectedHash=createHash('sha256').update(readFileSync('public/scenarios/brigittenau-v1.json')).digest('hex');
  if(scenarioHash!==expectedHash)throw new Error('Ausgeliefertes Szenario stimmt nicht mit dem Arbeitsstand überein');
  const scenarioVersion=JSON.parse(bytes.toString('utf8')).version;
  const script=async code=>command(prefix+'/execute/sync',{script:code,args:[]});
  let state;
  for(let i=0;i<100;i++) {state=await script('return {message:document.querySelector("#message")?.textContent,enabled:!document.querySelector("#run")?.disabled};');if(state.enabled)break;await new Promise(r=>setTimeout(r,200));}
  if(!state?.enabled)throw new Error(`Szenario nicht bereit: ${JSON.stringify(state)}`);
  await script('document.querySelector("#run").click();return null;');await new Promise(r=>setTimeout(r,2000));
  const running=await script('return {time:document.querySelector("#time").textContent,state:document.querySelector("#state").textContent,message:document.querySelector("#message").textContent};');
  await script('document.querySelector("#run").click();return null;');await new Promise(r=>setTimeout(r,300));
  const paused=await script('return {time:document.querySelector("#time").textContent,state:document.querySelector("#state").textContent};');
  await script('document.querySelector("#reset").click();return null;');await new Promise(r=>setTimeout(r,600));
  const reset=await script('return {time:document.querySelector("#time").textContent,state:document.querySelector("#state").textContent};');
  const element=async selector=>{const e=await command(prefix+'/element',{using:'css selector',value:selector});return e['element-6066-11e4-a52e-4f735466cecf'];};
  const click=async selector=>command(prefix+`/element/${await element(selector)}/click`,{});
  const pointer=async (x,y)=>command(prefix+'/actions',{actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',duration:0,x,y,origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});
  const toolResults=[];
  for(const mode of ['trench','dam','demolish']) {
    phase=`Werkzeug ${mode}`;
    await click(`[data-mode="${mode}"]`);
    if(mode==='demolish') {
      for(const [x,y] of [[620,320],[680,330],[750,320],[550,370],[620,365],[770,375],[520,390],[830,355],[560,245],[410,225],[450,230],[600,210],[515,220],[675,225]]) {
        await pointer(x,y);await new Promise(r=>setTimeout(r,300));
        const state=await script('return {visible:!document.querySelector("#preview").hidden,enabled:!document.querySelector("#confirm").disabled};');
        if(state.visible && state.enabled)break;
        if(state.visible)await click('#cancel');
      }
    } else {await pointer(650,450);await pointer(700,450);}
    let preview;
    for(let i=0;i<100;i++){preview=await script('return {text:document.querySelector("#preview-text").textContent,enabled:!document.querySelector("#confirm").disabled,visible:!document.querySelector("#preview").hidden};');if(preview.visible&&preview.enabled)break;await new Promise(r=>setTimeout(r,100));}
    if(!preview.enabled){const shot=await command(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/waterfighter-firefox-error.png',Buffer.from(shot,'base64'));throw new Error(`Keine bestätigbare Vorschau für ${mode}: ${JSON.stringify(preview)}`);}
    await click('#confirm');
    for(let i=0;i<100;i++){if(await script('return document.querySelector("#preview").hidden'))break;await new Promise(r=>setTimeout(r,100));}
    toolResults.push({mode,preview:preview.text,budget:await script('return document.querySelector("#budget").textContent')});
    await click('#reset');await new Promise(r=>setTimeout(r,300));
  }
  let backlogCheck=null;
  if(process.env.WATERFIGHTER_FIREFOX_BACKLOG==='1') {
    phase='Rückstandsanzeige';
    if(!await script('return window.__wfBacklogHook===true'))throw Error('Testinstrumentierung für Rückstand fehlt');
    await click('#run');await click('#panel-toggle');await pointer(650,450);
    const before=await script('return {visible:!document.querySelector("#inspection").hidden,text:document.querySelector("#inspection").textContent}');
    if(!before.visible||!before.text)throw Error(`Kartenabfrage fehlt: ${JSON.stringify(before)}`);
    await script('window.__wfBacklog=3;return null');
    let warning;
    for(let i=0;i<100;i++){warning=await script('return {visible:!document.querySelector("#tool-hint").hidden,text:document.querySelector("#tool-hint").textContent,inspectionHidden:document.querySelector("#inspection").hidden}');if(warning.visible&&warning.text==='Simulation holt 3.0 s Rückstand auf.'&&warning.inspectionHidden)break;await new Promise(r=>setTimeout(r,100));}
    if(!warning.visible||warning.text!=='Simulation holt 3.0 s Rückstand auf.'||!warning.inspectionHidden)throw Error(`Rückstand nicht sichtbar: ${JSON.stringify(warning)}`);
    await script('window.__wfBacklog=0;return null');
    let restored;
    for(let i=0;i<100;i++){restored=await script('return {visible:!document.querySelector("#inspection").hidden,text:document.querySelector("#inspection").textContent,hintHidden:document.querySelector("#tool-hint").hidden}');if(restored.visible&&restored.hintHidden)break;await new Promise(r=>setTimeout(r,100));}
    if(!restored.visible||!restored.hintHidden||restored.text!==before.text)throw Error(`Kartenabfrage nicht wiederhergestellt: ${JSON.stringify(restored)}`);
    await script('window.__wfBacklog=3;return null');
    for(let i=0;i<100;i++){if(await script('return !document.querySelector("#tool-hint").hidden'))break;await new Promise(r=>setTimeout(r,100));}
    await pointer(700,450);await new Promise(r=>setTimeout(r,1000));
    const nextInspection=await script('return {visible:!document.querySelector("#inspection").hidden,text:document.querySelector("#inspection").textContent,hintHidden:document.querySelector("#tool-hint").hidden}');
    if(!nextInspection.visible||!nextInspection.hintHidden||!nextInspection.text)throw Error(`Neue Kartenabfrage nicht sichtbar: ${JSON.stringify(nextInspection)}`);
    backlogCheck={before,warning,restored,nextInspection};await script('window.__wfBacklog=undefined;return null');await click('#panel-toggle');await click('#reset');
    for(let i=0;i<100;i++){if(await script('return document.querySelector("#state").textContent==="Vorbereitung"'))break;await new Promise(r=>setTimeout(r,100));}
  }
  let hintChecks=null;
  if(process.env.WATERFIGHTER_FIREFOX_HINT==='1') {
    phase='Bestätigungshinweis';hintChecks=[];
    for(const chooseAgain of [false,true]) {
      await click('[data-mode="trench"]');await click('#panel-toggle');
      await pointer(650,450);await pointer(700,450);
      let ready=false;
      for(let i=0;i<100;i++){ready=await script('return !document.querySelector("#confirm").disabled && !document.querySelector("#preview").hidden');if(ready)break;await new Promise(r=>setTimeout(r,100));}
      if(!ready)throw Error('Graben für Hinweisprüfung nicht bestätigbar');
      await click('#confirm');
      let confirmation='';
      for(let i=0;i<100;i++){confirmation=await script('return document.querySelector("#tool-hint").textContent');if(confirmation.startsWith('Maßnahme bestätigt.'))break;await new Promise(r=>setTimeout(r,100));}
      if(!confirmation.startsWith('Maßnahme bestätigt.'))throw Error(`Bestätigung fehlt: ${confirmation}`);
      if(chooseAgain)await pointer(650,450);
      await new Promise(r=>setTimeout(r,4500));
      const hint=await script('return {text:document.querySelector("#tool-hint").textContent,visible:!document.querySelector("#tool-hint").hidden}');
      const expected=chooseAgain?'Endpunkt auf der Karte antippen.':'Start und Ende auf der Karte antippen.';
      if(!hint.visible||hint.text!==expected)throw Error(`Unerwarteter Werkzeughinweis: ${JSON.stringify(hint)}`);
      hintChecks.push({chooseAgain,confirmation,hint:hint.text});
      await click('#panel-toggle');await click('#reset');
      let resetReady=false;
      for(let i=0;i<100;i++){resetReady=await script('return document.querySelector("#state").textContent==="Vorbereitung" && document.querySelector("#budget").textContent.replace(/\\s/g,"")==="10000"');if(resetReady)break;await new Promise(r=>setTimeout(r,100));}
      if(!resetReady)throw Error("Neustart nach Hinweisprüfung nicht abgeschlossen");
    }
  }
  let fullRound=null;
  if(process.env.WATERFIGHTER_FIREFOX_FULL==='1') {
    phase='Vollständige Runde';
    await click('#speed');const started=Date.now();await click('#run');
    for(let i=0;i<240;i++) {if(await script('return !document.querySelector("#result").hidden'))break;await new Promise(r=>setTimeout(r,1000));}
    fullRound=await script('return {visible:!document.querySelector("#result").hidden,title:document.querySelector("#result-title").textContent,details:document.querySelector("#result-details").textContent,time:document.querySelector("#time").textContent};');
    fullRound.wallSeconds=(Date.now()-started)/1000;
    if(!fullRound.visible)throw new Error(`Vollständige Runde nicht beendet: ${JSON.stringify(fullRound)}`);
  }
  let afterResultReset=null;
  if(fullRound) {
    await click('#again');
    for(let i=0;i<100;i++){
      afterResultReset=await script('return {resultHidden:document.querySelector("#result").hidden,time:document.querySelector("#time").textContent,state:document.querySelector("#state").textContent,budget:document.querySelector("#budget").textContent,damage:document.querySelector("#damage-breakdown").textContent}');
      if(afterResultReset.resultHidden && afterResultReset.time==='00:00' && afterResultReset.state==='Vorbereitung' && afterResultReset.budget.replace(/\s/g,'')==='10000' && afterResultReset.damage==='Flut 0 · Abriss 0')break;
      await new Promise(r=>setTimeout(r,100));
    }
    if(!afterResultReset.resultHidden || afterResultReset.time!=='00:00' || afterResultReset.state!=='Vorbereitung' || afterResultReset.budget.replace(/\s/g,'')!=='10000' || afterResultReset.damage!=='Flut 0 · Abriss 0')throw Error(`Neustart nach Ergebnis fehlgeschlagen: ${JSON.stringify(afterResultReset)}`);
  }
  const screenshot=await command(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/waterfighter-firefox.png',Buffer.from(screenshot,'base64'));
  const report={version:session.capabilities.browserVersion,scenarioVersion,scenarioHash,initial:state,running,paused,reset,toolResults,backlogCheck,hintChecks,fullRound,afterResultReset};writeFileSync('/tmp/waterfighter-firefox.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(running.state!=='Läuft'||paused.state!=='Pausiert'||reset.state!=='Vorbereitung'||reset.time!=='00:00')throw new Error('Firefox-Ablauf fehlgeschlagen');
} catch (error) {
  failed=true;
  console.error(`Firefox-Prüfung fehlgeschlagen bei: ${phase}`);
  throw error;
} finally {
  try {await command(prefix,undefined,'DELETE');}
  catch (error) {if(!failed)throw error; console.error('Firefox-Sitzung konnte nach dem ursprünglichen Fehler nicht beendet werden:',error);}
}
