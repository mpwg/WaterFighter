import {expect,test} from '@playwright/test';

test('Eine Gebäudeauswahl verwirft die darunter erscheinende Vorschau nicht',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="demolish"]').tap();await page.touchscreen.tap(480,140);
  await expect(page.locator('#preview')).toBeVisible();await expect(page.locator('#confirm')).toBeEnabled();
  await expect(page.locator('#preview-text')).toContainText('Gebäudeverlust');
  await page.locator('#cancel').tap();await expect(page.locator('#preview')).toBeHidden();
  await expect(page.locator('#budget')).toHaveText('10 000');await context.close();
});
