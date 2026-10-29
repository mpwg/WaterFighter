import { expect, test } from '@playwright/test';

test('ein schräger Graben folgt den Endpunkten und wird verbindlich bestätigt', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.Worker;
    window.Worker = class extends Original {
      override postMessage(message: any, options?: any) {
        if (message?.type === 'preview' && message.action?.kind === 'trench') (window as any).previewCells = message.action.cells;
        return super.postMessage(message, options);
      }
    };
  });
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800, 360);
  await page.mouse.click(850, 385);
  await expect(page.locator('#confirm')).toBeEnabled();
  const cells: number[] = await page.evaluate(() => (window as any).previewCells);
  const changes = cells.slice(1).map((cell, i) => Math.abs(cell - cells[i]));
  expect(changes).toContain(1);
  expect(changes).toContain(200);
  expect(changes.some((change, i) => i > 0 && change !== changes[i - 1])).toBe(true);
  await expect(page.locator('#budget')).toHaveText('10 000');
  await page.locator('#confirm').click();
  await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
  await expect(page.locator('#budget')).not.toHaveText('10 000');
});
