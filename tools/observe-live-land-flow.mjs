/** Live worker round with a test-only camera focus on a confirmed land trench. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const motionCheck=process.argv.includes('--motion-check');
const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
if(scenario.version!=='1.4-draft')throw Error('Szenarioversion stimmt nicht');
const segments=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8')).segments.slice(0,3);
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 async function point(x,y,cell=false){return page.evaluate(async ({x,y,cell})=>{
  const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src),{Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
  const g=world.scenario.grid,c=g.cellSize,px=cell?(x+.5)*c:x*c,py=cell?(y+.5)*c:Math.max(.05,y*c),ix=Math.min(g.width-1,Math.floor(px/c)),iy=Math.min(g.height-1,Math.floor(py/c));
  const p=Vector3.Project(new Vector3(px-g.width*c/2,world.scenario.bed[iy*g.width+ix],py-g.height*c/2),Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
  const rect=world.canvas.getBoundingClientRect();return {x:rect.left+p.x*rect.width/world.engine.getRenderWidth(),y:rect.top+p.y*rect.height/world.engine.getRenderHeight()};
 },{x,y,cell});}
 async function confirm(label){await page.locator('#confirm').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#confirm').disabled);const text=await page.locator('#preview-text').textContent();await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden);console.log(label,text);}
 await page.locator('[data-mode=dam]').click();
 for(const [i,segment] of segments.entries()){for(const [x,y] of segment){const p=await point(x,y);await page.mouse.click(p.x,p.y);}await confirm(`Damm ${i+1}`);}
 await page.locator('[data-mode=trench]').click();await page.locator('#panel-toggle').click();
 for(const [x,y] of [[0,4],[25,4]]){const p=await point(x,y,true);await page.mouse.click(p.x,p.y);}await confirm('Graben');
 await page.locator('#panel-toggle').click();await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='7510');
 await page.evaluate(async()=>{const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);world.zoom=180;world.camera.target.set(-348,0,-380);world.resize();});
 await page.locator('#panel-toggle').click();await page.locator('#panel-toggle').waitFor({state:'visible'});
 // Use the visible panel to start before hiding it again; camera focus is diagnostic only.
 await page.locator('#panel-toggle').click();await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();await page.locator('#panel-toggle').click();
 const samples=[];let motion=null;
 for(const target of [120,180,240]){
  await page.waitForFunction(target=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=target;},target,{timeout:240000});
  const sample=await page.evaluate(async()=>{const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src),regular=Math.ceil(world.width/12)*Math.ceil(world.height/12);const values=world.flowSamples.slice(regular);return {time:document.querySelector('#time').textContent,count:values.length,moving:values.filter(v=>Math.hypot(v.vx,v.vy)>=0.01).length,maxSpeed:Math.max(0,...values.map(v=>Math.hypot(v.vx,v.vy)))};});
  await page.screenshot({path:`/tmp/waterfighter-live-land-${target}.png`});samples.push(sample);console.log('Messpunkt',JSON.stringify(sample));
  if(motionCheck&&target===180){
   const positions=()=>page.evaluate(async()=>{
    const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
    await new Promise(resolve=>world.scene.onAfterRenderObservable.addOnce(resolve));
    const regular=Math.ceil(world.width/12)*Math.ceil(world.height/12),count=world.flowSamples.length-regular;
    return Array.from({length:count},(_,i)=>{const o=(regular+i)*18;return [world.flowPositions[o],world.flowPositions[o+2]];});
   });
   const difference=(a,b)=>Math.max(...a.map((p,i)=>Math.hypot(p[0]-b[i][0],p[1]-b[i][1])));
   const runningA=await positions();await page.waitForTimeout(700);const runningB=await positions();
   const runningDelta=difference(runningA,runningB);
   await page.locator('#panel-toggle').click();await page.getByRole('button',{name:'Pause'}).click();
   await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert');
   const pausedAt=await page.locator('#time').textContent();await page.waitForTimeout(500);
   const pausedA=await positions();await page.waitForTimeout(700);const pausedB=await positions();
   const pausedDelta=difference(pausedA,pausedB);
   if(runningDelta<0.01||pausedDelta!==0||await page.locator('#time').textContent()!==pausedAt)throw Error(`Markerprüfung fehlgeschlagen: ${runningDelta}, ${pausedDelta}`);
   motion={markers:runningA.length,runningDelta,pausedDelta,pausedAt};console.log('Markerprüfung',JSON.stringify(motion));
   await page.getByRole('button',{name:'Fortsetzen'}).click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');await page.locator('#panel-toggle').click();
  }
 }
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={scenario:scenario.version,browser:browser.version(),wallSeconds:(Date.now()-start)/1000,budget:await page.locator('#budget').textContent(),title:await page.locator('#result-title').textContent(),result:await page.locator('#result-details').textContent(),samples,motion,errors};
 writeFileSync(motionCheck?'/tmp/waterfighter-live-land-motion.json':'/tmp/waterfighter-live-land.json',JSON.stringify(report,null,2));if(errors.length||samples.some(s=>!s.count)||report.title!=='Schadensziel erreicht')throw Error(`Prüfung unvollständig: ${JSON.stringify(report)}`);console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
