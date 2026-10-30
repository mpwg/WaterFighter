import { expect, test } from '@playwright/test';

test('Alle Werkzeuge sind nach Flutbeginn in Pause nutzbar und die Uhr läuft danach weiter',async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:1200,height:800});
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#run').click();
  await expect(page.locator('#time')).not.toHaveText('00:00',{timeout:15000});
  await page.getByRole('button',{name:'Pause'}).click();
  await expect(page.locator('#state')).toHaveText('Pausiert');
  const paused=await page.locator('#time').textContent();
  for(const mode of ['trench','dam','demolish']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    if(mode==='demolish'){
      for(const [x,y] of [[600,320],[620,320],[680,330],[750,320],[550,370],[620,365],[770,375],[520,390],[830,355],[560,245],[410,225],[450,230],[600,210],[515,220],[675,225]]) {
        await page.mouse.click(x,y);if(await page.locator('#preview').isVisible()){await expect(page.locator('#preview-text')).not.toHaveText('Kosten werden geprüft …');if(await page.locator('#confirm').isEnabled())break;await page.locator('#cancel').click();}
      }
    }
    else {await page.mouse.click(800,360);await page.mouse.click(850,385);}
    await expect(page.locator('#confirm')).toBeEnabled();
    const before=await page.locator('#budget').textContent();
    await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
    await expect(page.locator('#budget')).not.toHaveText(before!);
    await expect(page.locator('#state')).toHaveText('Pausiert');await expect(page.locator('#time')).toHaveText(paused!);
  }
  await page.locator('#run').click();await expect(page.locator('#state')).toHaveText('Läuft');
  await expect(page.locator('#time')).not.toHaveText(paused!,{timeout:15000});
});

test('Alle Werkzeuge lassen sich bei laufender Flut bestätigen',async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:1200,height:800});
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#run').click();await expect(page.locator('#state')).toHaveText('Läuft');
  const start=await page.locator('#time').textContent();
  for(const mode of ['trench','dam','demolish']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    if(mode==='demolish'){
      for(const [x,y] of [[600,320],[620,320],[680,330],[750,320],[550,370],[620,365],[770,375],[520,390],[830,355],[560,245],[410,225],[450,230],[600,210],[515,220],[675,225]]) {
        await page.mouse.click(x,y);if(await page.locator('#preview').isVisible()){await expect(page.locator('#preview-text')).not.toHaveText('Kosten werden geprüft …');if(await page.locator('#confirm').isEnabled())break;await page.locator('#cancel').click();}
      }
    }
    else {await page.mouse.click(800,360);await page.mouse.click(850,385);}
    await expect(page.locator('#confirm')).toBeEnabled();
    const before=await page.locator('#budget').textContent();
    await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
    await expect(page.locator('#budget')).not.toHaveText(before!);await expect(page.locator('#state')).toHaveText('Läuft');
  }
  await expect(page.locator('#time')).not.toHaveText(start!,{timeout:15000});
});
