# Task 4 — Chrome acceptance and documentation

Replaced obsolete V3 browser scenarios with production WebGPU acceptance on exclusive port 4187. Normal startup hides the test API; actual canvas gestures cover curved barriers, reverse overlap, Escape cancellation, paused resource reservation, queued removal refund and picking after camera pan/zoom. Tests also cover house/gate clicks, parallel six-second rescues, idempotency, accelerated completion, result/restart and a separate mandatory full 360-second real-time round.

README/status now describe six-minute automatic startup, current controls, worker ownership, WebGPU and local compiler/font assets. Removed outdated V3 preparation and HQ100 claims from current documentation. The landscape is explicitly a stylized approximation, not surveyed Tulln; regular house grid and simplistic roads remain aesthetic limitations.

`tools/compare-strategies.ts` runs three identical full-grid forcings with no rescues. Actual accepted18-edge dry barrier costs36. Final wet cells / mean damage: no-action24198/.0975162; barrier23999/.0914444; gate23586/.0862523. All retain7damaged houses and peak house depth≈.6689m. Differences are model-limited, with no claimed real-world protection. Maximum measured absolute balance error1.274e-7m³. Initial experimental y68 barrier was correctly rejected because wet; final script throws on rejection and uses y72. Raw JSON and narrative saved.

Verification completed so far: production TypeScript/Vite build passed; `bun run test`4files31tests passed27.50s; subsequent typecheck and diff check passed. Main bundle warning approximately6.3MB minified/1.39MBgzip remains.

Environment: headless Chrome executable `/home/mat/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`, Ubuntu x86_64,1440×960. Vulkan SwiftShader flags, temporary fontconfig and shared libraries per Task3 report. Actual Google SwiftShader is software, not hardware performance acceptance. Safari was not installed or tested. No physical devices or human playtest evidence.

Browser execution and final evidence are appended after the mandatory real-time run.

## Mandatory real-time round completed

Dedicated Playwright run `--grep 'complete 360'`:1/1passed,6.2minutes. Chrome156.0.8078.4. No `advance` or benchmark calls in this test: worker clock ran naturally throughout. Final polling sample364.859seconds wall /exact360simulation; total recorded wall365.958seconds includes final screenshot and diagnostics. Samples every≈10seconds show uninterrupted progress, e.g.182.099wall/182.333sim and324.178wall/324.4sim. Final state matches deterministic no-action strategy:24198wet cells,mean damage.09751621886313244. Zero page errors.

1440×960 screenshots `docs/tulln-start.png`, `docs/tulln-crest.png`, `docs/tulln-end.png`; low quality internal render822×548 to keep software renderer responsive. Start and crest visually inspected: river is visible initially; at182seconds actual flood crosses the bank into first house row/roads. Jagged software/low-quality edges remain visible. Diagnostics confirm google/swiftshader,WebGPU,maxTextureDimension2D8192,maxBufferSize268435456. This demonstrates functional software rendering and a full real-time simulation, not hardware graphics performance or Safari.

## Final functional and visual acceptance

Final `playwright test --grep-invert 'complete 360' --reporter=line`:4/4passed1.2minutes. Together with the separately passed real-time test:5/5current browser scenarios. Normal startup API absence; actual curved mouse-draw; reversed overlap without extra cost; Escape/native pointercancel/offterrain release cancellation; invalid coordinates rejection; paused frozen time and queued material reservation; complete queued refund; transformed camera picking; built-line50%refund; actual house clicks with two parallel rescues before/after6s and idempotency; raised gate actual canvas click; exact360accelerated result and restart; high-quality visuals all passed. Current functional paths assert no page errors or external requests.

Initial test iterations exposed test assumptions: hidden intro in test mode, elevated open gate versus ground projection, float-rounded drag neighboring edges, and asynchronous reset/quality actions. Final tests wait/poll for worker-applied state, remove actual snapshot edges for exact refund accounting, and click the gate's raised visible position. No product-code modifications were needed. High-quality capture waits until loading overlay is hidden and quality button enabled.

High-quality1440×960 screenshots `docs/tulln-high-start.png`, `docs/tulln-high-crest.png`, `docs/tulln-high-end.png` were captured and visually inspected. Initial river, actual water over the bank at180s and final result overlay are visible. High diagnostics record1440×960 render target and software adapter. `docs/high-quality-evidence.json` contains final no-action result/accounting and diagnostics. Low-quality real-time evidence remains separately labelled.

Final typecheck and diff-whitespace checks passed. No claims of hardware frame-rate, Safari, real phones or independent human usability. Remaining aesthetic limits include the regular house/road grid and repeating water pattern. Self-review covered frozen versus realtime API separation, browser-only evidence, exact comparison command acceptance, resource rounding/picking boundaries, and documentation consistency. Parent coordinates fresh task and whole-branch reviews before pushing.
