/** Render the two diagnostic 270 s snapshots with the game's renderer. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport {world,worker};\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5198/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.addStyleTag({content:'header,section,footer,.map-controls,.preview,.inspection {visibility:hidden !important}'});
 for(const mode of ['control','trench']){
  const state=JSON.parse(readFileSync(`/tmp/wf-partial-270-${mode}.json`,'utf8'));
  if(state.scenario!=='1.4-draft'||state.mode!==mode||state.time!==270)throw Error('Snapshot passt nicht');
  await page.evaluate(async state=>{
   const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
   worker.terminate();world.zoom=300;world.camera.target.set(-300,0,-200);world.resize();
   world.updateState(Float32Array.from(state.bed),state.buildings,state.dams,state.mode==='control'?1:2,state.trenches);
   world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));
   await new Promise(resolve=>world.scene.onAfterRenderObservable.addOnce(resolve));
  },state);
  await page.screenshot({path:`/tmp/wf-partial-270-${mode}.png`});
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({browser:browser.version(),scenario:'1.4-draft',time:270,errors}));
} finally {await browser.close();}
