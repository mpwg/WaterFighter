/** Full local production round with a confirmed trench, live score and restart. */
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 const scenario=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
 await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
 await page.locator('[data-mode="trench"]').click();await page.mouse.click(800,360);await page.mouse.click(850,385);
 await page.waitForFunction(()=>!document.querySelector('#confirm').disabled);await page.locator('#confirm').click();
 await page.waitForFunction(()=>document.querySelector('#preview').hidden);
 const budget=await page.locator('#budget').textContent();
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={browser:browser.version(),scenario,budget,wallSeconds:(Date.now()-start)/1000,result:await page.locator('#result-details').textContent(),score:await page.locator('#damage-total').textContent(),breakdown:await page.locator('#damage-breakdown').textContent(),errors};
 await page.screenshot({path:'/tmp/waterfighter-14-production-result.png'});
 await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetBudget=await page.locator('#budget').textContent();report.resetScore=await page.locator('#damage-total').textContent();
 writeFileSync('/tmp/waterfighter-14-production-round.json',JSON.stringify(report,null,2));
 if(errors.length||budget.replace(/\s/g,'')==='10000'||report.resetBudget.replace(/\s/g,'')!=='10000'||!report.resetScore.includes('Schaden 0 /'))throw Error(`Prüfung unvollständig: ${JSON.stringify(report)}`);
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
