import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';

test('Startpunkt erscheint auf der Karte und verschwindet beim Werkzeugwechsel',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  const clip={x:780,y:340,width:40,height:40};
  const before=await page.screenshot({clip});
  await page.mouse.click(800,360);await expect(page.locator('#message')).toContainText('Endpunkt');
  await page.waitForTimeout(150);
  const marked=await page.screenshot({clip});expect(marked.equals(before)).toBe(false);
  await page.locator('[data-mode="camera"]').click();await page.waitForTimeout(150);
  expect((await page.screenshot({clip})).equals(before)).toBe(true);
});

test('Startpunkt bleibt auch über einer überfluteten Karte sichtbar',async({page})=>{
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  scenario.initialDepth.fill(4);
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  const clip={x:780,y:340,width:40,height:40},before=await page.screenshot({clip});
  await page.mouse.click(800,360);await expect(page.locator('#message')).toContainText('Endpunkt');
  await page.waitForTimeout(150);expect((await page.screenshot({clip})).equals(before)).toBe(false);
});

test('Startpunkt folgt einem ansteigenden Worker-Wasserstand',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      constructor(url:string|URL,options?:WorkerOptions) {
        super(url,options);(window as any).wfWorker=this;
        this.addEventListener('message',event=>{if(event.data?.type==='snapshot')(window as any).wfSnapshot=structuredClone(event.data);});
      }
    };
  });
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));scenario.initialDepth.fill(0);
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.waitForFunction(()=>(window as any).wfSnapshot);await page.locator('[data-mode="trench"]').click();
  const clip={x:780,y:340,width:40,height:40},dryEmpty=await page.screenshot({clip});
  await page.mouse.click(800,360);await expect(page.locator('#message')).toContainText('Endpunkt');
  await page.waitForTimeout(150);const dryMarked=await page.screenshot({clip});
  await page.evaluate(()=>{
    const snapshot=structuredClone((window as any).wfSnapshot),n=snapshot.buffer.byteLength/16;
    new Float32Array(snapshot.buffer,0,n).fill(4);
    (window as any).wfWorker.dispatchEvent(new MessageEvent('message',{data:snapshot}));
  });
  await page.waitForTimeout(200);
  const marked=await page.screenshot({clip});
  await page.locator('[data-mode="camera"]').click();await page.waitForTimeout(150);
  const wetEmpty=await page.screenshot({clip});
  const centroid=async(empty:Buffer,withMarker:Buffer)=>page.evaluate(async([a,b])=>{
    const pixels=async(src:string)=>{const img=await createImageBitmap(await (await fetch(src)).blob());const c=new OffscreenCanvas(img.width,img.height),ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);return ctx.getImageData(0,0,img.width,img.height);};
    const x=await pixels(a),y=await pixels(b);let sum=0,weight=0;
    for(let i=0;i<x.data.length;i+=4){const delta=Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2]);if(delta>10){sum+=Math.floor(i/4/x.width)*delta;weight+=delta;}}
    if(!weight)throw Error('Markierung nicht sichtbar');return sum/weight;
  },[empty,withMarker].map(bytes=>`data:image/png;base64,${bytes.toString('base64')}`));
  expect(await centroid(wetEmpty,marked)).toBeLessThan((await centroid(dryEmpty,dryMarked))-0.5);
});
