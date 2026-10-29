/** Count visual water topology rebuilds during a short 1× diagnostic window. */
import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body+'\nexport { world };\n'});});
 await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.evaluate(async()=>{const url=document.querySelector('script[src*="/src/main.ts"]').src,{world}=await import(url);const mesh=world.water,old=mesh.setIndices.bind(mesh);window.topologyCounts=[];mesh.setIndices=(indices,...args)=>{window.topologyCounts.push(indices.length);return old(indices,...args);};});
 await page.locator('#run').click();await page.waitForTimeout(15000);
 const result=await page.evaluate(()=>({time:document.querySelector('#time').textContent,rebuilds:window.topologyCounts.length,indices:window.topologyCounts,scenario:document.querySelector('#state').textContent}));
 if(errors.length)throw Error(errors.join('; '));console.log(JSON.stringify({browser:browser.version(),seconds:15,...result,errors},null,2));
} finally {await browser.close();}
