/** Exercises map picking, previews, confirmation and a full 2× round in Vite dev mode.
 * A test-only exported reference permits projecting the fixture's known grid vertices
 * to mouse coordinates; actions still go through the public UI and worker protocol. */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const segments=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8')).segments;
const candidate=process.argv.includes('--candidate');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();const body=await response.text();await route.fulfill({response,body:body+'\nexport { world };\n'});});
if(candidate){
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  if(scenario.version!=='1.2-draft')throw Error('Kandidatenvergleich benötigt den historischen Szenarioentwurf 1.2');
  scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*0.75]);
  scenario.parameters.inflowCells=Array.from({length:scenario.grid.width},(_,x)=>x).filter(x=>x<150&&scenario.waterMask[x]===1);
  await page.route('**/scenarios/brigittenau-v1.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(scenario)}));
}
await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
await page.locator('[data-mode=dam]').click();
for(const [number,[start,end]] of segments.entries()) {
  for(const vertex of [start,end]) {
    const screen=await page.evaluate(async ([x,y])=>{
      const mainUrl=document.querySelector('script[src*="/src/main.ts"]').src;
      const {world}=await import(mainUrl);
      const {Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
      const g=world.scenario.grid, xx=Math.min(g.width-1,x), yy=Math.min(g.height-1,y);
      const z=world.scenario.bed[yy*g.width+xx];
      // Keep the first vertex just inside the raster so the pick hits a triangle.
      const wx=x*g.cellSize-g.width*g.cellSize/2, wz=Math.max(.05,y*g.cellSize)-g.height*g.cellSize/2;
      const p=Vector3.Project(new Vector3(wx,z,wz),Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
      const rect=world.canvas.getBoundingClientRect();return {x:rect.left+p.x*rect.width/world.engine.getRenderWidth(),y:rect.top+p.y*rect.height/world.engine.getRenderHeight()};
    },vertex);
    await page.mouse.click(screen.x,screen.y);
  }
  await page.locator('#confirm').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:15000});
  const preview=await page.locator('#preview-text').textContent();
  await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:15000});
  console.log('Abschnitt',number+1,preview,'Budget',await page.locator('#budget').textContent());
}
const budget=await page.locator('#budget').textContent();
if(budget.replace(/\s/g,'')!=='2600')throw new Error(`Strategie wurde ungenau platziert: Budget ${budget}`);
await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
const report={browser:browser.version(),candidate,budget,title:await page.locator('#result-title').textContent(),details:await page.locator('#result-details').textContent(),wallSeconds:(Date.now()-start)/1000,errors};
if(report.title!=='Schadensziel erreicht' || errors.length)throw new Error(`Strategie fehlgeschlagen: ${JSON.stringify(report)}`);
await page.screenshot({path:'/tmp/waterfighter-strategy-browser.png'});writeFileSync('/tmp/waterfighter-strategy-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
await browser.close();
