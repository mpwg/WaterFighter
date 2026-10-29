import {expect,test} from '@playwright/test';

test('bestätigte Grabentrasse bleibt bei künstlich erhöhtem Wasser sichtbar',async({page})=>{
  test.setTimeout(90000);
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      constructor(url:string|URL,options?:WorkerOptions){
        super(url,options);(window as any).wfWorker=this;
        this.addEventListener('message',event=>{if(event.data?.type==='snapshot')(window as any).wfSnapshot=structuredClone(event.data);});
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);await expect(page.locator('#confirm')).toBeEnabled();
  await page.locator('#confirm').click();
  await page.waitForFunction(()=>(window as any).wfSnapshot?.trenches?.length>0);
  await page.evaluate(()=>{
    const snapshot=structuredClone((window as any).wfSnapshot),n=snapshot.buffer.byteLength/16;
    new Float32Array(snapshot.buffer,0,n).fill(4);
    (window as any).overlaySnapshot=structuredClone(snapshot);
    (window as any).wfWorker.dispatchEvent(new MessageEvent('message',{data:snapshot}));
  });
  await page.waitForTimeout(300);const withRoute=await page.locator('canvas').screenshot();
  await page.evaluate(()=>{
    const snapshot=structuredClone((window as any).overlaySnapshot);snapshot.trenches=[];snapshot.revision++;
    (window as any).wfWorker.dispatchEvent(new MessageEvent('message',{data:snapshot}));
  });
  await page.waitForTimeout(300);const withoutRoute=await page.locator('canvas').screenshot();
  const changed=await page.evaluate(async([a,b])=>{
    const pixels=async(src:string)=>{const img=await createImageBitmap(await (await fetch(src)).blob());const canvas=new OffscreenCanvas(img.width,img.height),ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);return ctx.getImageData(0,0,img.width,img.height).data;};
    const withLine=await pixels(a),without=await pixels(b);let count=0;
    for(let i=0;i<withLine.length;i+=4){
      const delta=Math.abs(withLine[i]-without[i])+Math.abs(withLine[i+1]-without[i+1])+Math.abs(withLine[i+2]-without[i+2]);
      if(delta>50&&withLine[i]<150&&withLine[i+1]<140&&withLine[i+2]<120&&withLine[i]>withLine[i+1]*1.1)count++;
    }
    return count;
  },[withRoute,withoutRoute].map(bytes=>`data:image/png;base64,${bytes.toString('base64')}`));
  expect(changed).toBeGreaterThan(0);
});
