import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';

test('Startpunkt erscheint auf der Karte und verschwindet beim Werkzeugwechsel',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  const clip={x:780,y:340,width:40,height:40};
  const before=await page.screenshot({clip});
  await page.mouse.click(800,360);await expect(page.locator('#message')).toContainText('Endpunkt');
  await page.waitForTimeout(150);
  const marked=await page.screenshot({clip});expect(marked.equals(before)).toBe(false);
  await page.locator('[data-mode="camera"]').click();await page.waitForTimeout(150);
  expect((await page.screenshot({clip})).equals(before)).toBe(true);
});

test('Startpunkt bleibt auch über einer überfluteten Karte sichtbar',async({page})=>{
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  scenario.initialDepth.fill(4);
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  const clip={x:780,y:340,width:40,height:40},before=await page.screenshot({clip});
  await page.mouse.click(800,360);await expect(page.locator('#message')).toContainText('Endpunkt');
  await page.waitForTimeout(150);expect((await page.screenshot({clip})).equals(before)).toBe(false);
});
