/** Compare a previous and current Vite build over short 1× windows. */
import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined}),results=[];
try {
 for(const [port,label] of [[Number(process.env.WATERFIGHTER_BASELINE_PORT??5175),'baseline'],[Number(process.env.WATERFIGHTER_CURRENT_PORT??5173),'current'],[Number(process.env.WATERFIGHTER_CURRENT_PORT??5173),'current'],[Number(process.env.WATERFIGHTER_BASELINE_PORT??5175),'baseline']]){
  const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  await page.addScriptTag({path:'tools/measure-session.js'});await page.locator('#run').click();await page.waitForTimeout(15000);
  const m=await page.evaluate(()=>window.waterfighterMeasurement.stop());
  results.push({label,frameCount:m.frameCount,p95Ms:m.frameTimeP95Ms,simRate:m.simSecondsPerWallSecond,errors});
  if(errors.length||!m.frameCount)throw Error('Unvollständige Messung');await page.close();
 }
 console.log(JSON.stringify({browser:browser.version(),seconds:15,results},null,2));
} finally {await browser.close();}
