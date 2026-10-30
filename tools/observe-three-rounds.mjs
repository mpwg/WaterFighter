/** Three full 2× rounds in a local static build, optionally with interventions. */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { processTreeRss } from './process-memory.mjs';
const close=process.argv.includes('--close');
const withActions=process.argv.includes('--actions');
if(close&&withActions)throw Error('--close und --actions sind nicht kombinierbar');
const roundsOption=process.argv.find(arg=>arg.startsWith('--rounds='));
const rounds=roundsOption?Number(roundsOption.slice(9)):3;
if(!Number.isInteger(rounds)||rounds<1||rounds>3)throw Error('--rounds muss zwischen 1 und 3 liegen');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined,args:['--enable-precise-memory-info']});
const page=await browser.newPage({viewport:{width:1200,height:800}});const errors=[];
let phase='Laden';
page.on('pageerror',e=>errors.push(`pageerror (${phase}): ${e.message}`));page.on('crash',()=>errors.push(`Browserseite abgestürzt (${phase})`));page.on('close',()=>errors.push(`Browserseite geschlossen (${phase})`));browser.on('disconnected',()=>errors.push(`Browserverbindung beendet (${phase})`));
const report={version:null,browser:browser.version(),close,withActions,rounds:[],errors};
const save=()=>writeFileSync(process.env.WATERFIGHTER_ROUNDS_OUTPUT??(withActions?'/tmp/waterfighter-action-rounds.json':close?'/tmp/waterfighter-close-rounds.json':'/tmp/waterfighter-three-rounds.json'),JSON.stringify(report,null,2));
try {
  await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  report.version=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
  for(let i=0;i<rounds;i++) {
    phase=`Runde ${i+1}: Start`;
    const rssBefore=processTreeRss();
    const heapBefore=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);
    await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
    await page.waitForFunction(()=>document.querySelector('#time').textContent!=='00:00',null,{timeout:30000});
    await page.getByRole('button',{name:'Pause'}).click();
    await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert');
    const paused=await page.locator('#time').textContent();
    const actions=[];
    if(withActions){
      for(const mode of ['trench','dam','demolish']){
        phase=`Runde ${i+1}: ${mode}`;
        await page.locator(`[data-mode="${mode}"]`).click();
        if(mode==='demolish')await page.mouse.click(600,320);
        else {await page.mouse.click(800,360);await page.mouse.click(850,385);}
        await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:30000});
        const preview=await page.locator('#preview-text').textContent();
        const cost=Number(preview?.match(/Kosten: ([\d\s]+)/)?.[1].replace(/\s/g,''));
        const before=Number((await page.locator('#budget').textContent())?.replace(/\s/g,''));
        if(!Number.isFinite(cost)||cost<=0)throw Error(`Ungültige Vorschau: ${preview}`);
        await page.locator('#confirm').click();
        await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:30000});
        await page.waitForFunction(expected=>Number(document.querySelector('#budget').textContent.replace(/\s/g,''))===expected,before-cost,{timeout:30000});
        if(await page.locator('#time').textContent()!==paused || await page.locator('#state').textContent()!=='Pausiert')throw Error('Zeit lief während Maßnahme weiter');
        actions.push({mode,cost,budget:before-cost});
      }
    }
    if(close){for(let step=0;step<14;step++)await page.locator('#zoom-in').click();}
    else {await page.locator('#zoom-in').click();await page.locator('#zoom-out').click();}
    if(await page.locator('#time').textContent()!==paused)throw Error('Zeit lief während Pause weiter');
    await page.getByRole('button',{name:'Fortsetzen'}).click();
    await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
    phase=`Runde ${i+1}: Flut`;
    await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
    phase=`Runde ${i+1}: Ergebnis`;
    const result=await page.locator('#result-details').textContent();
    if(!result?.includes('Gesamtschaden:'))throw Error(`Ungültiges Ergebnis: ${result}`);
    const remaining=Number(result.match(/Budgetrest:\s*([\d\s]+)/)?.[1].replace(/\s/g,''));
    if(remaining!==(withActions?actions.at(-1)?.budget:10000))throw Error(`Abweichendes Budget: ${result}`);
    const damage=Number(result.match(/Gesamtschaden:\s*([\d\s]+)/)?.[1].replace(/\s/g,''));
    if(!Number.isFinite(damage) || damage<=0 || (!withActions && damage<=50000))throw Error(`Ungültiger Schaden: ${result}`);
    if(!withActions && i>0 && Math.abs(damage-report.rounds[0].damage)>100)throw Error(`Abweichendes Rundenergebnis: ${result}`);
    if(errors.length)throw Error(errors.join('; '));
    const heapAfter=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);
    const row={round:i+1,pausedAt:paused,actions,interactions:['Pause',close?'Maximale Vergrößerung':'Zoom','Fortsetzen'],wallSeconds:(Date.now()-start)/1000,result,damage,heapBefore,heapAfter,rssBefore,rssAfter:processTreeRss()};report.rounds.push(row);save();console.log(JSON.stringify(row));
    if(i<rounds-1){phase=`Runde ${i+1}: Neustart`;await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden && document.querySelector('#time').textContent==='00:00' && document.querySelector('#state').textContent==='Vorbereitung' && document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000' && document.querySelector('#damage-breakdown').textContent==='Flut 0 · Abriss 0');}
  }
} catch(error) {errors.push(`${phase}: ${String(error)}`);save();process.exitCode=1;} finally {await browser.close();}
