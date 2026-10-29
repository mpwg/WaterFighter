import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';

test('Dammvorschau weist auf durch Gebäude bereits gesperrte Kanten hin',async({page})=>{
 await page.setViewportSize({width:1200,height:800});
 await page.addInitScript(()=>{
  const Original=window.Worker;
  window.Worker=class extends Original {
   override postMessage(message:any,options?:any){
    if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damFaces=message.action.faces;
    return super.postMessage(message,options);
   }
  };
 });
 const select=async()=>{await page.locator('[data-mode="dam"]').click();await page.mouse.click(800,360);await page.mouse.click(850,385);await expect(page.locator('#confirm')).toBeEnabled();};
 await page.goto('/');await expect(page.locator('#run')).toBeEnabled();await select();
 const faces:{axis:'x'|'y';index:number}[]=await page.evaluate(()=>(window as any).damFaces);
 expect(faces.length).toBeGreaterThan(0);
 const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
 const w:number=scenario.grid.width,c:number=scenario.grid.cellSize,face=faces[Math.floor(faces.length/2)];
 const x=face.axis==='x'?face.index%(w+1):face.index%w,y=face.axis==='x'?Math.floor(face.index/(w+1)):Math.floor(face.index/w);
 const x0=x*c,y0=y*c;
 scenario.buildings.push({id:'test-blocked-face',area:c*c,height:8,heightEstimated:true,polygon:{outer:[[x0,y0],[x0+c,y0],[x0+c,y0+c],[x0,y0+c],[x0,y0]],holes:[]}});
 await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
 await page.reload();await expect(page.locator('#run')).toBeEnabled();await select();
 await expect(page.locator('#preview-text')).toContainText(/Dammkanten? (ist|sind) durch Gebäude bereits gesperrt/);
 await expect(page.locator('#budget')).toHaveText('10 000');
 await page.locator('#cancel').click();await expect(page.locator('#preview')).toBeHidden();await expect(page.locator('#budget')).toHaveText('10 000');
});

for(const viewport of [{width:320,height:480},{width:480,height:320}])test(`Dammhinweis bleibt bei ${viewport.width}×${viewport.height} bedienbar`,async({browser})=>{
 const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
 try {
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damFaces=message.action.faces;return super.postMessage(message,options);}};});
  const select=async()=>{await page.locator('[data-mode="dam"]').tap();await page.locator('#panel-toggle').tap();await page.touchscreen.tap(viewport.width/2,viewport.height*.47);await page.touchscreen.tap(viewport.width/2+30,viewport.height*.52);await expect(page.locator('#confirm')).toBeEnabled();};
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();await select();
  const faces:{axis:'x'|'y';index:number}[]=await page.evaluate(()=>(window as any).damFaces);
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  const w:number=scenario.grid.width,c:number=scenario.grid.cellSize,face=faces[Math.floor(faces.length/2)];
  const x=face.axis==='x'?face.index%(w+1):face.index%w,y=face.axis==='x'?Math.floor(face.index/(w+1)):Math.floor(face.index/w),x0=x*c,y0=y*c;
  scenario.buildings.push({id:'test-blocked-face',area:c*c,height:8,heightEstimated:true,polygon:{outer:[[x0,y0],[x0+c,y0],[x0+c,y0+c],[x0,y0+c],[x0,y0]],holes:[]}});
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
  await page.reload();await expect(page.locator('#run')).toBeEnabled();await select();
  await expect(page.locator('#preview-text')).toContainText(/Dammkanten? (ist|sind) durch Gebäude bereits gesperrt/);
  for(const selector of ['#confirm','#cancel']){
   const box=(await page.locator(selector).boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
   expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
   expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box.x+box.width/2,y:box.y+box.height/2})).toBe(selector.slice(1));
  }
  await page.locator('#cancel').tap();await expect(page.locator('#budget')).toHaveText('10 000');
 } finally {await context.close();}
});
