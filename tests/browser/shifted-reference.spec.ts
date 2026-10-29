import {expect,test} from '@playwright/test';

test('Verschobener Referenzdamm bleibt zulässig; ein Verlauf am Kartenrand wird erklärt',async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:1600,height:1000});
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  // Projected scenario points: first endpoint (25,0) instead of (26,0), second (26,10).
  await page.mouse.click(358.09,526.89);await page.mouse.click(385.84,513.48);
  await expect(page.locator('#confirm')).toBeEnabled();
  await expect(page.locator('#preview-text')).toContainText('Kosten: 440');
  await expect(page.locator('#budget')).toHaveText('10 000');await page.locator('#cancel').click();
  // Both endpoints on the upper map edge produce a forbidden boundary face.
  await page.mouse.click(358.09,526.89);await page.mouse.click(383,541);
  await expect(page.locator('#preview-text')).toContainText('Der Damm darf nicht auf dem Kartenrand verlaufen');
  await expect(page.locator('#confirm')).toBeDisabled();
  await expect(page.locator('#budget')).toHaveText('10 000');
});
