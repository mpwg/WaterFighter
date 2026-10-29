/** Full production round with three dams and the northern land trench. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const delayed=process.argv.includes('--after-flood');
const points=JSON.parse(readFileSync('tests/fixtures/land-screen-points.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:points.viewport}),errors=[];
await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {postMessage(message,options){if(message?.type==='preview'&&message.action?.kind==='trench')window.__landPreviewCells=message.action.cells;return super.postMessage(message,options);}};});
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:30000});
 const scenario=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 if(scenario!==points.scenario)throw Error('Szenarioversion stimmt nicht');
 const actions=[];
 async function confirm(name,cost){
  try {await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:15000});}
  catch(e){await page.screenshot({path:'/tmp/waterfighter-land-preview-failure.png'});console.error(JSON.stringify({name,time:await page.locator('#time').textContent(),preview:await page.locator('#preview-text').textContent(),visible:await page.locator('#preview').isVisible(),cells:await page.evaluate(()=>window.__landPreviewCells)}));throw e;}
  const preview=await page.locator('#preview-text').textContent();
  if(!preview?.replace(/\s/g,' ').includes(`Kosten: ${cost}`))throw Error(`Abweichende Vorschau: ${preview}`);
  await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:15000});
  actions.push({name,time:await page.locator('#time').textContent(),preview,budget:await page.locator('#budget').textContent()});
 }
 await page.locator('[data-mode="dam"]').click();
 for(const [i,segment] of points.dams.entries()){for(const p of segment)await page.mouse.click(p.x,p.y);await confirm(`Damm ${i+1}`,[400,800,640][i]);}
 let start,pausedAt=null;
 if(delayed){
  await page.locator('#speed').click();start=Date.now();await page.locator('#run').click();
  await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=150;},null,{timeout:180000});
  await page.getByRole('button',{name:'Pause'}).click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert',null,{timeout:15000});
  pausedAt=await page.locator('#time').textContent();
 }
 await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
 let selected=null;
 const offsets=delayed?[[0,-1],[1,-1],[-1,-1],[0,-0.5],[1,-0.5],[-1,-0.5],[0,-1.5],[1,-1.5],[-1,-1.5],[2,-1],[-2,-1],[2,-0.5],[-2,-0.5]]:[[0,0]];
 for(const [dx,dy] of offsets){
  await page.evaluate(()=>{window.__landPreviewCells=undefined;});
  await page.mouse.click(points.trench[0].x,points.trench[0].y);
  await page.mouse.click(points.trench[1].x+dx,points.trench[1].y+dy);
  await page.waitForFunction(()=>Array.isArray(window.__landPreviewCells),null,{timeout:15000});
  const cells=await page.evaluate(()=>window.__landPreviewCells);
  if(cells.length===26&&cells.every((cell,i)=>cell===800+i)){selected={dx,dy,cells};break;}
  await page.locator('#cancel').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden);
 }
 if(!selected)throw Error('Referenzgraben mit den getesteten Endpunkten nicht getroffen');
 await confirm('Graben',650);
 if(delayed&&await page.locator('#time').textContent()!==pausedAt)throw Error('Zeit lief während der Pause weiter');
 await page.locator('#panel-toggle').click();await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='7510');
 if(delayed)await page.getByRole('button',{name:'Fortsetzen'}).click();
 else {await page.locator('#speed').click();start=Date.now();await page.locator('#run').click();}
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={scenario,browser:browser.version(),viewport:points.viewport,pausedAt,selected,actions,wallSeconds:(Date.now()-start)/1000,title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),errors};
 if(report.title!=='Schadensziel erreicht'||errors.length)throw Error(JSON.stringify(report));
 await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetScore=await page.locator('#damage-total').textContent();
 if(!report.resetScore.includes('Schaden 0 /'))throw Error('Schaden nach Neustart nicht zurückgesetzt');
 writeFileSync(delayed?'/tmp/waterfighter-land-delayed-production.json':'/tmp/waterfighter-land-production.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
