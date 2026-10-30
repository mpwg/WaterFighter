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

test('Spielhilfe ist im schmalen Querformat direkt erreichbar',async({browser})=>{
  const context=await browser.newContext({viewport:{width:480,height:320},isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    const button=page.locator('#compact-help'),panel=page.locator('#game-panel'),footer=page.locator('footer'),zoom=page.locator('#zoom-in');
    await expect(button).toBeVisible();await expect(page.locator('.credits')).toBeVisible();
    const box=(await button.boundingBox())!,panelBox=(await panel.boundingBox())!,footerBox=(await footer.boundingBox())!,zoomBox=(await zoom.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(panelBox.x+panelBox.width);expect(box.x+box.width).toBeLessThanOrEqual(zoomBox.x);
    expect(box.y+box.height).toBeLessThanOrEqual(footerBox.y);
    await button.tap();await expect(button).toHaveAttribute('aria-expanded','true');
    await expect(page.locator('.help summary')).toBeVisible();await expect(page.locator('.help p')).toContainText('Karte durch Ziehen verschieben');
    await button.tap();await expect(button).toHaveAttribute('aria-expanded','false');
    expect(await footer.evaluate(e=>e.scrollTop)).toBe(0);
  } finally {await context.close();}
});
