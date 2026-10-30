/** Observe live building material changes without placing any actions. */
import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {constructor(...args){super(...args);this.addEventListener('message',e=>{if(e.data?.type==='snapshot')window.__wfBuildingSnapshot={revision:e.data.revision,time:e.data.time,buildings:e.data.buildings};});}};});
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport {world};\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled&&window.__wfBuildingSnapshot);
 const scenario=await page.evaluate(async()=>{const response=await fetch('./scenarios/brigittenau-v1.json.bin');if(!response.ok||!response.body)throw Error('Szenario fehlt');return (await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json()).version;});
 if(scenario!=='1.6-draft')throw Error(`Unerwartetes Szenario: ${scenario}`);
 const take=()=>page.evaluate(async()=>{
   const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
   const target=world.currentBuildings.get('r9350494-0'),mesh=world.scene.getMeshByName('building-r9350494-0');
   if(!target||!mesh)throw Error('Referenzgebäude fehlt');
   return {revision:window.__wfBuildingSnapshot.revision,time:window.__wfBuildingSnapshot.time,damage:target.damage,value:target.value,exposure:target.exposure,material:mesh.material.name};
 });
 const initial=await take();if(initial.material!=='buildings'||initial.damage!==0)throw Error(`Unerwarteter Anfang: ${JSON.stringify(initial)}`);
 await page.locator('#speed').click();await page.locator('#run').click();
 await page.waitForFunction(()=>{const b=window.__wfBuildingSnapshot?.buildings.find(b=>b.id==='r9350494-0');return b&&b.damage>=b.value*0.05;},null,{timeout:180000});
 const damaged=await take();if(damaged.revision!==initial.revision||damaged.material!=='buildings-damaged'||damaged.damage<damaged.value*0.05)throw Error(`Zustand nicht aktualisiert: ${JSON.stringify({initial,damaged})}`);
 if(errors.length)throw Error(errors.join('; '));
 console.log(JSON.stringify({browser:browser.version(),scenario,initial,damaged,errors},null,2));
} finally {await browser.close();}
