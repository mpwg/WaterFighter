/** Full production round with the separated southern trench and its dam control. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {damPath,trenchPath} from '../src/simulation/path.ts';
const delayed=process.argv.includes('--after-flood');
const points=JSON.parse(readFileSync('tests/fixtures/south-screen-points.json','utf8'));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==points.scenario)throw Error('Szenarioversion stimmt nicht');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:points.viewport}),errors=[];
await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {postMessage(message,options){if(message?.type==='preview')window.__southAction=message.action;return super.postMessage(message,options);}};});
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:30000});
 const scenario=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 if(scenario!==points.scenario)throw Error('Szenarioversion stimmt nicht');
 const actions=[];
 async function confirm(index,cost){
  await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:15000});
  const preview=await page.locator('#preview-text').textContent(),actual=await page.evaluate(()=>window.__southAction),step=fixture.strategies['south-divert'][index];
  const expected=step.kind==='dam'?{kind:'dam',faces:damPath(step.start,step.end,200)}:{kind:'trench',cells:trenchPath(step.start,step.end,200)};
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(`Abweichender Verlauf: ${JSON.stringify(actual)}`);
  if(!preview?.replace(/\s/g,' ').includes(`Kosten: ${cost}`))throw Error(`Abweichende Vorschau: ${preview}`);
  await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:15000});
  actions.push({kind:step.kind,time:await page.locator('#time').textContent(),preview,budget:await page.locator('#budget').textContent()});
 }
 await page.locator('[data-mode="dam"]').click();
 for(const [i,segment] of points.dams.entries()){for(const p of segment)await page.mouse.click(p.x,p.y);await confirm(i,[400,720,640][i]);}
 let start,pausedAt=null,selected=null;
 if(delayed){
  await page.locator('#speed').click();start=Date.now();await page.locator('#run').click();
  await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=150;},null,{timeout:180000});
  await page.getByRole('button',{name:'Pause'}).click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert',null,{timeout:15000});
  pausedAt=await page.locator('#time').textContent();
 }
 await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
 if(delayed){
  const step=fixture.strategies['south-divert'][3],expected=trenchPath(step.start,step.end,200);
  const offsets=[[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1],[0,-2],[0,2],[-2,0],[2,0],[-2,-2],[2,-2],[-2,2],[2,2],[0,-4],[0,4],[-4,0],[4,0]];
  async function attempt(a,b){
   await page.evaluate(()=>{window.__southAction=undefined;});
   await page.mouse.click(points.trench[0].x+a[0],points.trench[0].y+a[1]);
   await page.mouse.click(points.trench[1].x+b[0],points.trench[1].y+b[1]);
   await page.waitForFunction(()=>window.__southAction?.kind==='trench',null,{timeout:15000});
   return page.evaluate(()=>window.__southAction.cells);
  }
  async function discard(){await page.locator('#cancel').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden);}
  let first=null;
  for(const a of offsets){const cells=await attempt(a,[0,0]);if(cells[0]===expected[0])first=a;await discard();if(first)break;}
  if(!first)throw Error('Referenzstart mit getesteten Bildschirmpositionen nicht getroffen');
  for(const b of offsets){const cells=await attempt(first,b);if(JSON.stringify(cells)===JSON.stringify(expected)){selected={first,last:b,cells};break;}await discard();}
  if(!selected)throw Error('Referenzende mit getesteten Bildschirmpositionen nicht getroffen');
 }else for(const p of points.trench)await page.mouse.click(p.x,p.y);
 await confirm(3,1700);
 if(delayed&&await page.locator('#time').textContent()!==pausedAt)throw Error('Zeit lief während der Pause weiter');
 await page.locator('#panel-toggle').click();await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='6540');
 if(delayed)await page.getByRole('button',{name:'Fortsetzen'}).click();
 else {await page.locator('#speed').click();start=Date.now();await page.locator('#run').click();}
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={scenario,browser:browser.version(),viewport:points.viewport,pausedAt,selected,actions,wallSeconds:(Date.now()-start)/1000,title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),errors};
 if(report.title!=='Schadensziel erreicht'||errors.length)throw Error(JSON.stringify(report));
 await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetScore=await page.locator('#damage-total').textContent();
 if(!report.resetScore.includes('Schaden 0 /'))throw Error('Schaden nach Neustart nicht zurückgesetzt');
 writeFileSync(delayed?'/tmp/waterfighter-south-delayed-production.json':'/tmp/waterfighter-south-production.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
