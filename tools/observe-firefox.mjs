/** Smoke test against an official Firefox via a locally started geckodriver. */
import { writeFileSync } from 'node:fs';
const base='http://127.0.0.1:4444';
async function command(path,body,method='POST') {const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(JSON.stringify(d));return d.value;}
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'firefox','moz:firefoxOptions':{binary:process.env.WATERFIGHTER_FIREFOX,args:process.env.WATERFIGHTER_FIREFOX_HEADLESS==='0'?[]:['-headless'],prefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}}}});
const sid=session.sessionId,prefix=`/session/${sid}`;
try {
  await command(prefix+'/url',{url:process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/'});
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
    await click(`[data-mode="${mode}"]`);
    if(mode==='demolish') {
      for(const [x,y] of [[560,245],[410,225],[450,230],[600,210],[515,220],[675,225]]) {
        await pointer(x,y);await new Promise(r=>setTimeout(r,300));
        const state=await script('return {visible:!document.querySelector("#preview").hidden,enabled:!document.querySelector("#confirm").disabled};');
        if(state.visible && state.enabled)break;
        if(state.visible)await click('#cancel');
      }
    } else {await pointer(690,300);await pointer(735,310);}
    let preview;
    for(let i=0;i<100;i++){preview=await script('return {text:document.querySelector("#preview-text").textContent,enabled:!document.querySelector("#confirm").disabled,visible:!document.querySelector("#preview").hidden};');if(preview.visible&&preview.enabled)break;await new Promise(r=>setTimeout(r,100));}
    if(!preview.enabled){const shot=await command(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/waterfighter-firefox-error.png',Buffer.from(shot,'base64'));throw new Error(`Keine bestätigbare Vorschau für ${mode}: ${JSON.stringify(preview)}`);}
    await click('#confirm');
    for(let i=0;i<100;i++){if(await script('return document.querySelector("#preview").hidden'))break;await new Promise(r=>setTimeout(r,100));}
    toolResults.push({mode,preview:preview.text,budget:await script('return document.querySelector("#budget").textContent')});
    await click('#reset');await new Promise(r=>setTimeout(r,300));
  }
  let fullRound=null;
  if(process.env.WATERFIGHTER_FIREFOX_FULL==='1') {
    await click('#speed');const started=Date.now();await click('#run');
    for(let i=0;i<240;i++) {if(await script('return !document.querySelector("#result").hidden'))break;await new Promise(r=>setTimeout(r,1000));}
    fullRound=await script('return {visible:!document.querySelector("#result").hidden,title:document.querySelector("#result-title").textContent,details:document.querySelector("#result-details").textContent,time:document.querySelector("#time").textContent};');
    fullRound.wallSeconds=(Date.now()-started)/1000;
    if(!fullRound.visible)throw new Error(`Vollständige Runde nicht beendet: ${JSON.stringify(fullRound)}`);
  }
  const screenshot=await command(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/waterfighter-firefox.png',Buffer.from(screenshot,'base64'));
  const report={version:session.capabilities.browserVersion,initial:state,running,paused,reset,toolResults,fullRound};writeFileSync('/tmp/waterfighter-firefox.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(running.state!=='Läuft'||paused.state!=='Pausiert'||reset.state!=='Vorbereitung'||reset.time!=='00:00')throw new Error('Firefox-Ablauf fehlgeschlagen');
} finally {await command(prefix,undefined,'DELETE');}
