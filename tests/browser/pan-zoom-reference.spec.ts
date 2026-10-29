import {expect,test} from '@playwright/test';

test('Referenzgraben bleibt nach Verschieben und Zoomen zwischen den Punkten erreichbar',async({page})=>{
  test.setTimeout(90000);
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any){
        if(message?.type==='preview'&&message.action?.kind==='trench')(window as any).referenceCells=message.action.cells;
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(307.55,489.85);
  await page.mouse.move(600,500);await page.mouse.down();await page.mouse.move(1000,500,{steps:8});await page.mouse.up();
  await expect(page.locator('#message')).toHaveText('Karte verschoben. Endpunkt antippen.');
  for(let i=0;i<3;i++)await page.locator('#zoom-in').click();
  await page.mouse.click(352.12,538.57);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).referenceCells)).toEqual(Array.from({length:26},(_,i)=>800+i));
  await expect(page.locator('#preview-text')).toContainText('Kosten: 650');
  await expect(page.locator('#budget')).toHaveText('10 000');
  await page.locator('#confirm').click();await expect(page.locator('#budget')).toHaveText('9 350');
});
