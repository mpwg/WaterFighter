/** Full 1× round in emulated touch: desktop diagnostic, not a device acceptance. */
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const landscape=process.argv.includes('--landscape');
const viewport=landscape?{width:844,height:390}:{width:390,height:844},deviceScaleFactor=3;
const points=landscape?{start:[470,210],end:[520,220],building:[480,140]}:{start:[310,500],end:[350,510],building:[315,305]};
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const context=await browser.newContext({viewport,deviceScaleFactor,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
let phase='Laden';
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:30000});
 const canvas=await page.evaluate(()=>{const element=document.querySelector('canvas'),rect=element.getBoundingClientRect();return {pixelRatio:devicePixelRatio,cssWidth:rect.width,cssHeight:rect.height,bufferWidth:element.width,bufferHeight:element.height};});
 await page.addScriptTag({path:'tools/measure-session.js'});
 const start=Date.now();await page.locator('#run').tap();
 await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft',null,{timeout:30000});
 const actions=[];
 for(const mode of ['trench','dam','demolish']) {
  phase=`Werkzeug ${mode}`;
  await page.locator(`[data-mode="${mode}"]`).tap();
  if(mode==='demolish')await page.touchscreen.tap(...points.building);
  else {await page.touchscreen.tap(...points.start);await page.touchscreen.tap(...points.end);}
  await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:30000});
  const preview=await page.locator('#preview-text').textContent();
  const cost=Number(preview?.match(/Kosten: ([\d\s]+)/)?.[1].replace(/\s/g,''));
  const before=Number((await page.locator('#budget').textContent())?.replace(/\s/g,''));
  if(!Number.isFinite(cost)||cost<=0)throw Error(`Ungültige Vorschau: ${preview}`);
  await page.locator('#confirm').tap();
  await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:30000});
  await page.waitForFunction(expected=>Number(document.querySelector('#budget').textContent.replace(/\s/g,''))===expected,before-cost,{timeout:30000});
  actions.push({mode,cost,budget:before-cost});console.log('Bestätigt',mode,cost,before-cost);
 }
 phase='Vollständige Runde';
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:420000});
 const measurement=await page.evaluate(()=>window.waterfighterMeasurement.stop());
 const report={browser:browser.version(),viewport,deviceScaleFactor,canvas,wallSeconds:(Date.now()-start)/1000,result:await page.locator('#result-details').textContent(),actions,measurement,errors};
 writeFileSync(process.env.WATERFIGHTER_MOBILE_REPORT??(landscape?'/tmp/waterfighter-mobile-landscape-performance.json':'/tmp/waterfighter-mobile-performance.json'),JSON.stringify(report,null,2));
 if(errors.length||!measurement.frameCount||!measurement.observedWallMs||measurement.actions.length!==actions.length)throw Error('Messung unvollständig');
 console.log(JSON.stringify({browser:report.browser,viewport,deviceScaleFactor,canvas,wallSeconds:report.wallSeconds,result:report.result,frameCount:measurement.frameCount,frameP95:measurement.frameTimeP95Ms,simRate:measurement.simSecondsPerWallSecond,actionLatencies:measurement.actions.map(a=>a.latencyMs),errors},null,2));
} catch(error) {console.error('Fehlerphase:',phase,'Seitenfehler:',JSON.stringify(errors));throw error;}
finally {await browser.close();}
