/** Full production round with a late economic demolition and no prepared dams. */
import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {postMessage(m,o){if(m?.type==='preview')window.__action=m.action;return super.postMessage(m,o);}};});
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 const scenario=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 if(scenario!=='1.6-draft')throw Error(`Szenarioversion stimmt nicht: ${scenario}`);
 await page.locator('#speed').click();const started=Date.now();await page.locator('#run').click();
 await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=180;},null,{timeout:180000});
 await page.getByRole('button',{name:'Pause'}).click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert');const pausedAt=await page.locator('#time').textContent();
 await page.locator('[data-mode="demolish"]').click();await page.locator('#panel-toggle').click();await page.mouse.click(326.493,470.721);
 await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:15000});
 const action=await page.evaluate(()=>window.__action),preview=await page.locator('#preview-text').textContent();
 if(JSON.stringify(action)!==JSON.stringify({kind:'demolish',buildingId:'w33581744-0'})||!preview?.replace(/\s/g,' ').includes('Kosten: 1602'))throw Error(`Unerwartete Vorschau: ${JSON.stringify({action,preview})}`);
 await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden);
 if(await page.locator('#time').textContent()!==pausedAt)throw Error('Uhr lief in Pause weiter');
 await page.locator('#panel-toggle').click();await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='8398');
 await page.getByRole('button',{name:'Fortsetzen'}).click();await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:180000});
 const report={scenario,browser:browser.version(),pausedAt,action,preview,wallSeconds:(Date.now()-started)/1000,title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),errors};
 if(report.title!=='Schadensziel verfehlt'||errors.length)throw Error(JSON.stringify(report));
 await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetScore=await page.locator('#damage-total').textContent();if(!report.resetScore.includes('Schaden 0 /'))throw Error('Schaden nicht zurückgesetzt');
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
