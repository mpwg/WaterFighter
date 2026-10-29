import {expect,test} from '@playwright/test';

test('Alte und doppelte Startmeldungen verändern eine neue laufende Runde nicht',async({page})=>{
  await page.addInitScript(()=>{
    const OriginalWorker=window.Worker;
    window.Worker=class extends OriginalWorker {
      constructor(url:string|URL,options?:WorkerOptions){super(url,options);(window as any).testWorker=this;}
    };
    window.addEventListener('waterfighter:diagnostics',event=>{(window as any).lastRound=(event as CustomEvent).detail.round;});
  });
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#reset').click();await page.waitForFunction(()=>(window as any).lastRound===2);
  await page.locator('#run').click();await expect(page.locator('#state')).toHaveText('Läuft');
  await expect(page.locator('#time')).not.toHaveText('00:00',{timeout:15000});
  for(const round of [1,2]){
    await page.evaluate(round=>(window as any).testWorker.dispatchEvent(new MessageEvent('message',{data:{type:'ready',version:1,scenarioId:'brigittenau',round}})),round);
    await expect(page.locator('#state')).toHaveText('Läuft');
    await expect(page.locator('#run')).toHaveText('Pause');
    await expect(page.locator('#time')).not.toHaveText('00:00');
  }
  await page.getByRole('button',{name:'Pause'}).click();await expect(page.locator('#state')).toHaveText('Pausiert');
  expect(await page.evaluate(()=>(window as any).lastRound)).toBe(2);
});

test('Eine Startmeldung mit übersprungener Runde stoppt die Oberfläche sichtbar',async({page})=>{
  await page.addInitScript(()=>{
    const OriginalWorker=window.Worker;
    window.Worker=class extends OriginalWorker {
      constructor(url:string|URL,options?:WorkerOptions){super(url,options);(window as any).testWorker=this;}
    };
  });
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.evaluate(()=>(window as any).testWorker.dispatchEvent(new MessageEvent('message',{data:{type:'ready',version:1,scenarioId:'brigittenau',round:3}})));
  await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#run')).toBeDisabled();
  await expect(page.getByRole('button',{name:'Seite neu laden'})).toBeVisible();
});
