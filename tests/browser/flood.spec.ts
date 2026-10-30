import { test, expect, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import os from 'node:os';

type State = { phase: string; time: number; preparations: unknown[]; gates: { id: string; opening: number; target: number }[]; sites: { id: string; built: boolean; breached: boolean; buildingUntil: number | null }[]; teams: (string | null)[]; events: { type: string; time: number; message: string }[]; result: { safe: number; inNeed: number; damage: number } | null };
const state = (page: Page) => page.evaluate(() => (window as any).__waterfighter.state() as State);
const advance = (page: Page, seconds: number) => page.evaluate(s => (window as any).__waterfighter.advance(s), seconds);
const command = (page: Page, c: unknown) => page.evaluate(c => (window as any).__waterfighter.command(c), c);
const select = (page: Page, kind: string, id: string) => page.evaluate(s => (window as any).__waterfighter.select(s), { kind, id });

async function prepare(page: Page) {
  await page.getByTestId('prepare-d1').click();
  await page.getByRole('button', { name: 'Rückhalt' }).click();
  await page.getByTestId('prepare-b1').click();
  await page.getByRole('button', { name: 'Rettung' }).click();
  await page.getByTestId('prepare-tulln').click();
  expect((await state(page)).preparations).toHaveLength(3);
  await page.getByTestId('start').click();
  expect((await state(page)).phase).toBe('running');
}
async function clickMap(page: Page, x: number, y: number) {
  const box = await page.getByTestId('arena').boundingBox();
  if (!box) throw new Error('Canvas hat keine sichtbare Bounding Box');
  const scale = Math.min(box.width / 1000, box.height / 680);
  await page.mouse.click(box.x + (box.width - 1000 * scale) / 2 + x * scale, box.y + (box.height - 680 * scale) / 2 + y * scale);
}
let errors: string[] = [];
let external: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = []; external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4187/') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url()); });
});
test.afterEach(() => { expect(errors).toEqual([]); expect(external).toEqual([]); });

test('normaler Start verbirgt die Test-API und lädt nur lokale Assets', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Die Donau kommt/ })).toBeVisible();
  expect(await page.evaluate(() => '__waterfighter' in window)).toBe(false);
  await expect(page.getByTestId('start')).toBeDisabled();
});

test('Vorbereitung, Canvas-Auswahl, Wehr, Notdamm, Teams, Pause und Neustart', async ({ page }) => {
  await page.goto('/?test=1');
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByTestId('start')).toBeDisabled();
  await page.getByTestId('prepare-d1').click();
  await page.getByTestId('prepare-d1').click();
  expect((await state(page)).preparations).toHaveLength(0);
  await prepare(page);
  await clickMap(page, 247, 218); // reale Canvas-Mausposition, inklusive Letterbox-Transformation
  await expect(page.getByTestId('gate-g1-2')).toBeVisible();
  await page.getByTestId('gate-g1-2').click();
  expect((await state(page)).gates.find(g => g.id === 'g1')?.target).toBe(1);
  await advance(page, 1.3);
  expect((await state(page)).gates.find(g => g.id === 'g1')?.opening).toBe(1);
  await page.getByTestId('select-d2').click();
  await page.getByTestId('build-d2').click();
  expect((await state(page)).sites.find(s => s.id === 'd2')?.buildingUntil).not.toBeNull();
  await advance(page, 3.1);
  expect((await state(page)).sites.find(s => s.id === 'd2')?.built).toBe(true);
  await page.getByTestId('select-tulln').click();
  await page.getByTestId('team-1').click();
  expect((await state(page)).teams[0]).toBe('tulln');
  await page.getByTestId('select-korneuburg').click();
  await page.getByTestId('team-1').click();
  expect((await state(page)).teams[0]).toBe('korneuburg');
  await page.getByTestId('team-2').click();
  expect((await state(page)).teams[1]).toBe('korneuburg');
  await page.getByTestId('pause').click();
  const paused = await state(page);
  await expect(page.getByTestId('select-g2')).toBeDisabled();
  await clickMap(page, 247, 218);
  await expect(page.getByTestId('team-1')).toBeDisabled();
  await select(page, 'gate', 'g2');
  await expect(page.getByTestId('team-1')).toBeVisible(); // Auswahl unverändert
  expect(await command(page, { type: 'gate', id: 'g2', opening: 1 })).toBe(false);
  await advance(page, 5);
  expect((await state(page)).time).toBe(paused.time);
  await page.getByTestId('pause').click();
  expect((await state(page)).phase).toBe('running');
  await page.getByTestId('reset').click();
  const reset = await state(page);
  expect(reset.phase).toBe('ready'); expect(reset.time).toBe(0);
  expect(reset.preparations).toHaveLength(0);
  expect(reset.teams).toEqual([null, null]);
  await expect(page.getByTestId('start')).toBeDisabled();
});

test('Dammöffnung: Abbruchwege und bestätigtes Halten', async ({ page }) => {
  await page.goto('/?test=1'); await prepare(page);
  await page.getByTestId('select-d3').click();
  const button = page.getByTestId('breach-d3');
  await button.click({ button: 'right' });
  await page.waitForTimeout(950);
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  const box = await button.boundingBox(); if (!box) throw new Error('Hold-Button nicht sichtbar');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(250); await page.mouse.up();
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  await button.focus(); await page.keyboard.down('Space'); await page.waitForTimeout(200); await page.keyboard.up('Space');
  await button.focus(); await page.keyboard.down('Enter'); await page.waitForTimeout(200); await page.keyboard.up('Enter');
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  await button.focus(); await page.keyboard.down('Space'); await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await page.waitForTimeout(950); await page.keyboard.up('Space');
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.evaluate(() => window.dispatchEvent(new Event('pointercancel'))); await page.waitForTimeout(950); await page.mouse.up();
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x - 20, box.y - 20); await page.waitForTimeout(950); await page.mouse.up();
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  await button.focus(); await page.keyboard.down('Space'); await select(page, 'site', 'd4'); await page.waitForTimeout(950); await page.keyboard.up('Space');
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  await page.getByTestId('select-d3').click();
  await button.focus(); await page.keyboard.down('Space'); await page.getByTestId('pause').click(); await page.waitForTimeout(950); await page.keyboard.up('Space');
  expect((await state(page)).sites.find(s => s.id === 'd3')?.breached).toBe(false);
  await page.getByTestId('pause').click();
  await button.focus(); await page.keyboard.down('Space'); await expect.poll(async () => (await state(page)).sites.find(s => s.id === 'd3')?.breached, { timeout: 3000 }).toBe(true); await page.keyboard.up('Space');
  await expect(button).toBeDisabled();
  await page.getByTestId('reset').click(); await prepare(page);
  await page.getByTestId('select-d4').click();
  const pointerButton = page.getByTestId('breach-d4');
  await pointerButton.scrollIntoViewIfNeeded();
  const pointerBox = await pointerButton.boundingBox(); if (!pointerBox) throw new Error('Maus-Hold-Button nicht sichtbar');
  await page.mouse.move(pointerBox.x + pointerBox.width / 2, pointerBox.y + pointerBox.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await state(page)).sites.find(s => s.id === 'd4')?.breached, { timeout: 3000 }).toBe(true);
  await page.mouse.up();
});

test('Warnung verdrängt ungültigen Wehrbefehl bei 70 s; Fehler läuft nach 3 s ab', async ({ page }) => {
  await page.goto('/?test=1'); await prepare(page);
  await advance(page, 69.7);
  expect(await command(page, { type: 'gate', id: 'unbekannt', opening: 1 })).toBe(false);
  await expect(page.getByTestId('latest-warning')).toContainText('Unbekanntes Wehr');
  await advance(page, 0.5);
  await expect(page.getByTestId('latest-warning')).toContainText('Zweite Flutspitze');
  expect(await command(page, { type: 'gate', id: 'unbekannt', opening: 1 })).toBe(false);
  await advance(page, 3.1);
  await expect(page.getByTestId('latest-warning')).toContainText('Zweite Flutspitze');
});

test('echte RAF-Zeit, Kartenansicht und natürlicher Tabwechselversuch', async ({ page, context, browser }) => {
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto('/?test=1');
  await expect(page.getByTestId('arena')).toBeInViewport({ ratio: 1 });
  await expect(page.getByTestId('pause')).toBeInViewport(); await expect(page.getByTestId('reset')).toBeInViewport();
  await page.screenshot({ path: 'docs/v3-start.png', fullPage: true });
  await prepare(page);
  const start = Date.now(); await page.waitForTimeout(15_000); const elapsed = (Date.now() - start) / 1000;
  const after = await state(page);
  expect(after.time).toBeGreaterThan(12);
  expect(after.time).toBeLessThan(elapsed + 1);
  expect(after.phase).toBe('running');
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(page.getByTestId('arena')).toBeInViewport({ ratio: 1 }); await expect(page.getByTestId('pause')).toBeInViewport();
  await page.locator('#sidebar').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: 'docs/v3-echtzeit.png', fullPage: true });
  await advance(page, 90);
  await page.screenshot({ path: 'docs/v3-flut.png', fullPage: true });
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront(); await page.waitForTimeout(400);
  const hiddenOnSwitch = await page.evaluate(() => document.hidden);
  const phaseOnSwitch = (await state(page)).phase;
  await page.bringToFront(); await other.close();
  writeFileSync('docs/browser-evidence.json', JSON.stringify({ date: new Date().toISOString(), browser: browser.version(), platform: `${os.platform()} ${os.release()} ${os.arch()}`, viewportStart: '1280x800', viewportFlood: '1440x960', rafWallSeconds: elapsed, rafSimSeconds: after.time, naturalTabSwitch: { hidden: hiddenOnSwitch, phase: phaseOnSwitch }, screenshots: ['docs/v3-start.png', 'docs/v3-echtzeit.png', 'docs/v3-flut.png', 'docs/v3-ergebnis.png'], floodScreenshotAdditionalAdvanceSeconds: 90, pageErrors: errors, externalRequests: external }, null, 2) + '\n');
});

test('vollständige beschleunigte HQ100-Runde und Ergebnis', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 }); await page.goto('/?test=1'); await prepare(page);
  await page.getByTestId('select-g1').click(); await page.getByTestId('gate-g1-2').click();
  await page.getByTestId('select-tulln').click(); await page.getByTestId('team-1').click();
  await advance(page, 180);
  const end = await state(page);
  expect(end.phase).toBe('finished'); expect(end.result).not.toBeNull();
  expect(end.result!.safe + end.result!.inNeed).toBe(610);
  await expect(page.getByText('Die Bilanz.')).toBeVisible();
  await expect(page.getByText('NOCH IN NOT')).toBeVisible();
  await expect(page.getByTestId('arena')).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'docs/v3-ergebnis.png', fullPage: true });
  await page.getByTestId('again').click();
  expect((await state(page)).phase).toBe('ready');
});
