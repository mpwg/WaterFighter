import {
  createGame,
  commandGame,
  stepGame,
  snapshotGame,
} from "../src/flood/game";
import { writeFileSync } from "node:fs";
const rows = [];
for (const strategy of ["no-action", "barrier", "gate"]) {
  const g = createGame();
  if (strategy === "gate")
    commandGame(g, {
      type: "gate",
      gateId: 0,
      open: false,
    });
  if (strategy === "barrier") {
    const r = commandGame(g, {
      type: "barrier",
      points: [
        {
          x: 174,
          y: 61,
        },
        {
          x: 185,
          y: 61,
        },
      ],
    });
    if (!r.ok) throw new Error(r.reason);
  }
  const checkpoints = [];
  for (let i = 0; i < 10800; i++) {
    stepGame(g, 1 / 30);
    if ([5400, 10800].includes(i + 1)) {
      const s = snapshotGame(g);
      checkpoints.push({
        time: s.time,
        wetCells: Array.from(s.depths).filter((x) => x > 0.02).length,
        waterVolume: s.accounting.volume,
        meanDamage: s.results.meanDamage,
        damagedBuildings: s.results.damagedBuildings,
        peakHouseDepth: Math.max(...s.buildings.map((b) => b.peakDepth)),
        balanceError: s.accounting.error,
      });
    }
  }
  rows.push({
    strategy,
    resources: g.resources,
    barriers: g.barriers.size,
    checkpoints,
  });
}
writeFileSync(
  "docs/strategy-evidence.json",
  JSON.stringify(
    {
      scenario:
        "organic calibrated 256x192, 2026-10-31; identical initial state and forcing; no rescues",
      rows,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(rows, null, 2));
