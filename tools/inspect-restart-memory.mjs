/** Shortened rounds for a page-heap investigation, not a full-round stability test. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {processTreeRss,processTreeMemoryByRole} from './process-memory.mjs';
const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
scenario.parameters.duration=2;
const workerGc=process.argv.includes('--worker-gc');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined,args:workerGc?['--js-flags=--expose-gc']:[]});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
const cdp=await page.context().newCDPSession(page);
const report={version:scenario.version,browser:browser.version(),duration:2,workerGc,rounds:[],errors};
try {
  await page.route('**/scenarios/brigittenau-v1.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(scenario)}));
  await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
  await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  for(let i=0;i<12;i++) {
    await page.locator('#speed').click();await page.locator('#run').click();
    await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:30000});
    await page.locator('#again').click();
    await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00');
    if(workerGc) {
      const workers=page.workers();
      if(workers.length!==1)throw Error(`Erwartet: ein Worker, gefunden: ${workers.length}`);
      await workers[0].evaluate(()=>{if(typeof globalThis.gc!=='function')throw Error('Worker-GC nicht verfügbar');globalThis.gc();});
    }
    await cdp.send('HeapProfiler.collectGarbage');
    const heap=await cdp.send('Runtime.getHeapUsage');
    report.rounds.push({round:i+1,pageHeapUsed:heap.usedSize,pageHeapTotal:heap.totalSize,processTreeRss:processTreeRss(),processMemoryByRole:processTreeMemoryByRole()});
  }
  if(errors.length)throw Error(errors.join('; '));
} finally {
  writeFileSync('/tmp/waterfighter-restart-memory.json',JSON.stringify(report,null,2));
  await browser.close();
}
