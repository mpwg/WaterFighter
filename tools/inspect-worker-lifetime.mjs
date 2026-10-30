/** Diagnostic only: weak references to prior worker states across shortened rounds. */
import {gzipSync} from 'node:zlib';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
scenario.parameters.duration=2;
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined,args:['--js-flags=--expose-gc']});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
const report={scenario:scenario.version,browser:browser.version(),duration:2,rounds:[],errors};
try {
 await page.route('**/scenarios/brigittenau-v1.json.bin',r=>r.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
 await page.route('**/src/worker.ts?*',async route=>{
  const response=await route.fetch(),body=await response.text();
  if(!body.includes('controller'))throw Error('Workerquelle nicht gefunden');
  await route.fulfill({response,body:body+'\nself.__diagnosticController=controller;\n'});
 });
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:30000});
 for(let i=0;i<12;i++) {
  const workers=page.workers();if(workers.length!==1)throw Error(`Erwartet: ein Worker, gefunden: ${workers.length}`);
  const worker=workers[0];
  await worker.evaluate(()=>{
   if(typeof globalThis.gc!=='function'||!globalThis.__diagnosticController)throw Error('Workerdiagnose nicht verfügbar');
   const c=globalThis.__diagnosticController;
   (globalThis.__oldStates??=[]).push({game:new WeakRef(c.game),solver:new WeakRef(c.solver)});
  });
  await page.locator('#speed').click();await page.locator('#run').click();
  await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:30000});
  await page.locator('#again').click();
  await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#state').textContent==='Vorbereitung',null,{timeout:30000});
  const state=await worker.evaluate(async()=>{
   await new Promise(resolve=>setTimeout(resolve,0));globalThis.gc();
   await new Promise(resolve=>setTimeout(resolve,0));globalThis.gc();
   await new Promise(resolve=>setTimeout(resolve,0));
   return {prior:globalThis.__oldStates.length,gameAlive:globalThis.__oldStates.filter(x=>x.game.deref()).length,solverAlive:globalThis.__oldStates.filter(x=>x.solver.deref()).length};
  });
  report.rounds.push({round:i+1,...state});console.log(JSON.stringify(report.rounds.at(-1)));
 }
 if(errors.length)throw Error(errors.join('; '));
} finally {
 writeFileSync('/tmp/waterfighter-worker-lifetime.json',JSON.stringify(report,null,2));
 await browser.close();
}
