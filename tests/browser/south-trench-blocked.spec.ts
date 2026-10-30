import {expect,test} from '@playwright/test';
import {trenchPath} from '../../src/simulation/path';

test('verschobener Südgraben erklärt das Gebäudehindernis ohne Kosten',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='trench')(window as any).trenchCells=message.action.cells;return super.postMessage(message,options);}
  };});
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
  // The start is shifted one cell north from the southern reference route.
  await page.mouse.click(411.0913,437.6000);await page.mouse.click(481.8020,522.3317);
  await expect(page.locator('#preview-text')).toHaveText('Ein Gebäude versperrt den Graben. Verlauf ändern oder Gebäude abreißen.');
  expect(await page.evaluate(()=>(window as any).trenchCells)).toEqual(trenchPath([0,45],[47,26],200));
  await expect(page.locator('#confirm')).toBeDisabled();await expect(page.locator('#budget')).toHaveText('10 000');
  await page.locator('#cancel').click();await expect(page.locator('#budget')).toHaveText('10 000');
});

test('Südgraben eine Zelle vor dem offenen Rand erhält einen Anschlusshinweis',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='trench')(window as any).trenchCells=message.action.cells;return super.postMessage(message,options);}
  };});
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(416.14,437.46);await page.mouse.click(481.80,522.33);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).trenchCells)).toEqual(trenchPath([1,46],[47,26],200));
  await expect(page.locator('#preview-text')).toContainText('Ein Grabenende liegt eine Zelle vor einem offenen Modellrand. Prüfe den Anschluss.');
  await expect(page.locator('#budget')).toHaveText('10 000');await page.locator('#cancel').click();await expect(page.locator('#budget')).toHaveText('10 000');
});
