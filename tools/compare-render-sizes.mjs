/** Compare viewport sizes under the same desktop software-rendering setup. */
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const results=[];
try {
 for(const viewport of [{width:600,height:400},{width:1200,height:800},{width:1800,height:1200}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
  await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  await page.addScriptTag({path:'tools/measure-session.js'});
  await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
  await page.waitForTimeout(15000);
  const measurement=await page.evaluate(()=>window.waterfighterMeasurement.stop());
  const canvas=await page.locator('canvas').evaluate(e=>({width:e.width,height:e.height}));
  results.push({viewport,canvas,frameCount:measurement.frameCount,frameP95Ms:measurement.frameTimeP95Ms,simRate:measurement.simSecondsPerWallSecond,errors});
  if(errors.length||!measurement.frameCount)throw Error('Unvollständige Messung');
  await page.close();
 }
 const report={browser:browser.version(),durationSeconds:15,results};
 writeFileSync('/tmp/waterfighter-render-sizes.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
