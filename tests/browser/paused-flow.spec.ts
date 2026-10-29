import {expect,test} from '@playwright/test';

test('Strömungsdarstellung bleibt bei pausierter Flut stehen',async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('#speed').click();await page.locator('#run').click();
  await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time')!.textContent!.split(':').map(Number);return m*60+s>=20;});
  await page.getByRole('button',{name:'Pause'}).click();await expect(page.locator('#state')).toHaveText('Pausiert');
  await page.waitForTimeout(500);const first=await page.locator('canvas').screenshot();
  await page.waitForTimeout(1000);const second=await page.locator('canvas').screenshot();
  expect(second.equals(first)).toBe(true);
});
