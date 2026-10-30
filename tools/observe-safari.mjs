/** Desktop smoke test against Safari through a locally started safaridriver. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const base=process.env.WATERFIGHTER_SAFARIDRIVER??'http://127.0.0.1:4445';
async function command(path,body,method='POST') {const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(JSON.stringify(d));return d.value;}
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'safari',platformName:'macOS'}}});
const sid=session.sessionId,prefix=`/session/${sid}`;
let failed=false,phase="Initialisierung";
try {
  await command(prefix+'/window/rect',{x:0,y:0,width:1200,height:800});
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
    if(!preview.visible || !preview.enabled){const shot=await command(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/waterfighter-safari-error.png',Buffer.from(shot,'base64'));throw new Error(`Keine bestätigbare Vorschau für ${mode}: ${JSON.stringify(preview)}`);}
    const expectedBudget=Number(preview.text.match(/Budget danach:\s*([\d\s]+)/)?.[1].replace(/\s/g,''));
    if(!Number.isFinite(expectedBudget))throw new Error(`Budget fehlt in Vorschau: ${preview.text}`);
    await click('#confirm');
    let confirmed;
    for(let i=0;i<100;i++){confirmed=await script('return {hidden:document.querySelector("#preview").hidden,budget:document.querySelector("#budget").textContent}');if(confirmed.hidden && Number(confirmed.budget.replace(/\s/g,''))===expectedBudget)break;await new Promise(r=>setTimeout(r,100));}
    if(!confirmed?.hidden || Number(confirmed.budget.replace(/\s/g,''))!==expectedBudget)throw new Error(`Bestätigung für ${mode} nicht übernommen: ${JSON.stringify(confirmed)}`);
    toolResults.push({mode,preview:preview.text,budget:confirmed.budget});
    await click('#reset');await new Promise(r=>setTimeout(r,300));
  }
  let fullRound=null;
  if(process.env.WATERFIGHTER_SAFARI_FULL==='1') {
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
    for(let i=0;i<100;i++){afterResultReset=await script('return {resultHidden:document.querySelector("#result").hidden,time:document.querySelector("#time").textContent,state:document.querySelector("#state").textContent,budget:document.querySelector("#budget").textContent,damage:document.querySelector("#damage-breakdown").textContent}');if(afterResultReset.resultHidden && afterResultReset.time==='00:00' && afterResultReset.state==='Vorbereitung' && afterResultReset.budget.replace(/\s/g,'')==='10000' && afterResultReset.damage==='Flut 0 · Abriss 0')break;await new Promise(r=>setTimeout(r,100));}
    if(!afterResultReset.resultHidden || afterResultReset.time!=='00:00' || afterResultReset.state!=='Vorbereitung' || afterResultReset.budget.replace(/\s/g,'')!=='10000' || afterResultReset.damage!=='Flut 0 · Abriss 0')throw new Error('Neustart nach Ergebnis fehlgeschlagen: '+JSON.stringify(afterResultReset));
  }
  const screenshot=await command(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/waterfighter-safari.png',Buffer.from(screenshot,'base64'));
  const report={version:session.capabilities.browserVersion,scenarioVersion,scenarioHash,initial:state,running,paused,reset,toolResults,fullRound,afterResultReset};writeFileSync('/tmp/waterfighter-safari.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(running.state!=='Läuft'||paused.state!=='Pausiert'||reset.state!=='Vorbereitung'||reset.time!=='00:00')throw new Error('Safari-Ablauf fehlgeschlagen');
} catch (error) {
  failed=true;
  console.error(`Safari-Prüfung fehlgeschlagen bei: ${phase}`);
  throw error;
} finally {
  try {await command(prefix,undefined,'DELETE');}
  catch (error) {if(!failed)throw error; console.error('Safari-Sitzung konnte nach dem ursprünglichen Fehler nicht beendet werden:',error);}
}
