import {expect,test} from '@playwright/test';

test('ein neuer Kartentipp verwirft die alte Vorschau vor der nächsten Auswahl',async({page})=>{
  await page.setViewportSize({width:1200,height:800});
  await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);
  await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();
  await expect(page.locator('#budget')).toHaveText('10 000');
  await page.mouse.click(800,360);
  await expect(page.locator('#preview')).toBeHidden();
  await expect(page.locator('#message')).toHaveText('Endpunkt auf der Karte antippen.');
  await expect(page.locator('#budget')).toHaveText('10 000');
  await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();
  await page.locator('#confirm').click();
  await expect(page.locator('#budget')).not.toHaveText('10 000');
});
