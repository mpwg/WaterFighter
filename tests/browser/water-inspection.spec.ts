import {expect,test} from '@playwright/test';

test('Wasserspiegel ist auch bei ausgeblendetem Werkzeugmenü ablesbar',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1200,height:800},hasTouch:true});
 try {
  const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#panel-toggle').click();await expect(page.locator('#game-panel')).toBeHidden();
  await page.mouse.click(800,400);
  await expect(page.locator('#inspection')).toContainText('Stand 00:00: Wassertiefe: 2.00 m · Wasserspiegel: 2.00 m über Wiener Null.');
  await expect(page.locator('#inspection')).toBeVisible();
  await page.locator('#panel-toggle').click();await expect(page.locator('#inspection')).toBeHidden();
  await expect(page.locator('#message')).toContainText('Wasserspiegel: 2.00 m');
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  await expect(page.locator('#inspection')).toBeHidden();
 } finally {await context.close();}
});

test('Kartenabfrage verdeckt im kleinen Hochformat weder Kopfzeile noch Zoom',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:480},isMobile:true,hasTouch:true});
 try {
  const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#panel-toggle').tap();await page.touchscreen.tap(250,215);
  await expect(page.locator('#inspection')).toBeVisible();
  const box=(await page.locator('#inspection').boundingBox())!,header=(await page.locator('.topbar').boundingBox())!,zoom=(await page.locator('#zoom-in').boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(header.y+header.height);
  expect(box.x+box.width).toBeLessThanOrEqual(zoom.x);
  await page.locator('#zoom-in').tap();
 } finally {await context.close();}
});
