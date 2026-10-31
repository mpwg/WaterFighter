# Final gate height fix

Replaced the stale closed/open gate Y constants with one `gatePose` calculation based on the actual control-cell height (`terrain.heights[gate.a]`) and `gate.sill`. Initial gate construction and snapshot updates both use this calculation. Closed bounds are exactly base-to-sill; when open, the bottom is at the sill.

Added a focused scene test for the default terrain and a changed sill. It checks the closed bottom/top, open bottom, and that both scene construction and updates call the shared helper.

## Verification

- `PATH=/home/mat/.bun/bin:$PATH bun --bun vitest run tests/scene.test.ts` — passed, 11 tests.
- `PATH=/home/mat/.bun/bin:$PATH bun run build` — passed (`tsc --noEmit` and Vite build). Vite emitted its existing large-chunk advisory.
- Focused actual Chrome browser test, `actual house and gate clicks, parallel six-second idempotent rescue, full round` — passed, 1 test in 27.6 seconds. Ran with the requested `FONTCONFIG_FILE`, `LD_LIBRARY_PATH`, `WATERFIGHTER_CHROME`, and `WATERFIGHTER_SOFTWARE_GPU` environment values.
