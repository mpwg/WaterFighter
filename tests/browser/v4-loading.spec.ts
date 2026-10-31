import { test, expect } from "@playwright/test";
test("delayed V4 startup accepts simulated visibility and refreshes a stationary ghost", async ({
  context,
  page,
}) => {
  let releaseFonts!: () => void,
    releaseMap!: () => void,
    resolveFontSeen!: () => void,
    resolveMapSeen!: () => void;
  const fontsGate = new Promise<void>((r) => (releaseFonts = r)),
    mapGate = new Promise<void>((r) => (releaseMap = r)),
    fontSeen = new Promise<void>((r) => (resolveFontSeen = r)),
    mapSeen = new Promise<void>((r) => (resolveMapSeen = r));
  await context.route("**/v4/fonts/**", async (route) => {
    resolveFontSeen();
    await fontsGate;
    await route.continue();
  });
  await context.route("**/v4/map.json", async (route) => {
    resolveMapSeen();
    await mapGate;
    await route.continue();
  });
  await context.addInitScript(() => {
    (window as any).__testHidden = false;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => (window as any).__testHidden,
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/?test=1");
  await fontSeen;
  const visibility = (hidden: boolean) =>
    page.evaluate((hidden) => {
      (window as any).__testHidden = hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await visibility(true);
  await expect(page.locator("#reload")).toHaveCount(0);
  releaseFonts();
  await mapSeen;
  await visibility(false);
  await visibility(true);
  await expect(page.locator("#reload")).toHaveCount(0);
  releaseMap();
  await expect(page.locator("#start")).toBeVisible();
  await visibility(false);
  await page.click("#start");
  await expect(page.locator("#pause")).toBeEnabled();
  expect(
    (await page.evaluate(() => (window as any).__WF_V4__.state())).phase,
  ).toBe("running");
  await visibility(true);
  await expect(page.locator("#resume")).toBeVisible();
  await visibility(false);
  expect(
    (await page.evaluate(() => (window as any).__WF_V4__.state())).phase,
  ).toBe("paused");
  await page.click("#resume");
  await expect(page.locator("#pause")).toBeEnabled();
  for (const segmentId of ["barrier-14", "barrier-122", "barrier-80"])
    await page.evaluate(
      (segmentId) =>
        (window as any).__WF_V4__.command({ type: "placeBarrier", segmentId }),
      segmentId,
    );
  expect(
    (await page.evaluate(() => (window as any).__WF_V4__.state()))
      .barrierCharges,
  ).toBe(0);
  const targets = await page.evaluate(() =>
      (window as any).__WF_V4__.targets(),
    ),
    target = targets.barriers.find(
      (b: { id: string }) => b.id === "barrier-50",
    );
  await page.mouse.move(target.x, target.y);
  await expect(page.locator("#barrier-help")).toContainText(
    "keine Platzierung möglich",
  );
  await page.evaluate(() => (window as any).__WF_V4__.advance(15));
  await expect(page.locator("#barrier-help")).toContainText(
    "Klicken setzt exakt diese Linie",
  );
  expect(errors).toEqual([]);
  console.log(
    "PASS delayed fonts + delayed Worker map + synthetic visibility before/during init; ready usable; running synthetic hidden pauses; visible stays paused/manual resume; stationary ghost invalid→valid after15s recharge; no pageerrors.",
  );
});
