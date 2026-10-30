import {expect,test} from '@playwright/test';

test('Bürogebäude ist für die Abrissvorschau über die Karte auswählbar',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any){
        if(message?.type==='preview'&&message.action?.kind==='demolish')(window as any).demolitionAction=message.action;
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="demolish"]').click();
  await page.locator('#panel-toggle').click();
  await page.mouse.click(326.493,470.721);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).demolitionAction)).toEqual({kind:'demolish',buildingId:'w33581744-0'});
  await expect(page.locator('#preview-text')).toContainText(/Gebäudeverlust insgesamt: 16\s?017/);
  await expect(page.locator('#preview-text')).toContainText('Kosten: 1602');
  await expect(page.locator('#budget')).toHaveText('10 000');
});
