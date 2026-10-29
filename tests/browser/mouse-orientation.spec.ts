import { expect, test } from '@playwright/test';

for (const view of [
  {name:'Hochformat',width:390,height:844,start:[310,500],end:[350,510],building:[315,305]},
  {name:'Querformat',width:844,height:390,start:[470,210],end:[520,220],building:[480,140]},
]) test(`Bauwerkzeuge mit Maus im ${view.name}`,async({browser})=>{
  test.setTimeout(90000);
  const context=await browser.newContext({viewport:{width:view.width,height:view.height}});
  try {
    const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    for(const mode of ['trench','dam','demolish']) {
      await page.locator(`[data-mode="${mode}"]`).click();
      if(mode==='demolish')await page.mouse.click(...view.building as [number,number]);
      else {await page.mouse.click(...view.start as [number,number]);await page.mouse.click(...view.end as [number,number]);}
      await expect(page.locator('#confirm')).toBeEnabled();await expect(page.locator('#preview-text')).toContainText('Kosten:');
      const button=page.locator('#confirm'),box=await button.boundingBox();expect(box).not.toBeNull();
      expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box!.x+box!.width/2,y:box!.y+box!.height/2})).toBe('confirm');
      await button.click();await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
      await page.locator('#reset').click();await expect(page.locator('#budget')).toHaveText('10 000');
    }
  } finally {await context.close();}
});
