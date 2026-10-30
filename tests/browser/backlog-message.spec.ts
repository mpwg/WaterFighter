import {expect,test} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      constructor(...args:ConstructorParameters<typeof Worker>) {
        super(...args);
        this.addEventListener('message',event=>{
          if(event.data?.type==='snapshot' && typeof (window as any).testBacklog==='number')event.data.backlog=(window as any).testBacklog;
        });
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();await page.locator('#run').click();await page.locator('#panel-toggle').click();
});

test('Rückstandsmeldung verschwindet nach dem Aufholen und beim Pausieren',async({page})=>{
  const hint=page.locator('#tool-hint');
  await page.evaluate(()=>(window as any).testBacklog=3);
  await expect(hint).toHaveText('Simulation holt 3.0 s Rückstand auf.');
  await page.evaluate(()=>(window as any).testBacklog=0);
  await expect(hint).toHaveText('Start und Ende auf der Karte antippen.');
  await page.evaluate(()=>(window as any).testBacklog=3);
  await expect(hint).toHaveText('Simulation holt 3.0 s Rückstand auf.');
  await page.locator('#panel-toggle').click();await page.locator('#run').click();
  await expect(page.locator('#state')).toHaveText('Pausiert');
  await expect(page.locator('#message')).toHaveText('Start und Ende auf der Karte antippen.');
});

test('Neue Auswahl bleibt während und nach dem Aufholen sichtbar',async({page})=>{
  const hint=page.locator('#tool-hint');
  await page.evaluate(()=>(window as any).testBacklog=3);
  await expect(hint).toHaveText('Simulation holt 3.0 s Rückstand auf.');
  await page.mouse.click(800,360);
  await expect(hint).toHaveText('Endpunkt auf der Karte antippen.');
  await page.waitForTimeout(1000);await expect(hint).toHaveText('Endpunkt auf der Karte antippen.');
  await page.evaluate(()=>(window as any).testBacklog=0);
  await page.waitForTimeout(500);await expect(hint).toHaveText('Endpunkt auf der Karte antippen.');
});
