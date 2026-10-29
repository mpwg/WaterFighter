/** Full production round with shorter dams and a paused late trench or demolition. */
import {writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {damPath,trenchPath} from '../src/simulation/path.ts';
const demolitionMode=process.argv.includes('--demolition');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],actions=[];
await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original{postMessage(m,o){if(m?.type==='preview')window.__partialAction=m.action;return super.postMessage(m,o);}};});
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));page.on('close',()=>errors.push('Seite geschlossen'));browser.on('disconnected',()=>errors.push('Browser getrennt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4379/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:60000});
 const version=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 if(version!=='1.4-draft')throw Error('Szenarioversion stimmt nicht');
 async function confirm(expected,cost){
  await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:30000});
  const actual=await page.evaluate(()=>window.__partialAction),preview=await page.locator('#preview-text').textContent();
  if(JSON.stringify(actual)!==JSON.stringify(expected)||!preview?.replace(/\s/g,' ').includes(`Kosten: ${cost}`))throw Error(`Unerwartete Vorschau: ${JSON.stringify({actual,preview})}`);
  await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:30000});
  actions.push({kind:expected.kind,time:await page.locator('#time').textContent(),preview});console.log('Bestätigt',expected.kind,actions.at(-1).time);
 }
 const dams=[{points:[[360.615,528.011],[385.837,513.479]],start:[26,0],end:[26,10],cost:400},{points:[[385.837,513.479],[421.193,513.315]],start:[26,10],end:[33,17],cost:560},{points:[[469.175,509.714],[481.802,517.904]],start:[41,28],end:[46,28],cost:200}];
 await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
 for(const dam of dams){for(const [x,y] of dam.points)await page.mouse.click(x,y);await confirm({kind:'dam',faces:damPath(dam.start,dam.end,200)},dam.cost);}
 await page.locator('#panel-toggle').click();await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='8840');
 await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
 await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=180;},null,{timeout:240000});
 await page.getByRole('button',{name:'Pause'}).click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert',null,{timeout:30000});
 const pausedAt=await page.locator('#time').textContent();console.log('Pausiert',pausedAt);let selected=null;
 if(demolitionMode){
  await page.locator('[data-mode="camera"]').click();await page.mouse.click(376,496);
  const inspection=await page.locator('#message').textContent();
  if(!inspection?.includes('Flutschaden'))throw Error(`Gebäudezustand fehlt: ${inspection}`);
  await page.locator('[data-mode="demolish"]').click();await page.mouse.click(376,496);
  await confirm({kind:'demolish',buildingId:'w316294474-0'},1106);selected={point:[376,496],inspection};
 }else{
 const expected=trenchPath([0,46],[47,26],200);
 await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
 const offsets=[[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1],[0,-2],[0,2],[-2,0],[2,0],[-2,-2],[2,-2],[-2,2],[2,2],[0,-4],[0,4],[-4,0],[4,0]];
 async function attempt(a,b){
  await page.evaluate(()=>{window.__partialAction=undefined;});await page.mouse.click(413.617+a[0],436.340+a[1]);await page.mouse.click(481.802+b[0],522.332+b[1]);
  await page.waitForFunction(()=>window.__partialAction?.kind==='trench',null,{timeout:30000});return page.evaluate(()=>window.__partialAction.cells);
 }
 async function discard(){await page.locator('#cancel').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden);}
 let first=null;
 for(const a of offsets){const cells=await attempt(a,[0,0]);if(cells[0]===expected[0])first=a;await discard();if(first)break;}
 if(!first)throw Error('Grabenstart mit getesteten Bildschirmpositionen nicht getroffen');
 for(const b of offsets){const cells=await attempt(first,b);if(JSON.stringify(cells)===JSON.stringify(expected)){selected={first,last:b};break;}await discard();}
 if(!selected)throw Error('Grabenende mit getesteten Bildschirmpositionen nicht getroffen');
 await confirm({kind:'trench',cells:expected},1700);
 await page.locator('#panel-toggle').click();
 }
 if(await page.locator('#time').textContent()!==pausedAt)throw Error('Zeit lief während der Pause weiter');
 await page.waitForFunction(expected=>document.querySelector('#budget').textContent.replace(/\s/g,'')===expected,demolitionMode?'7734':'7140');
 await page.getByRole('button',{name:'Fortsetzen'}).click();await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={mode:demolitionMode?'demolition':'trench',scenario:version,browser:browser.version(),viewport:{width:1600,height:1000},pausedAt,selected,actions,wallSeconds:(Date.now()-start)/1000,title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),errors};
 if(report.title!=='Schadensziel erreicht'||errors.length)throw Error(JSON.stringify(report));
 writeFileSync(`/tmp/waterfighter-partial-${report.mode}-checkpoint.json`,JSON.stringify(report,null,2));console.log('Ergebnis',report.result);
 await page.getByRole('button',{name:'Neue Runde'}).click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetScore=await page.locator('#damage-total').textContent();if(!report.resetScore.includes('Schaden 0 /'))throw Error('Schaden nicht zurückgesetzt');
 writeFileSync(`/tmp/waterfighter-partial-${report.mode}-production.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} catch(error) {console.error('Browserereignisse:',JSON.stringify(errors));throw error;} finally {await browser.close();}
