import {expect,test} from '@playwright/test';

for(const view of [
  {name:'Hoch- zu Querformat',initial:{width:390,height:844},rotated:{width:844,height:390},start:[310,500],end:[350,510]},
  {name:'Quer- zu Hochformat',initial:{width:844,height:390},rotated:{width:390,height:844},start:[470,210],end:[520,220]},
]) test(`Grabenbestätigung bleibt beim Wechsel von ${view.name} erreichbar`,async({browser})=>{
  test.setTimeout(90000);
  const context=await browser.newContext({viewport:view.initial,isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();
    await page.goto('/');
    await expect(page.locator('#run')).toBeEnabled();
    await page.locator('[data-mode="trench"]').tap();
    await page.touchscreen.tap(...view.start as [number,number]);
    await page.touchscreen.tap(...view.end as [number,number]);
    await expect(page.locator('#confirm')).toBeEnabled();
    const preview=await page.locator('#preview-text').textContent();
    const cost=Number(preview?.match(/Kosten: ([\d\s]+)/)?.[1].replace(/\s/g,''));
    expect(Number.isFinite(cost) && cost>0).toBe(true);
    await page.setViewportSize(view.rotated);
    await expect(page.locator('#preview-text')).toHaveText(preview!);
    await expect(page.locator('#budget')).toHaveText('10 000');
    const button=page.locator('#confirm'),box=await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x+box!.width).toBeLessThanOrEqual(view.rotated.width);
    expect(box!.y+box!.height).toBeLessThanOrEqual(view.rotated.height);
    expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box!.x+box!.width/2,y:box!.y+box!.height/2})).toBe('confirm');
    await button.tap();
    await expect(page.locator('#preview')).toBeHidden();
    await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
    await expect.poll(async()=>Number((await page.locator('#budget').textContent())?.replace(/\s/g,''))).toBe(10000-cost);
  } finally {await context.close();}
});
