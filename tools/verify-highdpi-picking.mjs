/** Regression check with an explicitly doubled Babylon render resolution. */
import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined}),page=await browser.newPage({viewport:{width:1200,height:800},deviceScaleFactor:2});
await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { world };\n'});});
await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
await page.evaluate(async()=>{const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);world.engine.setHardwareScalingLevel(.5);world.engine.resize();});
await page.locator('[data-mode=dam]').click();
for(const [x,y] of [[120,100],[130,110]]) {
  const p=await page.evaluate(async ([x,y])=>{
    const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src),{Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
    const g=world.scenario.grid, z=world.scenario.bed[y*g.width+x], rect=world.canvas.getBoundingClientRect();
    const point=Vector3.Project(new Vector3(x*g.cellSize-g.width*g.cellSize/2,z,y*g.cellSize-g.height*g.cellSize/2),Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
    return {x:rect.left+point.x*rect.width/world.engine.getRenderWidth(),y:rect.top+point.y*rect.height/world.engine.getRenderHeight()};
  },[x,y]);await page.mouse.click(p.x,p.y);
}
await page.waitForFunction(()=>!document.querySelector('#confirm').disabled);
const preview=await page.locator('#preview-text').textContent();console.log(preview);if(!preview.includes('800'))throw new Error('Unerwartete ausgewählte Dammgeometrie');
await browser.close();
