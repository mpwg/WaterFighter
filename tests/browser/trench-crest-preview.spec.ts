import { expect,test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

test('Grabenhinweis erscheint vor der Bestätigung, wenn eine Geländekante abgesenkt wird',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any) {
        if(message?.type==='preview'&&message.action?.kind==='trench') (window as any).previewCells=message.action.cells;
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});
  const select=async()=>{
    await page.locator('[data-mode="trench"]').click();
    await page.mouse.click(800,360);await page.mouse.click(850,385);
    await expect(page.locator('#confirm')).toBeEnabled();
  };
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();await select();
  const cells:number[]=await page.evaluate(()=>(window as any).previewCells);
  expect(cells.length).toBeGreaterThan(1);
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  const w:number=scenario.grid.width, a=cells[0], b=cells[1];
  const face=Math.abs(a-b)===1?{axis:'x',index:Math.floor(a/w)*(w+1)+Math.max(a%w,b%w),crest:10}:{axis:'y',index:Math.max(a,b),crest:10};
  scenario.surveyCrests=[face];
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
  await page.reload();await expect(page.locator('#run')).toBeEnabled();await select();
  await expect(page.locator('#preview-text')).toContainText('Senkt 1 modellierte Geländekante');
  await expect(page.locator('#budget')).toHaveText('10 000');
  await page.locator('#confirm').click();await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
  await expect(page.locator('#budget')).not.toHaveText('10 000');
});
