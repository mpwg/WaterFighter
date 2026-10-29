/** Record the shipped flood in the production UI, with the panel tucked away. */
import { chromium } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'node:fs';
const output=mkdtempSync('/tmp/waterfighter-live-flood-');
console.log(`Aufnahmen: ${output}`);
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[],frames=[];
let scenario=null,start=0;
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 scenario=await page.evaluate(async()=>{const response=await fetch('./scenarios/brigittenau-v1.json');return (await response.json()).version;});
 await page.locator('#speed').click();await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
 await page.locator('#panel-toggle').click();start=Date.now();
 for(let target=0;target<300;target+=15) {
  await page.waitForFunction(target=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=target;},target,{timeout:60000});
  const time=await page.locator('#time').textContent(),file=`${output}/${String(target).padStart(3,'0')}.png`;
  await page.locator('canvas').screenshot({path:file});frames.push({target,time,file});
 }
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:60000});
 await page.locator('canvas').screenshot({path:`${output}/300.png`});frames.push({target:300,time:await page.locator('#time').textContent(),file:`${output}/300.png`});
 const report={scenario,browser:browser.version(),wallSeconds:(Date.now()-start)/1000,result:await page.locator('#result-details').textContent(),frames,errors};
 writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));
 if(errors.length)throw Error(errors.join('; '));console.log(JSON.stringify(report,null,2));
} catch(error) {
 writeFileSync(`${output}/incomplete.json`,JSON.stringify({scenario,browser:browser.version(),wallSeconds:start?(Date.now()-start)/1000:null,frames,errors,error:String(error)},null,2));
 throw error;
} finally {await browser.close();}
