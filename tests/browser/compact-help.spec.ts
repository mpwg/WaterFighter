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

for(const viewport of [{width:361,height:320},{width:390,height:320},{width:600,height:500}])test(`Hilfe und Bedienelemente bleiben bei ${viewport.width} × ${viewport.height} getrennt`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    const help=page.locator('#compact-help'),panel=page.locator('#game-panel'),zoom=page.locator('#zoom-in'),footer=page.locator('footer'),header=page.locator('.topbar');
    await expect(help).toBeVisible();
    const h=(await help.boundingBox())!,p=(await panel.boundingBox())!,z=(await zoom.boundingBox())!,f=(await footer.boundingBox())!,t=(await header.boundingBox())!;
    expect(h.x).toBeGreaterThanOrEqual(p.x+p.width);expect(h.x+h.width).toBeLessThanOrEqual(z.x);
    expect(h.y).toBeGreaterThanOrEqual(t.y+t.height);expect(h.y+h.height).toBeLessThanOrEqual(f.y);
    await help.tap();await expect(help).toHaveAttribute('aria-expanded','true');await expect(page.locator('.help summary')).toBeVisible();
    expect((await footer.boundingBox())!.width).toBeGreaterThanOrEqual(240);
    await help.tap();await expect(help).toHaveAttribute('aria-expanded','false');
  } finally {await context.close();}
});

test('geöffnete Hilfe verdeckt im Querformat keine Maßnahmenbestätigung',async({browser})=>{
  const context=await browser.newContext({viewport:{width:480,height:320},isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    await page.locator('[data-mode="dam"]').tap();await page.locator('#panel-toggle').tap();await page.locator('#compact-help').tap();
    await page.touchscreen.tap(240,150);await page.touchscreen.tap(270,166);
    const confirm=page.locator('#confirm');await expect(confirm).toBeEnabled();
    const box=(await confirm.boundingBox())!;
    expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box.x+box.width/2,y:box.y+box.height/2})).toBe('confirm');
    await confirm.tap();await expect(page.locator('#preview')).toBeHidden();await expect(page.locator('#budget')).not.toHaveText('10 000');
  } finally {await context.close();}
});
