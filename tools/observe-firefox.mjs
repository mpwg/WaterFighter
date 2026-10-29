/** Smoke test against an official Firefox via a locally started geckodriver. */
import { writeFileSync } from 'node:fs';
const base='http://127.0.0.1:4444';
async function command(path,body,method='POST') {const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(JSON.stringify(d));return d.value;}
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'firefox','moz:firefoxOptions':{binary:process.env.WATERFIGHTER_FIREFOX,args:['-headless'],prefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}}}});
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
  const screenshot=await command(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/waterfighter-firefox.png',Buffer.from(screenshot,'base64'));
  const report={version:session.capabilities.browserVersion,initial:state,running,paused,reset};writeFileSync('/tmp/waterfighter-firefox.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(running.state!=='Läuft'||paused.state!=='Pausiert'||reset.state!=='Vorbereitung'||reset.time!=='00:00')throw new Error('Firefox-Ablauf fehlgeschlagen');
} finally {await command(prefix,undefined,'DELETE');}
