/** Inspect a saved water snapshot at narrow viewport sizes; no real device is emulated. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const state=JSON.parse(readFileSync('/tmp/wf-north-210-trench.json','utf8'));
if(state.scenario!=='1.4-draft'||state.time!==210)throw Error('Gespeicherter Szenariozustand passt nicht');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world, worker };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5198/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.locator('#panel-toggle').tap();
 await page.evaluate(async state=>{
  const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src);worker.terminate();
  world.updateState(Float32Array.from(state.bed),state.buildings,state.dams,1,state.trenches);
  world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));
  await new Promise(resolve=>world.scene.onAfterRenderObservable.addOnce(resolve));
 },state);
 await page.screenshot({path:'/tmp/wf-flow-mobile-overview.png'});
 await page.evaluate(async()=>{const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);world.zoom=180;world.camera.target.set(-320,0,-300);world.resize();await new Promise(resolve=>world.scene.onAfterRenderObservable.addOnce(resolve));});
 await page.screenshot({path:'/tmp/wf-flow-mobile-zoom.png'});
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({browser:browser.version(),viewport:{width:390,height:844},deviceScaleFactor:1,stateTime:state.time,errors}));
} finally {await context.close();await browser.close();}
