import {expect,test} from '@playwright/test';

test('Eine gesendete Maßnahme kann während der Workerantwort nicht scheinbar verworfen werden',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any) {
        if(message?.type==='action') {(window as any).releasePending=()=>super.postMessage(message,options);return;}
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  await expect(page.locator('#preview-text')).toHaveText('Maßnahme wird ausgeführt …');
  await expect(page.locator('#cancel')).toBeDisabled();
  for(const button of await page.locator('[data-mode]').all()) await expect(button).toBeDisabled();
  await expect(page.locator('#budget')).toHaveText('10 000');
  await page.evaluate(()=>(window as any).releasePending());
  await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
  await expect(page.locator('#preview')).toBeHidden();
  await expect(page.locator('[data-mode="camera"]')).toBeEnabled();
  await expect(page.locator('#budget')).not.toHaveText('10 000');
});

test('Eine abgelehnte Aktion gibt Werkzeugwahl und Verwerfen wieder frei',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any) {
        if(message?.type==='action') return super.postMessage({...message,action:{kind:'trench',cells:[]}},options);
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  await expect(page.locator('#preview-text')).toContainText('Ungültiger Grabenverlauf');
  await expect(page.locator('#confirm')).toBeDisabled();await expect(page.locator('#cancel')).toBeEnabled();
  await expect(page.locator('[data-mode="camera"]')).toBeEnabled();await expect(page.locator('#budget')).toHaveText('10 000');
  await page.locator('#cancel').click();await expect(page.locator('#preview')).toBeHidden();
});

test('Neustart verwirft eine verspätete Aktion aus der vorherigen Runde',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any) {
        if(message?.type==='action') {(window as any).releasePending=()=>super.postMessage(message,options);return;}
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  await expect(page.locator('#cancel')).toBeDisabled();await page.locator('#reset').click();
  await expect(page.locator('#state')).toHaveText('Vorbereitung');await expect(page.locator('#preview')).toBeHidden();
  await expect(page.locator('[data-mode="camera"]')).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>(window as any).releasePending());
  await page.locator('[data-mode="trench"]').click();await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();
  await expect(page.locator('#budget')).toHaveText('10 000');await expect(page.locator('[data-mode="camera"]')).toBeEnabled();
  await expect(page.locator('#message')).not.toContainText('Maßnahme bestätigt');
});
