import { expect, test } from '@playwright/test';

test('eine überlappende Grabenverlängerung zeigt nur die Kosten neuer Zellen',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any){
        if(message?.type==='preview'&&message.action?.kind==='trench') (window as any).lastTrench=message.action.cells;
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();
  const first:number[]=await page.evaluate(()=>(window as any).lastTrench);
  await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  const before=Number((await page.locator('#budget').textContent())!.replace(/\s/g,''));
  await page.mouse.click(800,360);await page.mouse.click(875,395);
  await expect(page.locator('#confirm')).toBeEnabled();
  const second:number[]=await page.evaluate(()=>(window as any).lastTrench);
  const reused=second.filter(i=>first.includes(i)).length;
  expect(reused).toBeGreaterThan(0);expect(reused).toBeLessThan(second.length);
  await expect(page.locator('#preview-text')).toContainText(`${reused} ${reused===1?'Zelle ist':'Zellen sind'} bereits ausgehoben`);
  await expect(page.locator('#preview-text')).toContainText(`Kosten: ${(second.length-reused)*25}`);
  await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  await expect.poll(async()=>Number((await page.locator('#budget').textContent())!.replace(/\s/g,''))).toBe(before-(second.length-reused)*25);
});
