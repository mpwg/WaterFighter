import { expect, test } from '@playwright/test';

test('Gezogene Berührung setzt keinen Baupunkt und erhält einen bereits gewählten Anfang', async ({ browser }) => {
  test.setTimeout(90000);
  const context=await browser.newContext({viewport:{width:1200,height:800},hasTouch:true});
  try {
    const page=await context.newPage(); await page.goto('/'); await expect(page.locator('#run')).toBeEnabled();
    const cdp=await context.newCDPSession(page),start={x:800,y:360,id:1},moved={x:840,y:385,id:1};
    const drag=async()=>{
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[moved]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[start]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    };
    await page.locator('[data-mode="dam"]').click();
    await drag(); await expect(page.locator('#message')).toHaveText('Karte verschoben. Startpunkt antippen.');
    await expect(page.locator('#preview')).toBeHidden();
    await page.touchscreen.tap(start.x,start.y); await expect(page.locator('#message')).toHaveText('Endpunkt auf der Karte antippen.');
    const before=await page.locator('canvas').screenshot();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[moved]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    expect((await page.locator('canvas').screenshot()).equals(before)).toBe(false);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[moved]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[start]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await drag(); await expect(page.locator('#message')).toHaveText('Karte verschoben. Endpunkt antippen.');
    await expect(page.locator('#preview')).toBeHidden();
    await page.touchscreen.tap(850,385); await expect(page.locator('#confirm')).toBeEnabled();
    await page.locator('[data-mode="demolish"]').click(); await drag();
    await expect(page.locator('#message')).toHaveText('Karte verschoben. Gebäude antippen.');
    await expect(page.locator('#preview')).toBeHidden();
    await expect(page.locator('#budget')).toHaveText('10 000');
  } finally { await context.close(); }
});

test('Karte lässt sich nach dem ersten Baupunkt verschieben, ohne die Auswahl zu verlieren', async ({page}) => {
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await expect(page.locator('#message')).toHaveText('Endpunkt auf der Karte antippen.');
  const canvas=page.locator('canvas'),before=await canvas.screenshot();
  await page.mouse.move(700,450);await page.mouse.down();await page.mouse.move(760,470,{steps:4});await page.mouse.up();
  await expect(page.locator('#message')).toHaveText('Karte verschoben. Endpunkt antippen.');
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await expect(page.locator('#preview')).toBeHidden();
  await page.mouse.click(910,405);await expect(page.locator('#confirm')).toBeEnabled();
  await expect(page.locator('#budget')).toHaveText('10 000');
});
