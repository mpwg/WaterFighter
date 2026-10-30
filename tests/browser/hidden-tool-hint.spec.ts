import {expect,test} from '@playwright/test';

for(const viewport of [{width:320,height:480},{width:480,height:320}])test(`Werkzeughinweis bleibt ohne Menü sichtbar (${viewport.width}×${viewport.height})`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    await page.locator('[data-mode="dam"]').tap();await page.locator('#panel-toggle').tap();
    const hint=page.locator('#tool-hint');await expect(hint).toBeVisible();
    await expect(hint).toHaveText('Start und Ende auf der Karte antippen.');
    const box=(await hint.boundingBox())!,header=(await page.locator('.topbar').boundingBox())!,zoom=(await page.locator('#zoom-in').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(header.y+header.height);expect(box.x+box.width).toBeLessThanOrEqual(zoom.x);
    await page.touchscreen.tap(viewport.width/2,viewport.height*.47);
    await expect(hint).toHaveText('Endpunkt auf der Karte antippen.');
    await page.touchscreen.tap(viewport.width/2+30,viewport.height*.52);
    await expect(page.locator('#preview')).toBeVisible();await expect(hint).toBeHidden();
    await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').tap();
    await expect(page.locator('#preview')).toBeHidden();
    await expect(hint).toContainText('Maßnahme bestätigt.');
    await page.locator('#panel-toggle').tap();await expect(hint).toBeHidden();
    await page.locator('[data-mode="camera"]').tap();await page.locator('#panel-toggle').tap();
    await expect(hint).toBeHidden();
  } finally {await context.close();}
});

test('ungültige Gebäudeauswahl wird auch ohne Menü erklärt',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="demolish"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(1000,200);
  await expect(page.locator('#tool-hint')).toHaveText('Bitte ein Gebäude auswählen.');
  await expect(page.locator('#tool-hint')).toBeVisible();
  await expect(page.locator('#preview')).toBeHidden();
  await expect(page.locator('#budget')).toHaveText('10 000');
});

test('Bestätigung weicht einem Bedienhinweis',async({page})=>{
  test.setTimeout(30000);
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  const hint=page.locator('#tool-hint');await expect(hint).toContainText('Maßnahme bestätigt.');
  await expect(hint).toHaveText('Start und Ende auf der Karte antippen.',{timeout:7000});
});

test('Neue Auswahl verhindert den alten Bestätigungs-Timer',async({page})=>{
  test.setTimeout(30000);
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  const hint=page.locator('#tool-hint');await expect(hint).toContainText('Maßnahme bestätigt.');
  await page.mouse.click(800,360);await expect(hint).toHaveText('Endpunkt auf der Karte antippen.');
  await page.waitForTimeout(4500);await expect(hint).toHaveText('Endpunkt auf der Karte antippen.');
});
