/** Safari desktop flow check against the isolated, instrumented Vite copy described in docs. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {damPath,trenchPath} from '../src/simulation/path.ts';

const base=process.env.WATERFIGHTER_SAFARIDRIVER??'http://127.0.0.1:4445';
const url=process.env.WATERFIGHTER_FLOW_URL??'http://127.0.0.1:5174/';
const points=JSON.parse(readFileSync('tests/fixtures/south-screen-points.json','utf8'));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(points.scenario!==fixture.scenario)throw Error('Szenarioversion stimmt nicht');
async function command(path,body,method='POST') {const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const value=await r.json();if(!r.ok)throw Error(JSON.stringify(value));return value.value;}
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'safari',platformName:'macOS'}}}),prefix=`/session/${session.sessionId}`;
try {
  await command(prefix+'/window/rect',{x:0,y:0,width:1600,height:1075});await command(prefix+'/url',{url});
  const response=await fetch(new URL('scenarios/brigittenau-v1.json.bin',url));
  if(!response.ok||!gunzipSync(Buffer.from(await response.arrayBuffer())).equals(readFileSync('public/scenarios/brigittenau-v1.json')))throw Error('Szenariodaten weichen ab');
  const js=async script=>command(prefix+'/execute/sync',{script,args:[]});
  async function wait(script,limit=150,delay=100){for(let i=0;i<limit;i++){const value=await js(script);if(value)return value;await new Promise(r=>setTimeout(r,delay));}throw Error(`Zeitüberschreitung: ${script}`);}
  await wait('return !!window.__wfTest?.world && !document.querySelector("#run").disabled');
  const viewport=await js('return [innerWidth,innerHeight]');
  if(viewport[0]!==1600||viewport[1]!==1000)throw Error(`Bildschirmkoordinaten passen nicht: ${viewport}`);
  async function click(selector){const element=await command(prefix+'/element',{using:'css selector',value:selector});await command(prefix+`/element/${element['element-6066-11e4-a52e-4f735466cecf']}/click`,{});}
  async function point(p,offset=[0,0]){await command(prefix+'/actions',{actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',duration:0,x:Math.round(p.x+offset[0]),y:Math.round(p.y+offset[1]),origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});}
  async function preview(){return wait('return window.__wfAction && !document.querySelector("#preview").hidden && !document.querySelector("#confirm").disabled ? {action:window.__wfAction,text:document.querySelector("#preview-text").textContent} : null');}
  async function confirm(expected,cost){const p=await preview();if(JSON.stringify(p.action)!==JSON.stringify(expected)||!p.text.includes(`Kosten: ${cost}`))throw Error(`Abweichende Vorschau: ${JSON.stringify(p)}`);await click('#confirm');await wait('return document.querySelector("#preview").hidden');}
  const steps=fixture.strategies['south-divert'];await click('[data-mode="dam"]');
  for(let i=0;i<3;i++){await js('window.__wfAction=undefined;return null');for(const p of points.dams[i])await point(p);await confirm({kind:'dam',faces:damPath(steps[i].start,steps[i].end,200)},[400,720,640][i]);}
  await click('#speed');const started=Date.now();await click('#run');
  await wait('const [m,s]=document.querySelector("#time").textContent.split(":").map(Number);return m*60+s>=150',180,1000);
  await click('#run');await wait('return document.querySelector("#state").textContent==="Pausiert"');const pausedAt=await js('return document.querySelector("#time").textContent');
  await click('[data-mode="trench"]');await click('#panel-toggle');
  const expected={kind:'trench',cells:trenchPath(steps[3].start,steps[3].end,200)};
  const offsets=[[0,0],[0,-1],[0,1],[-1,0],[1,0],[0,-2],[0,2],[-2,0],[2,0],[0,-4],[0,4],[-4,0],[4,0]];
  async function attempt(a,b){await js('window.__wfAction=undefined;return null');await point(points.trench[0],a);await point(points.trench[1],b);return (await preview()).action.cells;}
  async function discard(){await click('#cancel');await wait('return document.querySelector("#preview").hidden');}
  let first=null,selected=null;
  for(const a of offsets){const cells=await attempt(a,[0,0]);if(cells[0]===expected.cells[0])first=a;await discard();if(first)break;}
  if(!first)throw Error('Referenzstart nicht gefunden');
  for(const b of offsets){const cells=await attempt(first,b);if(JSON.stringify(cells)===JSON.stringify(expected.cells)){selected={first,last:b};break;}await discard();}
  if(!selected)throw Error('Referenzende nicht gefunden');
  await confirm(expected,1700);if(await js('return document.querySelector("#time").textContent')!==pausedAt)throw Error('Uhr lief während der Pause');
  await click('#panel-toggle');await js('const {world}=window.__wfTest;world.zoom=180;world.camera.target.set(-304,0,-256);world.resize();return null');
  await click('#run');await click('#panel-toggle');
  const samples=[];
  for(const target of [180,240]){
    await wait(`const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=${target}`,180,1000);
    const sample=await js('const {world}=window.__wfTest,regular=Math.ceil(world.width/12)*Math.ceil(world.height/12),values=world.flowSamples.slice(regular),colors=world.flowLines.getVerticesData("color"),o=regular*3*2*4;return {time:document.querySelector("#time").textContent,count:values.length,moving:values.filter(v=>Math.hypot(v.vx,v.vy)>=0.01).length,color:Array.from(colors.slice(o,o+4))}');
    if(!sample.count||!sample.moving||Math.abs(sample.color[0]-0.04)>0.001||Math.abs(sample.color[1]-0.20)>0.001)throw Error(`Grabenströmung fehlt: ${JSON.stringify(sample)}`);
    writeFileSync(`/tmp/waterfighter-safari-south-${target}.png`,Buffer.from(await command(prefix+'/screenshot',undefined,'GET'),'base64'));samples.push(sample);
  }
  await wait('return !document.querySelector("#result").hidden',180,1000);
  const result=await js('return {title:document.querySelector("#result-title").textContent,details:document.querySelector("#result-details").textContent}');
  if(result.title!=='Schadensziel erreicht')throw Error(`Ziel verfehlt: ${JSON.stringify(result)}`);
  await click('#again');await wait('return document.querySelector("#result").hidden && document.querySelector("#time").textContent==="00:00" && document.querySelector("#budget").textContent.replace(/\\s/g,"")==="10000"');
  console.log(JSON.stringify({browser:session.capabilities.browserVersion,scenario:points.scenario,viewport,pausedAt,selected,samples,result,wallSeconds:(Date.now()-started)/1000},null,2));
} finally {await command(prefix,undefined,'DELETE');}
