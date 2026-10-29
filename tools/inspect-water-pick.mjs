/** Compare screen-ray intersections with water and terrain on a saved solver snapshot. */
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const {scenario,snapshots}=JSON.parse(readFileSync('/tmp/waterfighter-backwater-states.json','utf8'));
const state=snapshots.find(s=>s.name==='shield'&&s.time===120);if(!state)throw Error('Snapshot fehlt');
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}});
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world, worker };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 const result=await page.evaluate(async state=>{
  const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src),{Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
  worker.terminate();world.updateState(Float32Array.from(state.bed),state.buildings,state.dams,1,[]);world.updateWater(Float32Array.from(state.depth),Float32Array.from(state.qx),Float32Array.from(state.qy));
  await new Promise(r=>world.scene.onAfterRenderObservable.addOnce(r));
  const w=world.scenario.grid.width,c=world.scenario.grid.cellSize,v=world.water.getVerticesData('position'),rect=world.canvas.getBoundingClientRect();
  return [[26,1],[50,20],[100,60]].map(([x,y])=>{
   const a=(y*(w+1)+x)*3,b=a+3,d=a+(w+1)*3,height=v[a+1]*.5+v[b+1]*.25+v[d+1]*.25;
   const p=Vector3.Project(new Vector3((x+.25)*c-w*c/2,height,(y+.25)*c-world.scenario.grid.height*c/2),Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
   const sx=p.x*rect.width/world.engine.getRenderWidth(),sy=p.y*rect.height/world.engine.getRenderHeight();
   const water=world.scene.pick(sx,sy,m=>m===world.water),land=world.scene.pick(sx,sy,m=>m===world.land);
   const coords=hit=>hit?.hit?{x:hit.pickedPoint.x+w*c/2,y:hit.pickedPoint.z+world.scenario.grid.height*c/2}:null;
   return {target:[x,y],screen:[sx,sy],water:coords(water),land:coords(land),selection:world.pick(sx,sy)};
  });
 },state);
 for(const row of result)if(!row.water||!row.selection||Math.hypot(row.water.x-row.selection.x,row.water.y-row.selection.y)>0.01)throw Error(`Abfrage trifft Wasseroberfläche nicht: ${JSON.stringify(row)}`);
 console.log(JSON.stringify({scenario,browser:browser.version(),time:state.time,result},null,2));
} finally {await browser.close();}
