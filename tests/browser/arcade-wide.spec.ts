import {expect,test} from '@playwright/test';

test('breite Dämme und Gräben lassen sich grob zeichnen und überlappend fortsetzen',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  const draw=async(mode:string,start:[number,number],end:[number,number],cost:number,overlap?:string)=>{
    await page.locator(`[data-mode="${mode}"]`).click();
    await page.mouse.click(...start);await page.mouse.click(...end);
    await expect(page.locator('#confirm')).toBeEnabled();
    await expect(page.locator('#preview-text')).toContainText(`Kosten: ${cost}`);
    if(overlap)await expect(page.locator('#preview-text')).toContainText(overlap);
    await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  };
  await draw('dam',[800,360],[850,385],1000);
  await draw('dam',[820,370],[870,395],640,'bestehen bereits');
  await draw('trench',[800,360],[850,385],650);
  await draw('trench',[820,370],[870,395],309,'bereits ausgehoben');
  await expect(page.locator('#budget')).toHaveText('7 401');
  await page.locator('#reset').click();await expect(page.locator('#budget')).toHaveText('10 000');
});
