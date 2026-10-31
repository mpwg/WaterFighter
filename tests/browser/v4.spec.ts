import { test, expect, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const bridge = (page: Page, method: string, argument?: unknown) => page.evaluate(async ({method, argument}) => (window as any).__WF_V4__[method](argument), {method, argument});
const state = async (page: Page) => {
  const s = await bridge(page, 'state');
  return { phase:s.phase,time:s.time,points:s.points,floodDamage:s.floodDamage,demolitionDamage:s.demolitionDamage,barrierCharges:s.barrierCharges,demolitionCharges:s.demolitionCharges,barriers:s.barriers,demolished:s.demolished,selectedBuilding:s.selectedBuilding };
};
const target = async (page: Page, kind: 'barriers'|'buildings', id: string) => (await bridge(page,'targets'))[kind].find((t: {id:string}) => t.id === id);
const errorsFor = (page: Page) => { const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));return errors; };

test('V4 mouse actions, confirmation, strict costs, pause, recharge, reset and finished locks', async ({page}) => {
  const errors=errorsFor(page);
  await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();
  await page.click('#start');
  let b=await target(page,'barriers','barrier-14');
  await page.mouse.click(b.x,b.y);
  await expect.poll(async()=>(await state(page)).barriers).toEqual(['barrier-14']);
  expect((await state(page)).barrierCharges).toBe(2);
  await page.mouse.click(b.x,b.y);
  await expect.poll(async()=>(await state(page)).barriers).toEqual([]);
  expect((await state(page)).barrierCharges).toBe(2);
  await page.click('#demolition-tool');
  const house=await target(page,'buildings','geb-5354281');
  await page.mouse.click(house.x,house.y);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect((await state(page)).demolished).toEqual([]);
  expect((await state(page)).selectedBuilding).toBe(house.id);
  await expect(page.locator('#cost')).toHaveText('−'+house.cost.toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2}));
  const before=await state(page);
  await page.locator('#confirm').dblclick();
  await expect.poll(async()=>(await state(page)).demolished).toEqual([house.id]);
  const after=await state(page);
  expect(after.points).toBe(before.points-house.cost);
  expect(after.demolitionDamage).toBe(house.cost);
  expect(after.demolitionCharges).toBe(1);
  await bridge(page,'command',{type:'demolish',buildingId:house.id});
  expect(await state(page)).toEqual(after);
  await page.click('#barrier-tool');await page.mouse.click(b.x,b.y);
  await expect.poll(async()=>(await state(page)).barriers).toEqual(['barrier-14']);
  await page.click('#demolition-tool');
  const pendingHouse=(await bridge(page,'targets')).buildings.find((h:any)=>!h.demolished);
  await page.mouse.click(pendingHouse.x,pendingHouse.y);await expect(page.locator('#confirm')).toBeEnabled();
  await page.click('#pause');await expect(page.locator('#resume')).toBeVisible();
  await expect(page.locator('#confirm')).toHaveCount(0);
  expect((await state(page)).selectedBuilding).toBeNull();
  const paused=await state(page);
  for(const command of [{type:'placeBarrier',segmentId:'barrier-14'},{type:'removeBarrier',segmentId:'barrier-14'},{type:'demolish',buildingId:'geb-5354282'}]) await bridge(page,'command',command);
  await bridge(page,'advance',45);
  expect(await state(page)).toEqual(paused);
  await page.click('#resume');await bridge(page,'advance',15);
  expect((await state(page)).barrierCharges).toBe(2);
  await bridge(page,'advance',30);
  expect((await state(page)).barrierCharges).toBe(3);
  expect((await state(page)).demolitionCharges).toBe(2);
  // A pending confirmation never survives a reset.
  const other=(await bridge(page,'targets')).buildings.find((h:any)=>!h.demolished);
  await page.mouse.click(other.x,other.y);await expect(page.locator('#confirm')).toBeEnabled();
  await page.click('#restart');await expect(page.locator('#start')).toBeVisible();
  expect(await state(page)).toEqual({phase:'ready',time:0,points:100000,floodDamage:0,demolitionDamage:0,barrierCharges:3,demolitionCharges:2,barriers:[],demolished:[],selectedBuilding:null});
  await expect(page.locator('#confirm')).toHaveCount(0);
  await page.click('#start');await bridge(page,'command',{type:'placeBarrier',segmentId:'barrier-14'});await bridge(page,'advance',90);
  await expect(page.locator('#again')).toBeVisible();
  const finished=await state(page);expect(finished.time).toBe(90);
  for(const command of [{type:'placeBarrier',segmentId:'barrier-14'},{type:'removeBarrier',segmentId:'barrier-14'},{type:'demolish',buildingId:house.id},{type:'resume'}]) await bridge(page,'command',command);
  await bridge(page,'advance',90);expect(await state(page)).toEqual(finished);
  await expect(page.locator('#pause')).toBeDisabled();
  await page.click('#again');await expect(page.locator('#start')).toBeVisible();
  expect((await state(page)).points).toBe(100000);
  expect(errors).toEqual([]);
});

for(const viewport of [{width:1440,height:960},{width:1280,height:800}]) test(`V4 whole-map captures ${viewport.width}x${viewport.height}`,async({page})=>{
  const errors=errorsFor(page);await page.setViewportSize(viewport);await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const capture=async(name:string)=>{
    expect(await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}))).toEqual(viewport);
    const canvas=await page.locator('#map').boundingBox();expect(canvas!.x).toBeGreaterThanOrEqual(0);expect(canvas!.y+canvas!.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({path:`docs/v4-${viewport.width}-${name}.png`});
  };
  await capture('initial');await page.click('#start');
  const b=await target(page,'barriers','barrier-14');await page.mouse.click(b.x,b.y);
  await page.click('#demolition-tool');const h=await target(page,'buildings','geb-5354281');await page.mouse.click(h.x,h.y);await expect(page.locator('#confirm')).toBeEnabled();await capture('action');
  await page.click('#confirm');await bridge(page,'advance',65);await page.mouse.move(1,1);await capture('crest');
  await bridge(page,'advance',25);await expect(page.locator('#again')).toBeVisible();await capture('result');expect(errors).toEqual([]);
});

test('V4 normal production URL completes one real wall-clock 90-second round without a bridge', async({page,browserName})=>{
  const errors=errorsFor(page);await page.goto('/');await expect(page.locator('#start')).toBeVisible();
  expect(await page.evaluate(()=>('__WF_V4__' in window))).toBe(false);
  const started=performance.now();await page.click('#start');
  await expect(page.locator('#time')).not.toHaveText('90s',{timeout:4000});
  await expect(page.locator('#again')).toBeVisible({timeout:100000});
  const elapsedMs=performance.now()-started;expect(elapsedMs).toBeGreaterThanOrEqual(89000);expect(elapsedMs).toBeLessThan(100000);
  await expect(page.locator('#time')).toHaveText('0s');await expect(page.locator('#pause')).toBeDisabled();
  expect(await page.evaluate(()=>('__WF_V4__' in window))).toBe(false);expect(errors).toEqual([]);
  const evidence={mode:'normal URL; no bridge or synthetic clock',browserName,browserVersion:page.context().browser()?.version(),elapsedMs,remaining:await page.locator('#time').innerText(),points:await page.locator('#points').innerText(),floodDamage:await page.locator('#flood').innerText(),demolitionDamage:await page.locator('#demolition').innerText(),errors,limits:'Headless Chromium only; no physical device, natural tab switch or human playability evidence'};
  writeFileSync('docs/v4-browser-evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
});
