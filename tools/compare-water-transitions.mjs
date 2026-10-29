/** Compare dynamic water updates using baseline :5174 and current :5173 Vite servers. */
import {chromium} from 'playwright';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const modes=['dry','wet','mixed','dry','wet'],shots={};
try {
 for(const [port,label] of [[5174,'baseline'],[5173,'current']]){
  const page=await browser.newPage({viewport:{width:1200,height:800}});
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body+'\nexport { world };\n'});});
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!document.querySelector('#run').disabled);await page.waitForTimeout(1000);
  shots[label]=[];
  for(const mode of modes){
   await page.evaluate(async mode=>{
    const mainUrl=document.querySelector('script[src*="/src/main.ts"]').src,{world}=await import(mainUrl);
    const {width,height}=world.scenario.grid;
    const depth=Float32Array.from({length:width*height},(_,i)=>mode==='dry'?0:mode==='wet'?1:((Math.floor(i/width/8)+Math.floor(i%width/8))%2?0:1));
    world.updateWater(depth);
    await new Promise(resolve=>world.scene.onAfterRenderObservable.addOnce(resolve));
   },mode);
   const png=await page.screenshot();shots[label].push(createHash('sha256').update(png).digest('hex'));
  }
  await page.close();
 }
 const matches=modes.map((mode,i)=>({mode,match:shots.baseline[i]===shots.current[i],baseline:shots.baseline[i],current:shots.current[i]}));
 console.log(JSON.stringify({browser:browser.version(),matches},null,2));
 if(matches.some(x=>!x.match))throw Error('Screenshots unterscheiden sich');
} finally {await browser.close();}
