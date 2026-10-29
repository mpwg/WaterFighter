import {expect,test} from '@playwright/test';

for(const viewport of [{width:320,height:480},{width:480,height:320}])test(`Status bleibt bei ausgeblendetem Menü lesbar (${viewport.width}×${viewport.height})`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();await page.goto('/');
    await expect(page.locator('#run')).toBeEnabled();
    await expect(page.locator('#compact-status')).toBeHidden();
    await page.locator('#panel-toggle').tap();
    const compact=page.locator('#compact-status');
    await expect(compact).toBeVisible();
    await expect(compact).toContainText('00:00');
    await expect(compact).toContainText('Budget 10');
    await expect(compact).toContainText('Vorbereitung');
    const geometry=await page.locator('.topbar').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom};});
    expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(viewport.width);
    expect(geometry.bottom).toBeLessThanOrEqual(105);
    await page.locator('#panel-toggle').tap();
    await expect(compact).toBeHidden();
    await page.locator('#run').tap();
    await expect(page.locator('#state')).toHaveText('Läuft');
    await page.locator('#panel-toggle').tap();
    await expect(compact).toContainText('Läuft');
    await expect(compact).not.toContainText('00:00',{timeout:15000});
  } finally {await context.close();}
});

test('kompakter Status übernimmt das Budget nach einer bestätigten Maßnahme',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  await expect(page.locator('#budget')).not.toHaveText('10 000');
  const budget=await page.locator('#budget').textContent();
  await page.locator('#panel-toggle').click();
  await expect(page.locator('#compact-status')).toContainText(`Budget ${budget}`);
});
