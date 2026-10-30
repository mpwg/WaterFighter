import {expect,test} from '@playwright/test';

test('kleines Gebäude ist bei eindeutigem Beinahetreffer als Vorschau erreichbar',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='demolish')(window as any).selectedBuilding=message.action.buildingId;return super.postMessage(message,options);}
  };});
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="demolish"]').click();await page.locator('#panel-toggle').click();
  // On the 1.5 scene this is 8 CSS pixels right of the small roof centre;
  // the direct Babylon ray misses and the unambiguous fallback selects it.
  const point={x:493.230158,y:484.411218};
  await page.mouse.click(point.x,point.y);
  await expect(page.locator('#preview')).toBeVisible();await expect(page.locator('#preview-text')).toContainText('Kosten: 7');
  expect(await page.evaluate(()=>(window as any).selectedBuilding)).toBe('w1207502028-0');
  await expect(page.locator('#budget')).toHaveText('10 000');
  await page.locator('#cancel').click();await expect(page.locator('#budget')).toHaveText('10 000');
});
