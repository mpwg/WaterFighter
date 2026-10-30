/** Production round: southern dams, then a selected building demolished at 180 s. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {damPath} from '../src/simulation/path.ts';
const points=JSON.parse(readFileSync('tests/fixtures/south-screen-points.json','utf8'));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:points.viewport}),errors=[],actions=[];
await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {postMessage(message,options){if(message?.type==='preview')window.__action=message.action;return super.postMessage(message,options);}};});
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:30000});
 const scenario=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 if(scenario!==points.scenario||scenario!==fixture.scenario)throw Error('Szenarioversion stimmt nicht');
 async function confirm(expected,cost){
  await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:15000});
  const actual=await page.evaluate(()=>window.__action),preview=await page.locator('#preview-text').textContent();
  if(JSON.stringify(actual)!==JSON.stringify(expected)||!preview?.replace(/\s/g,' ').includes(`Kosten: ${cost}`))throw Error(`Abweichende Vorschau: ${JSON.stringify({actual,expected,preview})}`);
  await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:15000});
  actions.push({kind:expected.kind,time:await page.locator('#time').textContent(),preview,budget:await page.locator('#budget').textContent()});
 }
 await page.locator('[data-mode="dam"]').click();
 for(const [i,segment] of points.dams.entries()){
  for(const p of segment)await page.mouse.click(p.x,p.y);
  const step=fixture.strategies['south-control'][i];await confirm({kind:'dam',faces:damPath(step.start,step.end,200)},[400,720,640][i]);
 }
 await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
 await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=180;},null,{timeout:180000});
 await page.getByRole('button',{name:'Pause'}).click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert');
 const pausedAt=await page.locator('#time').textContent();
 await page.locator('[data-mode="demolish"]').click();await page.locator('#panel-toggle').click();
 await page.mouse.click(439.81117482960224,488.34501120457134);
 await confirm({kind:'demolish',buildingId:'w316294475-0'},154);
 if(await page.locator('#time').textContent()!==pausedAt)throw Error('Zeit lief während der Pause weiter');
 await page.locator('#panel-toggle').click();await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='8086');
 await page.getByRole('button',{name:'Fortsetzen'}).click();
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={scenario,browser:browser.version(),viewport:points.viewport,pausedAt,actions,wallSeconds:(Date.now()-start)/1000,title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),errors};
 if(report.title!=='Schadensziel erreicht'||errors.length)throw Error(JSON.stringify(report));
 await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetScore=await page.locator('#damage-total').textContent();if(!report.resetScore.includes('Schaden 0 /'))throw Error('Schaden nach Neustart nicht zurückgesetzt');
 writeFileSync('/tmp/waterfighter-south-demolition.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
