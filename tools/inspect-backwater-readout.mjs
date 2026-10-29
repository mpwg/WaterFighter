/** Inspect two wet cells next to a dam using a saved solver snapshot and the ordinary map UI. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const {scenario,snapshots}=JSON.parse(readFileSync('/tmp/waterfighter-backwater-states.json','utf8'));
const state=snapshots.find(s=>s.name==='shield'&&s.time===150);if(!state)throw Error('Snapshot fehlt');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const mobile=process.argv.includes('--mobile');
const page=await browser.newPage({viewport:mobile?{width:320,height:480}:{width:1200,height:800},hasTouch:mobile,isMobile:mobile});
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world, worker };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.evaluate(async state=>{
  const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
  worker.terminate();world.zoom=240;world.camera.target.set(-296,0,-390);world.resize();
  world.updateState(Float32Array.from(state.bed),state.buildings,state.dams,1,[]);world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));
  await new Promise(r=>world.scene.onAfterRenderObservable.addOnce(r));
 },state);
 if(mobile)await page.locator('#panel-toggle').tap();else await page.locator('#panel-toggle').click();
 if(process.argv.includes('--close'))for(let i=0;i<12;i++){if(mobile)await page.locator('#zoom-in').tap();else await page.locator('#zoom-in').click();}
 const width=await page.evaluate(async()=>{const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);return world.scenario.grid.width;});
 const results=[];
 for(const [x,y] of [[25,2],[26,2]]){
  const candidates=await page.evaluate(async ({x,y})=>{
   const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src),{Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
   const w=world.scenario.grid.width,h=world.scenario.grid.height,c=world.scenario.grid.cellSize,v=world.water.getVerticesData('position'),rect=world.canvas.getBoundingClientRect(),a=(y*(w+1)+x)*3,b=a+3,d=a+(w+1)*3;
   return [[.2,.2],[.3,.2],[.2,.3],[.4,.2],[.2,.4]].map(([dx,dy])=>{
    const height=v[a+1]*(1-dx-dy)+v[b+1]*dx+v[d+1]*dy;
    const p=Vector3.Project(new Vector3((x+dx)*c-w*c/2,height,(y+dy)*c-h*c/2),Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
    return [p.x*rect.width/world.engine.getRenderWidth(),p.y*rect.height/world.engine.getRenderHeight()];
   });
  },{x,y});
  const i=y*width+x,level=state.bed[i]+state.depth[i],expected=`Wasserspiegel: ${level.toFixed(2)} m`;
  let found;
  for(const [sx,sy] of candidates){if(mobile)await page.touchscreen.tap(sx,sy);else await page.mouse.click(sx,sy);const text=await page.locator('#inspection').textContent();if(text?.includes(expected)){found={cell:[x,y],screen:[sx,sy],depth:state.depth[i],level,text};break;}}
  if(!found)throw Error(`Kartenabfrage für ${x},${y} nicht getroffen; erwartet ${expected}`);
  results.push(found);
 }
 if(process.env.WATERFIGHTER_SCREENSHOT)await page.screenshot({path:process.env.WATERFIGHTER_SCREENSHOT});
 const separation=Math.hypot(results[0].screen[0]-results[1].screen[0],results[0].screen[1]-results[1].screen[1]);
 if(process.argv.includes('--close')&&separation<(mobile?10:20))throw Error(`Dammseiten trotz Vergrößerung nur ${separation.toFixed(2)} CSS-Pixel auseinander`);
 console.log(JSON.stringify({scenario,browser:browser.version(),time:state.time,close:process.argv.includes('--close'),mobile,separation,results},null,2));
} finally {await browser.close();}
