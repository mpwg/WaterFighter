/** Three full 2× rounds, no interventions, in a local static build. */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { processTreeRss } from './process-memory.mjs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined,args:['--enable-precise-memory-info']});
const page=await browser.newPage({viewport:{width:1200,height:800}});const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('crash',()=>errors.push('Browserseite abgestürzt'));browser.on('disconnected',()=>errors.push('Browserverbindung beendet'));
const report={version:null,browser:browser.version(),rounds:[],errors};
const save=()=>writeFileSync('/tmp/waterfighter-three-rounds.json',JSON.stringify(report,null,2));
try {
  await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  report.version=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json');return (await r.json()).version;});
  for(let i=0;i<3;i++) {
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
    await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
    const result=await page.locator('#result-details').textContent(),heapAfter=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);
    const row={round:i+1,pausedAt:paused,interactions:['Pause','Zoom','Fortsetzen'],wallSeconds:(Date.now()-start)/1000,result,heapBefore,heapAfter,rssBefore,rssAfter:processTreeRss()};report.rounds.push(row);save();console.log(JSON.stringify(row));
    if(i<2){await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden && document.querySelector('#time').textContent==='00:00');}
  }
} catch(error) {errors.push(String(error));save();process.exitCode=1;} finally {await browser.close();}
