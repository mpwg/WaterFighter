/** Render saved numerical states; this is a diagnostic, not a live browser round. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const data=JSON.parse(readFileSync('/tmp/waterfighter-land-trench-states.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}});
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world, worker };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.evaluate(async ({bed,cells})=>{const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src);worker.terminate();world.updateState(Float32Array.from(bed),[...world.currentBuildings.values()],[],1,cells);world.zoom=180;world.camera.target.set(-348,0,-380);world.resize();},data);
 await page.addStyleTag({content:'header,section,footer,.map-controls,.preview {visibility:hidden !important}'});
 for(const state of data.states){
  await page.evaluate(async state=>{const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));await new Promise(r=>world.scene.onAfterRenderObservable.addOnce(r));},state);
  await page.screenshot({path:`/tmp/waterfighter-land-trench-${state.time}.png`});
 }
 console.log(JSON.stringify({scenario:data.scenario,browser:browser.version(),times:data.states.map(s=>s.time)}));
} finally {await browser.close();}
