/** Compare lookup strategies in the actual scene, not rendering or end-to-end frame time. */
import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}});
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world, worker };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 const result=await page.evaluate(async()=>{
  const {world,worker}=await import(document.querySelector('script[src*="/src/main.ts"]').src);worker.terminate();
  const ids=world.scenario.buildings.map(b=>b.id),measurements={linear:[],indexed:[]};
  for(const id of ids)if(world.scene.getMeshByName(`building-${id}`)!==world.buildingMeshes.get(id))throw Error(`Mesh stimmt nicht: ${id}`);
  function measure(indexed){const start=performance.now();let found=0;for(let repeat=0;repeat<500;repeat++)for(const id of ids)if(indexed?world.buildingMeshes.get(id):world.scene.getMeshByName(`building-${id}`))found++;if(found!==ids.length*500)throw Error('Gebäude fehlt');return (performance.now()-start)/500;}
  for(let i=0;i<4;i++){measure(false);measure(true);}
  for(let i=0;i<20;i++)for(const indexed of i%2?[true,false]:[false,true])measurements[indexed?'indexed':'linear'].push(measure(indexed));
  const summary=values=>{values.sort((a,b)=>a-b);return {medianMs:values[10],p95Ms:values[18],minMs:values[0],maxMs:values[19]};};
  return {buildings:ids.length,meshes:world.scene.meshes.length,iterationsPerBlock:500,blocks:20,linear:summary(measurements.linear),indexed:summary(measurements.indexed)};
 });
 console.log(JSON.stringify({browser:browser.version(),result},null,2));
} finally {await browser.close();}
