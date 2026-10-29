import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
test('Szenario und Worker laden; Uhr pausiert und startet neu', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#message')).toHaveText('Wiener Szenario geladen. Die Wasserberechnung ist bereit.');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'Simulation starten'}).click();
  await expect(page.locator('#state')).toHaveText('Läuft');
  await expect(page.locator('#time')).not.toHaveText('00:00', {timeout:10000});
  await page.getByRole('button',{name:'Pause'}).click();
  await expect(page.locator('#state')).toHaveText('Pausiert');
  const paused=await page.locator('#time').textContent();
  await page.waitForTimeout(1200);
  await expect(page.locator('#time')).toHaveText(paused!);
  await page.getByRole('button',{name:'Neustart'}).click();
  await expect(page.locator('#time')).toHaveText('00:00');
  await expect(page.locator('#state')).toHaveText('Vorbereitung');
});

test('Bedienelemente bleiben im mobilen Querformat erreichbar', async ({ browser }) => {
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const page=await context.newPage(); await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  for(const selector of ['#run','#reset','#speed','#zoom-in','#zoom-out']) {
    const box=await page.locator(selector).boundingBox();
    expect(box).not.toBeNull(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y+box!.height).toBeLessThanOrEqual(390);
    const target=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box!.x+box!.width/2,y:box!.y+box!.height/2});
    expect(target).toBe(selector.slice(1));
  }
  await page.locator('#zoom-in').tap(); await page.locator('#run').tap();
  await expect(page.locator('#state')).toHaveText('Läuft');
  await context.close();
});

test('Graben und Damm vorschauen, bestätigen und neu starten', async ({page})=>{
  await page.setViewportSize({width:1200,height:800}); await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  for(const mode of ['trench','dam']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await page.mouse.click(800,360); await page.mouse.click(850,385);
    await expect(page.locator('#confirm')).toBeEnabled();
    await expect(page.locator('#preview-text')).toContainText('Kosten:');
    await expect(page.locator('#budget')).toHaveText('10 000');
    await page.locator('#confirm').click();
    await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
    await expect(page.locator('#budget')).not.toHaveText('10 000');
    await page.locator('#reset').click();
    await expect(page.locator('#budget')).toHaveText('10 000');
  }
});

test('Gebäudeabriss verlangt Vorschau und Bestätigung', async ({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="demolish"]').click();await page.mouse.click(600,320);
  await expect(page.locator('#confirm')).toBeEnabled();await expect(page.locator('#budget')).toHaveText('10 000');
  await page.locator('#confirm').click();await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
  await expect(page.locator('#budget')).not.toHaveText('10 000');
});


test('Eine verkürzte Runde zeigt das Ergebnis und erlaubt den Neustart', async ({page})=>{
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  scenario.parameters.duration=2;
  await page.route('**/scenarios/brigittenau-v1.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(scenario)}));
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();await page.locator('#run').click();
  await expect(page.locator('#result')).toBeVisible({timeout:15000});
  await expect(page.locator('#result-details')).toContainText('Flutschäden');
  await expect(page.locator('#result-details')).toContainText('Abrissverluste');
  await page.getByRole('button',{name:'Neue Runde'}).click();await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#state')).toHaveText('Vorbereitung');await expect(page.locator('#budget')).toHaveText('10 000');
});
