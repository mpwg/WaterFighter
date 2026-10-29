import {expect,test} from '@playwright/test';

test('Verschobener Referenzdamm erklärt den Kartenrand und belastet kein Budget',async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:1600,height:1000});
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  // Projected scenario points: first endpoint (25,0) instead of (26,0), second (26,10).
  await page.mouse.click(358.09,526.89);await page.mouse.click(385.84,513.48);
  await expect(page.locator('#preview-text')).toContainText('Der Damm darf nicht auf dem Kartenrand verlaufen');
  await expect(page.locator('#confirm')).toBeDisabled();
  await expect(page.locator('#budget')).toHaveText('10 000');
});
