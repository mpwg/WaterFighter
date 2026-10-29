import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

test('ein falscher Höhenbezug verhindert den Spielstart', async ({ page }) => {
  const scenario = JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json', 'utf8'));
  scenario.grid.heightReference = 'Adria';
  await page.route('**/scenarios/brigittenau-v1.json.bin', route => route.fulfill({
    status: 200, contentType: 'application/octet-stream', body: gzipSync(Buffer.from(JSON.stringify(scenario))),
  }));
  await page.goto('/');
  await expect(page.locator('#state')).toHaveText('Fehler');
  await expect(page.locator('#message')).toContainText('Ungültiger Höhenbezug; Wiener Null erforderlich.');
  await expect(page.locator('#run')).toBeDisabled();
});
