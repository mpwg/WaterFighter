/** Compare water snapshot update cost with and without refreshed mesh bounds.
 * Development-only microbenchmark: disabling bounds refresh makes water picking incorrect.
 */
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: process.env.WATERFIGHTER_CHROME || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
try {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nexport { world, worker };\n` });
  });
  await page.goto(process.env.WATERFIGHTER_URL ?? 'http://127.0.0.1:5199/');
  await page.waitForFunction(() => !document.querySelector('#run').disabled);
  const result = await page.evaluate(async () => {
    const { world, worker } = await import(document.querySelector('script[src*="/src/main.ts"]').src);
    worker.terminate();
    const depth = Float32Array.from(world.scenario.initialDepth, (v, i) => v + (i % 17) / 100);
    const update = world.water.updateVerticesData;
    const results = { refreshed: [], unchanged: [] };
    // Alternating blocks and warm-up reduce ordering and JIT effects; rendering and worker cost are excluded.
    for (let block = 0; block < 12; block++) {
      for (const enabled of block % 2 ? [false, true] : [true, false]) {
        world.water.updateVerticesData = function (kind, data, updateExtends) {
          return update.call(this, kind, data, kind === 'position' ? enabled : updateExtends);
        };
        for (let i = 0; i < 30; i++) {
          const start = performance.now();
          world.updateWater(depth);
          const elapsed = performance.now() - start;
          if (block >= 2) results[enabled ? 'refreshed' : 'unchanged'].push(elapsed);
        }
      }
    }
    world.water.updateVerticesData = update;
    const summarize = values => {
      values.sort((a, b) => a - b);
      return { samples: values.length, medianMs: values[Math.floor(values.length / 2)], p95Ms: values[Math.floor(values.length * 0.95)] };
    };
    return { grid: world.scenario.grid, refreshed: summarize(results.refreshed), unchanged: summarize(results.unchanged), userAgent: navigator.userAgent };
  });
  console.log(JSON.stringify({ browser: browser.version(), ...result }, null, 2));
} finally {
  await browser.close();
}
