/** Development-only layer ablation to locate rendering cost. */
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const results=[];
try {
 for(const mode of ['all','without-water','without-buildings','without-both']){
  const page=await browser.newPage({viewport:{width:1200,height:800},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();const body=await response.text();await route.fulfill({response,body:body+'\nexport { world };\n'});});
  await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');
  await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  await page.evaluate(async mode=>{
   const url=document.querySelector('script[src*="/src/main.ts"]').src;
   const {world}=await import(url);
   if(mode==='without-water'||mode==='without-both')world.water.setEnabled(false);
   if(mode==='without-buildings'||mode==='without-both')for(const m of world.scene.meshes)if(m.metadata?.buildingId)m.setEnabled(false);
  },mode);
  await page.addScriptTag({path:'tools/measure-session.js'});
  await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
  await page.waitForTimeout(15000);
  const measurement=await page.evaluate(()=>window.waterfighterMeasurement.stop());
  results.push({mode,frameCount:measurement.frameCount,frameP95Ms:measurement.frameTimeP95Ms,simRate:measurement.simSecondsPerWallSecond,errors});
  if(errors.length||!measurement.frameCount)throw Error('Unvollständige Messung');
  await page.close();
 }
 const report={browser:browser.version(),durationSeconds:15,results};
 writeFileSync('/tmp/waterfighter-render-layers.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
