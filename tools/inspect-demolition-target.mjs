/** Project one known building into a desktop view, then inspect its UI preview. */
import { chromium } from '@playwright/test';
const target=process.argv[2]??'w1207502028-0';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
try {
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    postMessage(message,options){if(message?.type==='preview'&&message.action?.kind==='demolish')window.__target=message.action.buildingId;return super.postMessage(message,options);}
  };});
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body+'\nexport {world};\n'});});
  await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');
  await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  await page.locator('[data-mode=demolish]').click();await page.locator('#panel-toggle').click();
  const screen=await page.evaluate(async target=>{
    const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
    if(world.scenario.version!=='1.6-draft')throw Error('Unerwartetes Szenario');
    const {Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
    const mesh=world.scene.getMeshByName(`building-${target}`);if(!mesh)throw Error('Gebäude fehlt');
    const bounds=mesh.getBoundingInfo().boundingBox,center=bounds.centerWorld.clone();center.y=bounds.maximumWorld.y;
    const point=Vector3.Project(center,Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
    const rect=world.canvas.getBoundingClientRect();return {x:rect.left+point.x*rect.width/world.engine.getRenderWidth(),y:rect.top+point.y*rect.height/world.engine.getRenderHeight()};
  },target);
  await page.mouse.click(screen.x,screen.y);
  await page.waitForFunction(target=>window.__target===target&&!document.querySelector('#preview').hidden,target);
  const preview=await page.locator('#preview-text').textContent();
  const expected=target==='w1207502028-0'?['Kosten: 7','Gebäudeverlust insgesamt: 66']:target==='w316294475-0'?['Kosten: 154','Gebäudeverlust insgesamt: 1 533']:['Kosten:','Gebäudeverlust insgesamt:'];
  if(!expected.every(part=>preview?.replace(/\s/g,' ').includes(part)))throw Error(`Unerwartete Vorschau: ${preview}`);
  await page.screenshot({path:'/tmp/wf-demolition-target.png'});
  console.log(JSON.stringify({browser:browser.version(),scenario:'1.6-draft',target,screen,preview}));
} finally {await browser.close();}
