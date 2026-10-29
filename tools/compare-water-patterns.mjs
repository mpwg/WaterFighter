import { gzipSync } from 'node:zlib';
/** Compare baseline :4174 and current :4173 using synthetic initial depths. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const original=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
for(const mode of ['dry','wet','mixed'])for(const [port,name] of [[4174,'before'],[4173,'after']]){
 const scenario=structuredClone(original),w=scenario.grid.width;
 scenario.initialDepth=scenario.initialDepth.map((_,i)=>mode==='dry'?0:mode==='wet'?1:((Math.floor(i/w/8)+Math.floor(i%w/8))%2?0:1));
 const page=await browser.newPage({viewport:{width:1200,height:800}});
 await page.route('**/scenarios/brigittenau-v1.json.bin',r=>r.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
 await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!document.querySelector('#run').disabled);await page.waitForTimeout(1000);
 await page.screenshot({path:`/tmp/water-${mode}-${name}.png`});await page.close();
}
await browser.close();
