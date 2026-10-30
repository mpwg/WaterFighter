# Combined final review fixes

Scope: both findings in `final-review.md`, one combined implementation wave. Simulation, worker protocol, terrain, hydraulic parameters and accounting are unchanged.

## Changes

- P2: `src/rescue-ui.ts` derives per-house idle/active/completed state, progress and remaining seconds exclusively from the latest worker snapshot. No client rescue clock is introduced. Active houses show a compact amber rest-time/progress badge above the roof; completed houses show a green check and “Gerettet”; idle houses have no visible badge. Scene render frames project the existing world anchor through the current camera, so markers follow camera movement without covering the architecture. Rebuild/dispose removes marker elements, and markers never intercept picking.
- House clicks await command acknowledgement before announcing current rescue state. Repeat completed selection says the residents are already rescued. Paused clicks report either a paused existing rescue or the need to resume before starting; they issue no rescue command. Aggregate rescue status also says paused instead of claiming work is running.
- Contrary to the implementation dispatch note, `commandGame` currently accepts a rescue while paused: its only general phase rejection is finished. The user-facing guard is therefore explicit and verified by actual clicks; core behavior was deliberately left unchanged within this UI/copy scope. Pending rescue command order remains worker-owned.
- P3: neutral result heading “Die Hochwasserrunde ist beendet.” and factual rescued/safe/damaged totals replace unconditional intervention claims.
- README/status describe markers and the refreshed evidence. Added a meaningful snapshot-state helper unit test and an actual Chrome click test covering active progress, paused active/idle selection, resume, completion, repeat selection, and simultaneous completed/active markers.

## Verification

Working directory `/home/mat/code/WaterFighter`. Bun available via `PATH=/home/mat/.bun/bin:$PATH`.

1. `PATH=/home/mat/.bun/bin:$PATH bun run test tests/rescue-ui.test.ts` — passed, 1 test. Covers idle, snapshot-only elapsed progress, paused feedback, completed building truth, and already-rescued copy.
2. `PATH=/home/mat/.bun/bin:$PATH bun run build` — passed TypeScript and Vite production build. Existing large-chunk advisory remains (main bundle about 6.3 MB / 1.39 MB gzip).
3. `PATH=/home/mat/.bun/bin:$PATH FONTCONFIG_FILE=/tmp/waterfighter-fonts/fonts.conf LD_LIBRARY_PATH=/tmp/waterfighter-libs/root/usr/lib/x86_64-linux-gnu WATERFIGHTER_CHROME=/home/mat/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome WATERFIGHTER_SOFTWARE_GPU=1 bun --bun playwright test --grep 'house markers|high-quality frozen'` — production preview exclusively on 4187, escalated execution. Initial result: high-quality test passed (33.2 s); rescue test failed at immediate post-resume click because test did not await the worker phase change. UI correctly still treated this as paused. Fixed test synchronization by explicitly polling paused/running snapshots.
4. `PATH=/home/mat/.bun/bin:$PATH FONTCONFIG_FILE=/tmp/waterfighter-fonts/fonts.conf LD_LIBRARY_PATH=/tmp/waterfighter-libs/root/usr/lib/x86_64-linux-gnu WATERFIGHTER_CHROME=/home/mat/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome WATERFIGHTER_SOFTWARE_GPU=1 bun --bun playwright test --grep 'house markers'` — passed (1 test, 7.5 s total / 6.5 s test), no page errors or external requests. Exercises actual toolbar/house/pause clicks, snapshot progress, rejected-by-UI paused start, frozen rescue timers, completed check state, repeat message, unchanged rescued total and no duplicate job.
5. `PATH=/home/mat/.bun/bin:$PATH bun run test` — passed all 32 tests across 5 files in 26.56 s. One full core suite run after code changes.
6. `git diff --check` — passed.

## Evidence and limits

Refreshed `docs/tulln-high-start.png`, `docs/tulln-high-crest.png`, `docs/tulln-high-end.png`, and `docs/high-quality-evidence.json` through the existing frozen-round production-browser test. Explicit result assertions verify neutral heading and exact factual no-action totals: 0 rescued, 98 safe at home, 7 damaged houses. Viewed the final PNG: neutral copy renders clearly.

Added and viewed `docs/tulln-rescue-markers.png`: two completed houses and one active house with remaining seconds/progress, roofs visible, repeat-selection feedback accurate. This screenshot uses low quality as the focused functional browser test does.

The earlier real-time `docs/browser-evidence.json` and `docs/tulln-start.png`, `tulln-crest.png`, `tulln-end.png` are untouched. No new 360-second wall-clock run was claimed or performed; status explains that its old result screenshot retains the old copy. New high-quality evidence uses accelerated/frozen test control, not elapsed real-time acceptance.

Ubuntu headless Chrome 156 with Google SwiftShader is functional software-rendering evidence only. Safari, physical GPU performance and independent human acceptance remain open. No new hydraulic benefit is claimed.
