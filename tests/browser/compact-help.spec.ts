import {expect,test} from '@playwright/test';

test('Spielhilfe ist auf 320 × 480 ohne Suche in der Quellenleiste erreichbar',async({browser})=>{
  const context=await browser.newContext({viewport:{width:320,height:480},isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    const button=page.locator('#compact-help'),footer=page.locator('footer'),zoom=page.locator('#zoom-out');
    await expect(button).toBeVisible();await expect(page.locator('.credits')).toBeVisible();
    const box=(await button.boundingBox())!,foot=(await footer.boundingBox())!,zoomBox=(await zoom.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(foot.x+foot.width);expect(box.y).toBeGreaterThanOrEqual(zoomBox.y+zoomBox.height);
    await button.tap();await expect(button).toHaveAttribute('aria-expanded','true');
    await expect(page.locator('.help summary')).toBeVisible();await expect(page.locator('.help p')).toContainText('Karte durch Ziehen verschieben');
    await button.tap();await expect(button).toHaveAttribute('aria-expanded','false');
    expect(await footer.evaluate(e=>e.scrollTop)).toBe(0);
    await expect(page.locator('.credits')).toBeVisible();
  } finally {await context.close();}
});
