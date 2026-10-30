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

test('Rückstand im Kartenmodus verdeckt eine Abfrage nur vorübergehend',async({page})=>{
  await page.locator('#panel-toggle').click();await page.locator('[data-mode="camera"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(800,400);
  const inspection=page.locator('#inspection'),hint=page.locator('#tool-hint');
  await expect(inspection).toBeVisible();const previous=await inspection.textContent();
  await page.evaluate(()=>(window as any).testBacklog=3);
  await expect(hint).toBeVisible();await expect(hint).toHaveText('Simulation holt 3.0 s Rückstand auf.');
  await expect(inspection).toBeHidden();
  await page.evaluate(()=>(window as any).testBacklog=0);
  await expect(hint).toBeHidden();await expect(inspection).toBeVisible();await expect(inspection).toHaveText(previous!);
  await page.evaluate(()=>(window as any).testBacklog=3);
  await expect(hint).toBeVisible();
  await page.mouse.click(850,400);
  await expect(hint).toBeHidden();await expect(inspection).toBeVisible();
  await page.waitForTimeout(1000);await expect(hint).toBeHidden();await expect(inspection).toBeVisible();
});

for(const viewport of [{width:320,height:480},{width:480,height:320}])test(`Rückstand bleibt im Kartenmodus bei ${viewport.width}×${viewport.height} sichtbar`,async({page})=>{
  await page.locator('#panel-toggle').click();await page.locator('[data-mode="camera"]').click();await page.locator('#panel-toggle').click();
  await page.setViewportSize(viewport);await page.evaluate(()=>(window as any).testBacklog=3);
  const hint=page.locator('#tool-hint');await expect(hint).toBeVisible();
  const box=(await hint.boundingBox())!,header=(await page.locator('.topbar').boundingBox())!,zoom=(await page.locator('#zoom-in').boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(header.y+header.height);expect(box.x+box.width).toBeLessThanOrEqual(zoom.x);
});
