/** Three full 2× rounds, no interventions, in a local static build. */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { processTreeRss } from './process-memory.mjs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined,args:['--enable-precise-memory-info']});
const page=await browser.newPage({viewport:{width:1200,height:800}});const errors=[];
let phase='Laden';
page.on('pageerror',e=>errors.push(`pageerror (${phase}): ${e.message}`));page.on('crash',()=>errors.push(`Browserseite abgestürzt (${phase})`));page.on('close',()=>errors.push(`Browserseite geschlossen (${phase})`));browser.on('disconnected',()=>errors.push(`Browserverbindung beendet (${phase})`));
const report={version:null,browser:browser.version(),rounds:[],errors};
const save=()=>writeFileSync('/tmp/waterfighter-three-rounds.json',JSON.stringify(report,null,2));
try {
  await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  report.version=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
  for(let i=0;i<3;i++) {
    phase=`Runde ${i+1}: Start`;
    const rssBefore=processTreeRss();
    const heapBefore=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);
    await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
    await page.waitForFunction(()=>document.querySelector('#time').textContent!=='00:00',null,{timeout:30000});
    await page.getByRole('button',{name:'Pause'}).click();
    await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert');
    const paused=await page.locator('#time').textContent();
    await page.locator('#zoom-in').click();await page.locator('#zoom-out').click();
    if(await page.locator('#time').textContent()!==paused)throw Error('Zeit lief während Pause weiter');
    await page.getByRole('button',{name:'Fortsetzen'}).click();
    await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
    phase=`Runde ${i+1}: Flut`;
    await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
    phase=`Runde ${i+1}: Ergebnis`;
    const result=await page.locator('#result-details').textContent();
    if(!result?.includes('Gesamtschaden:')||!result.includes('Budgetrest: 10'))throw Error(`Ungültiges Ergebnis: ${result}`);
    const damage=Number(result.match(/Gesamtschaden:\s*([\d\s]+)/)?.[1].replace(/\s/g,''));
    if(!Number.isFinite(damage) || damage<=50000)throw Error(`Ungültiger Schaden: ${result}`);
    if(i>0 && Math.abs(damage-report.rounds[0].damage)>100)throw Error(`Abweichendes Rundenergebnis: ${result}`);
    if(errors.length)throw Error(errors.join('; '));
    const heapAfter=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);
    const row={round:i+1,pausedAt:paused,interactions:['Pause','Zoom','Fortsetzen'],wallSeconds:(Date.now()-start)/1000,result,damage,heapBefore,heapAfter,rssBefore,rssAfter:processTreeRss()};report.rounds.push(row);save();console.log(JSON.stringify(row));
    if(i<2){phase=`Runde ${i+1}: Neustart`;await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden && document.querySelector('#time').textContent==='00:00' && document.querySelector('#state').textContent==='Vorbereitung');}
  }
} catch(error) {errors.push(`${phase}: ${String(error)}`);save();process.exitCode=1;} finally {await browser.close();}
