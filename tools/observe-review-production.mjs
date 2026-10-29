/** Full reference round on the unmodified production build, using precomputed screen coordinates. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const points=JSON.parse(readFileSync('tests/fixtures/review-screen-points.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:points.viewport}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 const version=await page.evaluate(async()=>{const response=await fetch('./scenarios/brigittenau-v1.json');return (await response.json()).version;});
 if(version!==points.scenario)throw Error('Szenarioversion stimmt nicht');
 const previews=[];
 async function select(p){await page.mouse.click(p.x,p.y);}
 async function confirm(label){await page.locator('#confirm').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#confirm').disabled);previews.push({label,text:await page.locator('#preview-text').textContent()});await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden);}
 await page.locator('[data-mode="dam"]').click();
 for(const [i,segment] of points.dams.entries()){for(const p of segment)await select(p);await confirm(`Damm ${i+1}`);}
 await page.locator('[data-mode="demolish"]').click();await page.locator('#panel-toggle').click();await select(points.building);await confirm('Abriss');
 await page.locator('#panel-toggle').click();await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
 for(const p of points.trench)await select(p);await confirm('Graben');await page.locator('#panel-toggle').click();
 await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='6598');
 const previewCheck=previews.map(x=>x.text.replace(/\s/g,' '));
 if(!previewCheck[0].includes('Kosten: 400')||!previewCheck[1].includes('Kosten: 800')||!previewCheck[2].includes('Gebäudeverlust insgesamt: 16 017')||!previewCheck[3].includes('Kosten: 600'))throw Error(`Maßnahmen abweichend: ${JSON.stringify(previewCheck)}`);
 console.log('Referenzmaßnahmen bestätigt; Budgetrest 6.598.');
 await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
 if(process.argv.includes('--capture-flow')){
  await page.locator('#panel-toggle').click();
  for(const seconds of [120,180,240]){
   await page.waitForFunction(target=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=target;},seconds,{timeout:240000});
   await page.screenshot({path:`/tmp/waterfighter-reference-flow-${seconds}.png`});
  }
 }
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={browser:browser.version(),scenario:version,viewport:points.viewport,previews,wallSeconds:(Date.now()-start)/1000,title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),score:await page.locator('#damage-total').textContent(),breakdown:await page.locator('#damage-breakdown').textContent(),errors};
 await page.screenshot({path:'/tmp/waterfighter-reference-production.png'});
 if(report.title!=='Schadensziel erreicht'||errors.length)throw Error(`Prüfung fehlgeschlagen: ${JSON.stringify(report)}`);
 await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetScore=await page.locator('#damage-total').textContent();
 if(!report.resetScore.includes('Schaden 0 /'))throw Error('Schaden nach Neustart nicht zurückgesetzt');
 writeFileSync('/tmp/waterfighter-reference-production.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
