/** Automated production round: prepare dams, pause during flood, demolish and dig. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const points=JSON.parse(readFileSync('tests/fixtures/review-screen-points.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:points.viewport}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:30000});
 const scenario=await page.evaluate(async()=>{const r=await fetch('./scenarios/brigittenau-v1.json.bin');if(!r.ok||!r.body)throw Error('Szenario fehlt');return (await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 if(scenario!==points.scenario)throw Error('Szenarioversion stimmt nicht');
 const actions=[];
 async function confirm(name){
  await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:15000});
  const preview=await page.locator('#preview-text').textContent(),time=await page.locator('#time').textContent();
  await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:15000});
  actions.push({name,time,preview,budget:await page.locator('#budget').textContent()});
 }
 await page.locator('[data-mode="dam"]').click();
 for(const [i,segment] of points.dams.entries()){for(const p of segment)await page.mouse.click(p.x,p.y);await confirm(`Damm ${i+1}`);}
 await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
 await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=120;},null,{timeout:180000});
 await page.getByRole('button',{name:'Pause'}).click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert',null,{timeout:15000});
 const pausedAt=await page.locator('#time').textContent();
 await page.locator('[data-mode="demolish"]').click();await page.locator('#panel-toggle').click();
 await page.mouse.click(points.building.x,points.building.y);await confirm('Abriss');
 await page.locator('#panel-toggle').click();await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
 for(const p of points.trench)await page.mouse.click(p.x,p.y);await confirm('Graben');
 const normalized=actions.map(a=>a.preview?.replace(/\s/g,' '));
 if(!normalized[0]?.includes('Kosten: 400')||!normalized[1]?.includes('Kosten: 800')||!normalized[2]?.includes('Gebäudeverlust insgesamt: 16 017')||!normalized[3]?.includes('Kosten: 600'))throw Error(`Abweichende Maßnahmen: ${JSON.stringify(actions)}`);
 if(await page.locator('#time').textContent()!==pausedAt)throw Error('Zeit lief während der Pause weiter');
 await page.locator('#panel-toggle').click();
 await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='6598');
 await page.getByRole('button',{name:'Fortsetzen'}).click();
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={scenario,browser:browser.version(),viewport:points.viewport,pausedAt,actions,wallSeconds:(Date.now()-start)/1000,title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),errors};
 if(report.title!=='Schadensziel erreicht'||errors.length)throw Error(JSON.stringify(report));
 await page.locator('#again').click();await page.waitForFunction(()=>document.querySelector('#result').hidden&&document.querySelector('#time').textContent==='00:00'&&document.querySelector('#budget').textContent.replace(/\s/g,'')==='10000');
 report.resetScore=await page.locator('#damage-total').textContent();
 if(!report.resetScore.includes('Schaden 0 /'))throw Error('Schaden nach Neustart nicht zurückgesetzt');
 writeFileSync('/tmp/waterfighter-staged-production.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
