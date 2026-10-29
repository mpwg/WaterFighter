/** Render precomputed diagnostic states with UI hidden; no game-state mutation. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const {states}=JSON.parse(readFileSync('/tmp/waterfighter-candidate-states.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}});
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body+'\nexport { world };\n'});});
 await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);await page.waitForTimeout(500);
 if(process.argv.includes('--collapse'))await page.locator('#panel-toggle').click();
 else if(!process.argv.includes('--pan'))await page.addStyleTag({content:'header,section,footer,.map-controls,.preview {visibility:hidden !important}'});
 if(process.argv.includes('--pan'))await page.evaluate(async()=>{const url=document.querySelector('script[src*="/src/main.ts"]').src,{world}=await import(url);world.pan(260,0);});
 for(const state of states){
  await page.evaluate(async state=>{const url=document.querySelector('script[src*="/src/main.ts"]').src,{world}=await import(url);world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));await new Promise(r=>world.scene.onAfterRenderObservable.addOnce(r));},state);
  await page.screenshot({path:`/tmp/waterfighter-${process.argv.includes('--collapse')?'collapse':process.argv.includes('--pan')?'pan':'map'}-${String(state.time).padStart(3,'0')}.png`});
 }
 console.log(JSON.stringify({browser:browser.version(),times:states.map(s=>s.time)}));
} finally {await browser.close();}
