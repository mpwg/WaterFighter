import { expect, test } from '@playwright/test';

test('Gezogene Berührung setzt keinen Baupunkt und erhält einen bereits gewählten Anfang', async ({ browser }) => {
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
    await drag(); await expect(page.locator('#message')).toHaveText('Bitte Start und Ende einzeln antippen.');
    await expect(page.locator('#preview')).toBeHidden();
    await page.touchscreen.tap(start.x,start.y); await expect(page.locator('#message')).toHaveText('Endpunkt auf der Karte antippen.');
    await drag(); await expect(page.locator('#message')).toHaveText('Endpunkt nicht gesetzt. Bitte antippen.');
    await expect(page.locator('#preview')).toBeHidden();
    await page.touchscreen.tap(850,385); await expect(page.locator('#confirm')).toBeEnabled();
    await page.locator('[data-mode="demolish"]').click(); await drag();
    await expect(page.locator('#message')).toHaveText('Bitte das Gebäude antippen.');
    await expect(page.locator('#preview')).toBeHidden();
    await expect(page.locator('#budget')).toHaveText('10 000');
  } finally { await context.close(); }
});
