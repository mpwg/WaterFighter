/** Render two saved diagnostic snapshots using the actual World renderer. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world, worker };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5198/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.addStyleTag({content:'header, section, footer, .map-controls, .preview, .inspection {visibility:hidden !important}'});
 for(const mode of ['control','trench']){
  const state=JSON.parse(readFileSync(`/tmp/wf-north-210-${mode}.json`,'utf8'));
  await page.evaluate(async state=>{
   const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
   worker.terminate();world.zoom=180;world.camera.target.set(-320,0,-300);world.resize();
   world.updateState(Float32Array.from(state.bed),state.buildings,state.dams,modeRevision(state.mode),state.trenches);
   world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));
   function modeRevision(mode){return mode==='control'?1:2;}
   await new Promise(resolve=>world.scene.onAfterRenderObservable.addOnce(resolve));
  },state);
  await page.screenshot({path:`/tmp/wf-north-210-${mode}.png`});
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({browser:browser.version(),scenario:'1.4-draft',time:210,errors}));
} finally {await browser.close();}
