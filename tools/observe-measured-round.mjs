/** Full 1× desktop round as a diagnostic of the mobile measurement procedure. */
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.addScriptTag({path:'tools/measure-session.js'});
 const start=Date.now();await page.locator('#run').click();
 await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
 await page.locator('[data-mode="trench"]').click();await page.mouse.click(800,360);await page.mouse.click(850,385);
 await page.waitForFunction(()=>!document.querySelector('#confirm').disabled);
 await page.locator('#confirm').click();
 await page.waitForFunction(()=>document.querySelector('#preview').hidden);
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:420000});
 const measurement=await page.evaluate(()=>window.waterfighterMeasurement.stop());
 const report={browser:browser.version(),wallSeconds:(Date.now()-start)/1000,result:await page.locator('#result-details').textContent(),measurement,errors};
 writeFileSync('/tmp/waterfighter-measured-round.json',JSON.stringify(report,null,2));
 if(errors.length||!measurement.frameCount||!measurement.observedWallMs||!measurement.actions.length)throw Error('Messung unvollständig');
 console.log(JSON.stringify({browser:report.browser,wallSeconds:report.wallSeconds,result:report.result,frameCount:measurement.frameCount,frameP95:measurement.frameTimeP95Ms,simRate:measurement.simSecondsPerWallSecond,actionLatencies:measurement.actions.map(a=>a.latencyMs),errors},null,2));
} finally {await browser.close();}
