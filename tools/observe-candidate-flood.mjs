/** Capture a full candidate flood at fixed displayed simulation times. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
if(scenario.version!=='1.2-draft')throw Error('Kandidatenvergleich benötigt den historischen Szenarioentwurf 1.2');
scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*0.75]);
scenario.parameters.inflowCells=Array.from({length:scenario.grid.width},(_,x)=>x).filter(x=>x<150&&scenario.waterMask[x]===1);
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.route('**/scenarios/brigittenau-v1.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(scenario)}));
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.screenshot({path:'/tmp/waterfighter-candidate-000.png'});
 await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
 for(const target of [60,120,180,240]) {
  await page.waitForFunction(target=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=target;},target,{timeout:180000});
  await page.screenshot({path:`/tmp/waterfighter-candidate-${String(target).padStart(3,'0')}.png`});
 }
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:180000});
 await page.screenshot({path:'/tmp/waterfighter-candidate-300.png'});
 const report={browser:browser.version(),scenario:scenario.version,candidate:true,wallSeconds:(Date.now()-start)/1000,result:await page.locator('#result-details').textContent(),errors};
 writeFileSync('/tmp/waterfighter-candidate-flood.json',JSON.stringify(report,null,2));
 if(errors.length)throw Error(errors.join('; '));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
