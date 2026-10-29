import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
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
    await expect(page.locator('#preview-text')).toContainText(mode==='trench'?'Geländeabsenkung:':'Dammhöhe:');
    await expect(page.locator('#preview-text')).toContainText('Budget danach:');
    await expect(page.locator('#budget')).toHaveText('10 000');
    await page.locator('#confirm').click();
    await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
    await expect(page.locator('#budget')).not.toHaveText('10 000');
    await page.locator('#reset').click();
    await expect(page.locator('#budget')).toHaveText('10 000');
    await expect(page.locator('[data-mode="camera"]')).toHaveAttribute('aria-pressed','true');
  }
});

test('Gebäudeabriss verlangt Vorschau und Bestätigung', async ({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="demolish"]').click();await page.mouse.click(600,320);
  await expect(page.locator('#confirm')).toBeEnabled();await expect(page.locator('#budget')).toHaveText('10 000');
  await expect(page.locator('#preview-text')).toContainText('Gebäudeverlust insgesamt:');
  await expect(page.locator('#preview-text')).toContainText('Budget danach:');
  await page.locator('#confirm').click();await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
  await expect(page.locator('#budget')).not.toHaveText('10 000');
});


test('Eine verkürzte Runde zeigt das Ergebnis und erlaubt den Neustart', async ({page})=>{
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  scenario.parameters.duration=2;
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();await page.locator('#run').click();
  await expect(page.locator('#result')).toBeVisible({timeout:15000});
  await expect(page.locator('#result-details')).toContainText('Flutschäden');
  await expect(page.locator('#result-details')).toContainText('Abrissverluste');
  await page.getByRole('button',{name:'Neue Runde'}).click();await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#state')).toHaveText('Vorbereitung');await expect(page.locator('#budget')).toHaveText('10 000');
});

test('Einführung und Zustandsabfrage sind erreichbar',async ({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.getByText('So wird gespielt').click();await expect(page.getByText(/Wassertiefe und Gebäudeschaden antippen/)).toBeVisible();
  await page.mouse.click(800,360);await expect(page.locator('#message')).toContainText(/Wassertiefe|Gebäude/);
});

test('Bedienfeld und Quellen überdecken sich bei mittlerer Fensterhöhe nicht',async({page})=>{
  await page.setViewportSize({width:1200,height:600});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  for(const selector of ['#run','#reset','#speed','[data-mode="dam"]']) {
    const box=await page.locator(selector).boundingBox();expect(box).not.toBeNull();
    expect(box!.y+box!.height).toBeLessThanOrEqual(600);
    const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.id||document.elementFromPoint(x,y)?.closest('button')?.getAttribute('data-mode'),{x:box!.x+box!.width/2,y:box!.y+box!.height/2});
    expect(hit).toBe(selector==='[data-mode="dam"]'?'dam':selector.slice(1));
  }
});

for (const device of [
  {name:'Hochformat',width:390,height:844,start:[310,500],end:[350,510],building:[315,305]},
  {name:'Querformat',width:844,height:390,start:[470,210],end:[520,220],building:[480,140]},
]) test(`Bauwerkzeuge mit Touch im ${device.name}`,async({browser})=>{
  test.setTimeout(90000);
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  for(const mode of ['trench','dam','demolish']) {
    await page.locator(`[data-mode="${mode}"]`).tap();
    if(mode==='demolish')await page.touchscreen.tap(...device.building as [number,number]);
    else {await page.touchscreen.tap(...device.start as [number,number]);await page.touchscreen.tap(...device.end as [number,number]);}
    await expect(page.locator('#confirm')).toBeEnabled();await expect(page.locator('#preview-text')).toContainText('Kosten:');
    await page.locator('#confirm').tap();await expect(page.locator('#message')).toContainText('Maßnahme bestätigt');
    await page.locator('#reset').tap();await expect(page.locator('#budget')).toHaveText('10 000');
  }
  await context.close();
});

test('Moduswechsel während einer Kartenberührung setzt keinen Baupunkt',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1200,height:800},hasTouch:true});
  const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  const cdp=await context.newCDPSession(page),first={x:800,y:360,id:1};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
  await page.locator('[data-mode="dam"]').click();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#message')).toHaveText('Start und Ende auf der Karte antippen.');
  await expect(page.locator('#preview')).toBeHidden();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
  await page.locator('[data-mode="camera"]').click();await page.locator('[data-mode="dam"]').click();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#message')).toHaveText('Start und Ende auf der Karte antippen.');
  await page.touchscreen.tap(800,360);await expect(page.locator('#message')).toHaveText('Endpunkt auf der Karte antippen.');
  await page.touchscreen.tap(850,385);await expect(page.locator('#confirm')).toBeEnabled();
  await context.close();
});

test('Zweiter Finger übernimmt keine laufende Werkzeugberührung',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1200,height:800},hasTouch:true});
  const page=await context.newPage();await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();
  const cdp=await context.newCDPSession(page), first={x:800,y:360,id:1},second={x:850,y:385,id:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[second]});
  await expect(page.locator('#message')).toHaveText('Start und Ende auf der Karte antippen.');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#message')).toHaveText('Endpunkt auf der Karte antippen.');
  await page.touchscreen.tap(second.x,second.y);
  await expect(page.locator('#confirm')).toBeEnabled();
  await expect(page.locator('#budget')).toHaveText('10 000');
  await context.close();
});

test('Fehlendes Szenario zeigt eine verständliche Fehlermeldung',async({page})=>{
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:404,body:'fehlt'}));await page.goto('/');
  await expect(page.locator('#message')).toContainText('Szenario oder Grafik konnte nicht geladen werden: HTTP 404');
  await expect(page.locator('#state')).toHaveText('Fehler');await expect(page.locator('#run')).toBeDisabled();
});

test('Beschädigtes komprimiertes Szenario meldet einen Ladefehler',async({page})=>{
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:'defekt'}));
  await page.goto('/');await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#message')).toContainText('Szenario oder Grafik konnte nicht geladen werden');
  await expect(page.locator('#run')).toBeDisabled();
});

test('Verlust des Grafikkontexts pausiert und weist auf einen Neustart hin',async({page})=>{
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#panel-toggle').click();await expect(page.locator('#game-panel')).toBeHidden();
  await page.locator('canvas').dispatchEvent('webglcontextlost',{cancelable:true});
  await expect(page.locator('#game-panel')).toBeVisible();
  await expect(page.locator('#state')).toHaveText('Fehler');await expect(page.locator('#message')).toContainText('Bitte Seite neu laden');
  await expect(page.locator('#run')).toBeDisabled();
  await page.getByRole('button',{name:'Seite neu laden'}).click();
  await expect(page.locator('#run')).toBeEnabled();
  await expect(page.locator('#state')).toHaveText('Vorbereitung');
});

test('Aktionslatenz wird erst nach Darstellung des bestätigten Zustands gemeldet',async({page})=>{
  await page.setViewportSize({width:1200,height:800});
  await page.addInitScript(()=>{(window as any).wfPresented=[];window.addEventListener('waterfighter:action-displayed',(e:Event)=>(window as any).wfPresented.push((e as CustomEvent).detail));});
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).wfPresented.length)).toBe(0);
  await page.locator('#confirm').click();
  await page.waitForFunction(()=>(window as any).wfPresented.length===1);
  const result=await page.evaluate(()=>(window as any).wfPresented[0]);
  expect(result.round).toBe(1);expect(result.latencyMs).toBeGreaterThanOrEqual(0);expect(result.presentedAt).toBeGreaterThanOrEqual(result.confirmedAt);
});

test('Messskript erfasst 1×-Frames, Workerzeit und bestätigte Aktionen',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.addScriptTag({path:'tools/measure-session.js'});await page.locator('#run').click();await expect(page.locator('#state')).toHaveText('Läuft');
  await page.locator('[data-mode="trench"]').click();await page.mouse.click(800,360);await page.mouse.click(850,385);await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  await page.waitForTimeout(1200);
  const report=await page.evaluate(()=>(window as any).waterfighterMeasurement.stop());
  expect(report.frameCount).toBeGreaterThan(0);expect(report.observedWallMs).toBeGreaterThan(0);expect(report.observedSimSeconds).toBeGreaterThan(0);
  expect(report.actions).toHaveLength(1);expect(report.actions[0].latencyMs).toBeGreaterThanOrEqual(0);
});

test('Neustart stellt Kartenmodus, Kameraziel und Zoom wieder her',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  const preview=async()=>{await page.locator('[data-mode="dam"]').click();await page.mouse.click(800,360);await page.mouse.click(850,385);await expect(page.locator('#confirm')).toBeEnabled();return await page.locator('#preview-text').textContent();};
  const initial=await preview();await page.locator('#cancel').click();await page.locator('[data-mode="camera"]').click();
  await page.mouse.move(700,420);await page.mouse.down();await page.mouse.move(760,460,{steps:4});await page.mouse.up();await page.locator('#zoom-in').click();
  await page.locator('#reset').click();await expect(page.locator('[data-mode="camera"]')).toHaveAttribute('aria-pressed','true');
  expect(await preview()).toBe(initial);
});


test('Workerfehler bei Initialisierung zeigt eine Wiederherstellungsmöglichkeit', async ({page})=>{
  await page.addInitScript(()=>{
    const OriginalWorker=window.Worker;
    window.Worker=class extends OriginalWorker {
      override postMessage(message: unknown, transferOrOptions?: Transferable[] | StructuredSerializeOptions) {
        if((message as {type?:string}).type==='init') {
          setTimeout(()=>this.dispatchEvent(new MessageEvent('message',{data:{type:'error',round:1,message:'Initialisierung fehlgeschlagen'}})),0);
        } else super.postMessage(message,transferOrOptions as StructuredSerializeOptions);
      }
    };
  });
  await page.goto('/');
  await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#message')).toContainText('Initialisierung fehlgeschlagen');
  await expect(page.locator('#message')).toContainText('Seite neu laden');
  await expect(page.locator('#run')).toBeDisabled();
});

test('Simulationsfehler nennt das Neuladen als Wiederherstellung', async ({page})=>{
  await page.addInitScript(()=>{
    const OriginalWorker=window.Worker;
    window.Worker=class extends OriginalWorker {
      override postMessage(message: unknown, transferOrOptions?: Transferable[] | StructuredSerializeOptions) {
        if((message as {type?:string}).type==='start') {
          const round=(message as {round:number}).round;
          setTimeout(()=>this.dispatchEvent(new MessageEvent('message',{data:{type:'error',round,message:'Solverfehler'}})),0);
        } else super.postMessage(message,transferOrOptions as StructuredSerializeOptions);
      }
    };
  });
  await page.goto('/'); await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#run').click();
  await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#message')).toContainText('Solverfehler');
  await expect(page.locator('#message')).toContainText('Seite neu laden');
  await expect(page.locator('#run')).toBeDisabled();
});


for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]) test(`Kartenansicht durch Menü ausblenden freilegen (${viewport.width}×${viewport.height})`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  const toggle=page.locator('#panel-toggle'),panel=page.locator('#game-panel');
  await expect(toggle).toHaveAttribute('aria-expanded','true');await toggle.click();
  await expect(panel).toBeHidden();await expect(toggle).toHaveAttribute('aria-expanded','false');
  const box=await toggle.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);
  await toggle.click();await expect(panel).toBeVisible();await expect(page.locator('#run')).toBeEnabled();
});


test('Ein blockierter Workerstart zeigt einen handlungsfähigen Fehler',async({page})=>{
  await page.addInitScript(()=>{window.Worker=class {constructor(){throw new Error('Worker blockiert');}} as unknown as typeof Worker;});
  await page.goto('/');
  await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#message')).toContainText('Worker konnte nicht gestartet');
  await expect(page.locator('#message')).toContainText('Seite neu laden');
  await expect(page.locator('#run')).toBeDisabled();
  await expect(page.locator('#panel-toggle')).toBeEnabled();
});

test('Eine unlesbare Worker-Nachricht stoppt die Berechnung sichtbar',async({page})=>{
  await page.addInitScript(()=>{
    const OriginalWorker=window.Worker;
    window.Worker=class extends OriginalWorker {
      constructor(url: string | URL,options?:WorkerOptions){super(url,options);(window as any).testWorker=this;}
      override terminate(){(window as any).workerTerminated=true;super.terminate();}
    };
  });
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.evaluate(()=>{const w=(window as any).testWorker;w.onmessageerror(new MessageEvent('messageerror'));});
  await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#message')).toContainText('Seite neu laden');
  await expect(page.locator('#run')).toBeDisabled();
  expect(await page.evaluate(()=>(window as any).workerTerminated)).toBe(true);
});

for(const bad of [
  {name:'leerer Inhalt',data:null},
  {name:'falsche Protokollversion',data:{type:'ready',version:2,scenarioId:'brigittenau',round:1}},
  {name:'beschädigter Snapshot',data:{type:'snapshot',round:1,buffer:null}},
]) test(`Ungültige Worker-Nachricht meldet einen Fehler: ${bad.name}`,async({page})=>{
  await page.addInitScript(()=>{
    const OriginalWorker=window.Worker;
    window.Worker=class extends OriginalWorker {
      constructor(url:string|URL,options?:WorkerOptions){super(url,options);(window as any).testWorker=this;}
      override terminate(){(window as any).workerTerminated=true;super.terminate();}
    };
  });
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.evaluate(data=>(window as any).testWorker.dispatchEvent(new MessageEvent('message',{data})),bad.data);
  await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#message')).toContainText('Seite neu laden');
  await expect(page.locator('#run')).toBeDisabled();
  expect(await page.evaluate(()=>(window as any).workerTerminated)).toBe(true);
});

for(const viewport of [{width:320,height:480},{width:480,height:320}]) test(`Vorschau bleibt bei kleiner Ansicht erreichbar (${viewport.width}×${viewport.height})`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').tap();await page.locator('#panel-toggle').tap();
  await page.touchscreen.tap(viewport.width/2,viewport.height*.47);
  await page.touchscreen.tap(viewport.width/2+30,viewport.height*.52);
  await expect(page.locator('#confirm')).toBeEnabled();
  const previewBox=await page.locator('#preview').boundingBox();expect(previewBox).not.toBeNull();
  expect(previewBox!.x).toBeGreaterThanOrEqual(0);expect(previewBox!.x+previewBox!.width).toBeLessThanOrEqual(viewport.width);
  for(const selector of ['#confirm','#cancel']){
    const box=await page.locator(selector).boundingBox();expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);expect(box!.y+box!.height).toBeLessThanOrEqual(viewport.height);
    expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
    const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box!.x+box!.width/2,y:box!.y+box!.height/2});
    expect(hit).toBe(selector.slice(1));
  }
  await page.locator('#confirm').tap();await expect(page.locator('#preview')).toBeHidden();
  await expect(page.locator('#budget')).not.toHaveText('10 000');
  await context.close();
});

test('Werkzeuge und Quellen bleiben im schmalen Querformat erreichbar',async({browser})=>{
  const viewport={width:480,height:320},context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  for(const selector of ['[data-mode="camera"]','[data-mode="dam"]','[data-mode="trench"]','[data-mode="demolish"]','#run','#reset','#speed']){
    const button=page.locator(selector);await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
    const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.outerHTML,{x:box!.x+box!.width/2,y:box!.y+box!.height/2});
    expect(hit).toBe(await button.evaluate(element=>element.outerHTML));
  }
  const credit=page.locator('.credits a').first(),box=await credit.boundingBox();expect(box).not.toBeNull();
  const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('a')?.getAttribute('href'),{x:box!.x+box!.width/2,y:box!.y+box!.height/2});
  expect(hit).toBe(await credit.getAttribute('href'));
  await page.locator('[data-mode="demolish"]').tap();await expect(page.locator('[data-mode="demolish"]')).toHaveAttribute('aria-pressed','true');
  await context.close();
});

test('Neustart nach allen Werkzeugen und Flut stellt die Kartenansicht wieder her',async({page})=>{
  await page.setViewportSize({width:1200,height:800});
  await page.addInitScript(()=>window.addEventListener('waterfighter:diagnostics',event=>{(window as any).lastRound=(event as CustomEvent).detail.round;}));
  await page.goto('/');await expect(page.locator('#budget')).toHaveText('10 000');
  await page.waitForFunction(()=>(window as any).lastRound===1);await page.waitForTimeout(500);
  const before=await page.screenshot();
  for(const mode of ['trench','dam','demolish']){
    await page.locator(`[data-mode="${mode}"]`).click();
    if(mode==='demolish')await page.mouse.click(600,320);
    else {await page.mouse.click(800,360);await page.mouse.click(850,385);}
    await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  }
  await expect(page.locator('#budget')).not.toHaveText('10 000');await page.locator('#run').click();
  await expect(page.locator('#time')).not.toHaveText('00:00',{timeout:10000});
  await page.locator('#reset').click();await page.waitForFunction(()=>(window as any).lastRound===2);
  await expect(page.locator('#time')).toHaveText('00:00');await expect(page.locator('#budget')).toHaveText('10 000');
  await expect(page.locator('[data-mode="camera"]')).toHaveAttribute('aria-pressed','true');await page.waitForTimeout(500);
  expect(await page.screenshot()).toEqual(before);
});
