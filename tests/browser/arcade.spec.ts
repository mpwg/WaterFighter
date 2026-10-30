import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { platform, release, arch } from 'node:os';
import type { Command, GameState } from '../../src/core/types';

declare global { interface Window { __waterfighter: { state: GameState; advance(seconds: number): void; command(command: Command): boolean; project(kind: 'slot'|'house', id: string): {x:number;y:number} } } }
const snapshot=(page:Page)=>page.evaluate(()=>structuredClone(window.__waterfighter.state));
const advance=(page:Page,seconds:number)=>page.evaluate(s=>window.__waterfighter.advance(s),seconds);
async function select(page:Page,kind:'slot'|'house',id:string){const p=await page.evaluate(({kind,id})=>window.__waterfighter.project(kind,id),{kind,id});await page.mouse.click(p.x,p.y);}
async function begin(page:Page){await page.goto('/?test=1');await page.getByTestId('start').click();}

test('Mausbau, sichtbare Reichweite, Ausbau, Pause und Neustart',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await begin(page);await select(page,'slot','danube-1');await expect(page.getByTestId('build-pump')).toBeVisible();
 await page.getByTestId('build-pump').click();expect((await snapshot(page)).devices[0].kind).toBe('pump');
 await advance(page,9);await page.getByTestId('upgrade').click();expect((await snapshot(page)).devices[0].level).toBe(2);await expect(page.getByTestId('upgrade')).toBeDisabled();
 await page.getByTestId('pause').click();const frozen=await snapshot(page);await advance(page,20);expect((await snapshot(page)).time).toBe(frozen.time);
 await expect(page.getByTestId('ability-cushion')).toBeDisabled();await expect(page.getByTestId('ability-boat')).toBeDisabled();
 expect(await page.evaluate(()=>window.__waterfighter.command({type:'build',slotId:'danube-2',kind:'freeze'}))).toBe(false);
 await page.getByTestId('resume').click();await page.getByTestId('shake').click();await expect(page.getByTestId('shake')).toHaveAttribute('aria-pressed','false');
 await page.getByTestId('sound').click();await expect(page.getByTestId('sound')).toHaveAttribute('aria-pressed','false');
 await page.getByTestId('restart').click();const reset=await snapshot(page);expect(reset.phase).toBe('ready');expect(reset.devices).toHaveLength(0);expect(reset.time).toBe(0);expect(reset.energy).toBe(100);expect(reset.cooldowns).toEqual({boat:0,cushion:0});expect(errors).toEqual([]);
});

test('Durchbruch, Luftkissen und Rettungsboot durch echte Hausauswahl',async({page})=>{
 await begin(page);await advance(page,13.5);await select(page,'house','danube-house-1');await expect(page.locator('#selection')).toContainText('Nächster Schaden');
 await page.screenshot({path:'docs/arcade-durchbruch.png'});
 await page.getByTestId('ability-cushion').click();let s=await snapshot(page);expect(s.houses[0].shieldUntil).toBeGreaterThan(s.time+5.5);await expect(page.locator('#selection')).toContainText('Geschützt');await expect(page.locator('[data-house="danube-house-1"]')).toContainText('Schutz');
 await advance(page,7);await select(page,'house','danube-house-2');expect((await snapshot(page)).houses[1].threatened).toBe(true);await page.getByTestId('ability-boat').click();
 expect((await snapshot(page)).houses[1].evacuationAt).not.toBeNull();await page.screenshot({path:'docs/arcade-rettung.png'});await advance(page,2.1);expect((await snapshot(page)).houses[1].evacuated).toBe(true);await expect(page.locator('#selection')).toContainText('evakuiert');
 await advance(page,160);s=await snapshot(page);expect(s.houses[1].health).toBe(0);expect(s.houses[1].evacuated).toBe(true);expect(s.safeResidents).toBeGreaterThanOrEqual(4);
});

test('Komplette kombinierte Runde mit sechs über die Maus gebauten Geräten',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await begin(page);
 const plan=[['danube-1','pump'],['danube-2','freeze'],['danube-3','cannon'],['wien-1','pump'],['wien-2','freeze'],['wien-3','cannon']] as const;
 for(const [id,kind] of plan){while((await snapshot(page)).energy<50)await advance(page,1);await select(page,'slot',id);await page.getByTestId('build-'+kind).click();}
 expect((await snapshot(page)).devices).toHaveLength(6);await advance(page,25);await page.screenshot({path:'docs/arcade-kombination.png'});
 await advance(page,180);const end=await snapshot(page);expect(end.phase).toBe('won');expect(end.safeResidents).toBeGreaterThanOrEqual(12);expect(end.completedWaves).toHaveLength(5);expect(end.time).toBeLessThanOrEqual(180);await expect(page.getByTestId('again')).toBeVisible();await page.screenshot({path:'docs/arcade-ergebnis.png'});expect(errors).toEqual([]);
});

test('Synthetisches visibilitychange pausiert und verlangt manuelles Fortsetzen',async({page})=>{
 await begin(page);
 // This deliberately tests the handler, not a native browser tab transition.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 expect((await snapshot(page)).phase).toBe('paused');const time=(await snapshot(page)).time;await advance(page,10);expect((await snapshot(page)).time).toBe(time);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});expect((await snapshot(page)).phase).toBe('paused');await page.getByTestId('resume').click();expect((await snapshot(page)).phase).toBe('running');
});

test('Startansicht passt auf einen üblichen Desktop und lädt ausschließlich lokale Ressourcen',async({page})=>{
 await page.setViewportSize({width:1280,height:800});const remote:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4187')&&!r.url().startsWith('data:'))remote.push(r.url());});await page.goto('/?test=1');await expect(page.getByTestId('start')).toBeVisible();await page.screenshot({path:'docs/arcade-start.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(remote).toEqual([]);
 await page.getByTestId('start').click();await expect(page.getByTestId('pause')).toBeInViewport();await expect(page.getByTestId('restart')).toBeInViewport();await page.screenshot({path:'docs/arcade-desktop-1280.png'});
 await page.setViewportSize({width:1366,height:768});await expect(page.getByTestId('pause')).toBeInViewport();await expect(page.getByTestId('restart')).toBeInViewport();
});


test('Echte RAF-Zeit bis zur ersten Hausbedrohung ohne Vorspulen',async({page,browser})=>{
 await page.goto('/?test=1');
 await page.evaluate(()=>{const frames:number[]=[];let last=performance.now();Object.assign(window,{__frameProbe:frames});const sample=(t:number)=>{frames.push(t-last);last=t;requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 const wallStart=Date.now();await page.getByTestId('start').click();await page.waitForFunction(()=>window.__waterfighter.state.time>=14,{},{timeout:25_000});const wallSeconds=(Date.now()-wallStart)/1000;
 const state=await snapshot(page);expect(state.floods.length).toBeGreaterThan(0);expect(state.houses[0].threatened).toBe(true);expect(state.time/wallSeconds).toBeGreaterThan(.75);expect(state.time/wallSeconds).toBeLessThan(1.25);
 const timing=await page.evaluate(()=>{const frames=(window as unknown as {__frameProbe:number[]}).__frameProbe.filter(n=>n>0).slice(2);const sorted=[...frames].sort((a,b)=>a-b);return{frames:frames.length,meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1)};});
 await page.screenshot({path:'docs/arcade-echtzeit.png'});await writeFile('docs/browser-evidence.json',JSON.stringify({date:new Date().toISOString(),browser:browser.version(),platform:platform(),release:release(),arch:arch(),viewport:{width:1440,height:960},mode:'Playwright Chromium headless; genuine WebGL and requestAnimationFrame; production build on exclusive port4187',wallSeconds,simulationSeconds:state.time,threatenedHouse:state.houses[0].id,timing,completeRound:'Other test: accelerated using core.advance; six devices built with actual mouse clicks',visibility:'Synthetic document.hidden + visibilitychange event; no native tab-transition acceptance'},null,2)+'\n');
});
