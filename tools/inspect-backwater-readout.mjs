/** Inspect two wet cells next to a dam using a saved solver snapshot and the ordinary map UI. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const {scenario,snapshots}=JSON.parse(readFileSync('/tmp/waterfighter-backwater-states.json','utf8'));
const state=snapshots.find(s=>s.name==='shield'&&s.time===150);if(!state)throw Error('Snapshot fehlt');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}});
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world, worker };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.evaluate(async state=>{
  const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
  worker.terminate();world.zoom=240;world.camera.target.set(-296,0,-390);world.resize();
  world.updateState(Float32Array.from(state.bed),state.buildings,state.dams,1,[]);world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));
  await new Promise(r=>world.scene.onAfterRenderObservable.addOnce(r));
 },state);
 await page.locator('#panel-toggle').click();
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
  for(const [sx,sy] of candidates){await page.mouse.click(sx,sy);const text=await page.locator('#inspection').textContent();if(text?.includes(expected)){found={cell:[x,y],screen:[sx,sy],depth:state.depth[i],level,text};break;}}
  if(!found)throw Error(`Kartenabfrage für ${x},${y} nicht getroffen; erwartet ${expected}`);
  results.push(found);
 }
 console.log(JSON.stringify({scenario,browser:browser.version(),time:state.time,results},null,2));
} finally {await browser.close();}
