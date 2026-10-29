import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';

for(const viewport of [{width:320,height:480},{width:480,height:320}])test(`Status bleibt bei ausgeblendetem Menü lesbar (${viewport.width}×${viewport.height})`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();await page.goto('/');
    await expect(page.locator('#run')).toBeEnabled();
    await expect(page.locator('#compact-status')).toBeHidden();
    await page.locator('#panel-toggle').tap();
    const compact=page.locator('#compact-status');
    await expect(compact).toBeVisible();
    await expect(compact).toContainText('00:00');
    await expect(compact).toContainText('Budget 10');
    await expect(compact).toContainText('Vorbereitung');
    const geometry=await page.locator('.topbar').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom};});
    expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(viewport.width);
    expect(geometry.bottom).toBeLessThanOrEqual(105);
    await page.locator('#panel-toggle').tap();
    await expect(compact).toBeHidden();
    await page.locator('#run').tap();
    await expect(page.locator('#state')).toHaveText('Läuft');
    await page.locator('#panel-toggle').tap();
    await expect(compact).toContainText('Läuft');
    await expect(compact).not.toContainText('00:00',{timeout:15000});
  } finally {await context.close();}
});

test('kompakter Status übernimmt das Budget nach einer bestätigten Maßnahme',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
  await expect(page.locator('#budget')).not.toHaveText('10 000');
  const budget=await page.locator('#budget').textContent();
  await page.locator('#panel-toggle').click();
  await expect(page.locator('#compact-status')).toContainText(`Budget ${budget}`);
});


test('kompakter Status folgt Rundenende und Neustart',async({page})=>{
  test.setTimeout(60000);
  const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
  scenario.parameters.duration=2;
  await page.route('**/scenarios/brigittenau-v1.json.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:gzipSync(Buffer.from(JSON.stringify(scenario)))}));
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('#run').click();
  await page.locator('#panel-toggle').click();
  await expect(page.locator('#result')).toBeVisible({timeout:30000});
  const compact=page.locator('#compact-status');
  await expect(compact).toContainText('Beendet');
  await expect(compact).toContainText('00:02');
  await page.getByRole('button',{name:'Neue Runde'}).click();
  await expect(page.locator('#result')).toBeHidden();
  await expect(compact).toContainText('00:00');
  await expect(compact).toContainText('Vorbereitung');
  await expect(compact).toContainText('Budget 10');
});

test('kompakter Status zeigt Pause und Fortsetzen',async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('#run').click();
  await expect(page.locator('#state')).toHaveText('Läuft');
  await page.locator('#panel-toggle').click();
  await expect(page.locator('#compact-status')).toContainText('Läuft');
  await page.locator('#panel-toggle').click();
  await page.getByRole('button',{name:'Pause'}).click();
  await expect(page.locator('#state')).toHaveText('Pausiert');
  const paused=await page.locator('#time').textContent();
  await page.locator('#panel-toggle').click();
  const compact=page.locator('#compact-status');
  await expect(compact).toContainText('Pausiert');
  await expect(compact).toContainText(paused!);
  await page.waitForTimeout(1000);
  await expect(compact).toContainText(paused!);
  await page.locator('#panel-toggle').click();
  await page.getByRole('button',{name:'Fortsetzen'}).click();
  await expect(page.locator('#state')).toHaveText('Läuft');
  await page.locator('#panel-toggle').click();
  await expect(compact).toContainText('Läuft');
});
