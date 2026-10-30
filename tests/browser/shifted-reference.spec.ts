import {expect,test} from '@playwright/test';
import {damPath} from '../../src/simulation/path';

test('Verschobener Referenzdamm bleibt zulässig; ein Verlauf am Kartenrand wird erklärt',async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:1600,height:1000});
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  // Projected scenario points: first endpoint (25,0) instead of (26,0), second (26,10).
  await page.mouse.click(358.09,526.89);await page.mouse.click(385.84,513.48);
  await expect(page.locator('#confirm')).toBeEnabled();
  await expect(page.locator('#preview-text')).toContainText('Kosten: 440');
  await expect(page.locator('#preview-text')).not.toContainText('Anschluss automatisch verbunden.');
  await expect(page.locator('#budget')).toHaveText('10 000');await page.locator('#cancel').click();
  // Both endpoints on the upper map edge produce a forbidden boundary face.
  await page.mouse.click(358.09,526.89);await page.mouse.click(383,541);
  await expect(page.locator('#preview-text')).toContainText('Der Damm darf nicht auf dem Kartenrand verlaufen');
  await expect(page.locator('#confirm')).toBeDisabled();
  await expect(page.locator('#budget')).toHaveText('10 000');
});

test('Vorschau verbindet ein nahes Dammende mit dem Rand',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damPreview=message.action.faces;return super.postMessage(message,options);}
  };});
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(363.14,526.56);await page.mouse.click(385.84,513.48);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).damPreview)).toEqual(damPath([26,0],[26,10],200));
  await expect(page.locator('#preview-text')).toContainText('Kosten: 400');
  await expect(page.locator('#preview-text')).toContainText('Anschluss automatisch verbunden.');
  await expect(page.locator('#budget')).toHaveText('10 000');await page.locator('#cancel').click();
  await expect(page.locator('#budget')).toHaveText('10 000');
});

test('Vorschau verbindet ein nahes Ende mit einem vorhandenen Damm',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damPreview=message.action.faces;return super.postMessage(message,options);}
  };});
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(360.62,528.01);await page.mouse.click(385.84,513.48);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  await page.mouse.click(388.36,514.60);await page.mouse.click(431.29,510.80);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).damPreview)).toEqual(damPath([26,10],[34,20],200));
  await expect(page.locator('#preview-text')).toContainText('Kosten: 720');
  await expect(page.locator('#preview-text')).toContainText('Anschluss automatisch verbunden.');
  await expect(page.locator('#budget')).toHaveText('9 600');await page.locator('#confirm').click();
  await expect(page.locator('#budget')).toHaveText('8 880');
});

test('ein nahes Ende verbindet sich seitlich mit einem bestehenden Damm',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damPreview=message.action.faces;return super.postMessage(message,options);}
  };});
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(360.62,528.01);await page.mouse.click(385.84,513.48);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();await expect(page.locator('#budget')).toHaveText('9 600');
  await page.mouse.click(375.75,521.86);await page.mouse.click(393.39,529.70);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).damPreview)).toEqual(damPath([26,5],[33,6],200));
  await expect(page.locator('#preview-text')).toContainText('Anschluss automatisch verbunden.');
  await expect(page.locator('#preview-text')).toContainText('Kosten: 320');
  await page.locator('#confirm').click();await expect(page.locator('#budget')).toHaveText('9 280');
});

test.describe('Seitlicher Anschluss während der Flut',()=>{
  for(const pause of [false,true])test(pause?'in Pause':'bei laufender Uhr',async({page})=>{
    await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
      override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damPreview=message.action.faces;return super.postMessage(message,options);}
    };});
    await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
    await page.mouse.click(360.62,528.01);await page.mouse.click(385.84,513.48);
    await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();await expect(page.locator('#budget')).toHaveText('9 600');
    await page.locator('#panel-toggle').click();await page.locator('#run').click();await expect(page.locator('#state')).toHaveText('Läuft');
    await expect(page.locator('#time')).not.toHaveText('00:00',{timeout:15000});
    if(pause){await page.locator('#run').click();await expect(page.locator('#state')).toHaveText('Pausiert');}
    const time=await page.locator('#time').textContent();await page.locator('#panel-toggle').click();
    await page.mouse.click(375.75,521.86);await page.mouse.click(393.39,529.70);
    await expect(page.locator('#confirm')).toBeEnabled();
    expect(await page.evaluate(()=>(window as any).damPreview)).toEqual(damPath([26,5],[33,6],200));
    await expect(page.locator('#preview-text')).toContainText('Anschluss automatisch verbunden.');
    await page.locator('#confirm').click();await expect(page.locator('#budget')).toHaveText('9 280');
    await expect(page.locator('#state')).toHaveText(pause?'Pausiert':'Läuft');
    if(pause)await expect(page.locator('#time')).toHaveText(time!);
  });
});

test('sofortiger Anschluss kennt den bestätigten Damm vor dem verzögerten Snapshot',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override set onmessage(handler:((this:Worker,ev:MessageEvent)=>any)|null){
      super.onmessage=handler?function(ev:MessageEvent){
        if(ev.data?.type==='snapshot'&&ev.data.revision===1){setTimeout(()=>handler.call(this,ev),5000);return;}
        handler.call(this,ev);
      }:null;
    }
    override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damPreview=message.action.faces;return super.postMessage(message,options);}
  };});
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(360.62,528.01);await page.mouse.click(385.84,513.48);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  await page.mouse.click(375.75,521.86);await page.mouse.click(393.39,529.70);
  await expect(page.locator('#confirm')).toBeEnabled({timeout:3000});
  expect(await page.evaluate(()=>(window as any).damPreview)).toEqual(damPath([26,5],[33,6],200));
  await expect(page.locator('#preview-text')).toContainText('Anschluss automatisch verbunden.');
});
