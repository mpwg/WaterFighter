import { expect, test } from '@playwright/test';

test('Szenariodaten sind im schmalen Querformat über die Quellen erreichbar', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 480, height: 320 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#run')).toBeEnabled();
    await page.getByText('Quellen & Hinweise').tap();
    const link = page.getByRole('link', { name: 'Szenariodaten (gzip)' });
    await link.scrollIntoViewIfNeeded();
    const download = page.waitForEvent('download');
    await link.tap();
    expect((await download).suggestedFilename()).toBe('brigittenau-v1.json.bin');
  } finally {
    await context.close();
  }
});
