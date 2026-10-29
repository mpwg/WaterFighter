import { expect, test } from '@playwright/test';

test('Status und Quellen sind auf 320 × 480 lesbar und getrennt erreichbar', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 480 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#run')).toBeEnabled();
    for (const selector of ['#time', '#budget', '#state']) {
      const size = await page.locator(selector).evaluate(e => ({height: e.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(e).fontSize), scrollWidth: e.scrollWidth, clientWidth: e.clientWidth}));
      expect(size.height).toBeLessThanOrEqual(size.fontSize * 1.6);
      expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth + 1);
    }
    const panel = (await page.locator('#game-panel').boundingBox())!;
    const footer = (await page.locator('footer').boundingBox())!;
    expect(panel.y + panel.height).toBeLessThanOrEqual(footer.y);
    for (const button of await page.locator('.tools button').all()) {
      const size=await button.evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
      expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
      expect(size.width).toBeGreaterThanOrEqual(44); expect(size.height).toBeGreaterThanOrEqual(44);
    }
    for (const selector of ['#run', '#reset', '#speed']) {
      const button=page.locator(selector); await button.scrollIntoViewIfNeeded();
      const box=(await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.id,{x:box.x+box.width/2,y:box.y+box.height/2});
      expect(hit).toBe(selector.slice(1));
    }
  } finally { await context.close(); }
});
