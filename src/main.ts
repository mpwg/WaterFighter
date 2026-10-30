import { rescueFeedback } from "./rescue-ui";
import { LatestThrottle } from "./input";
import { createLandscape } from "./scene";
import type { Quality, ScenePick } from "./scene";
import type { Command, Point, Snapshot, Terrain } from "./flood/types";
import type { Request, Response } from "./protocol";
import "@fontsource-variable/dm-sans";
import "./style.css";
type Tool = "barrier" | "remove" | "rescue" | "gate";
const testing = new URLSearchParams(location.search).get("test") === "1";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<canvas id="landscape" aria-label="Hochwasserlandschaft. Mit der Maus Sandsäcke zeichnen, mit rechter Maustaste die Ansicht verschieben." tabindex="0"></canvas>
<header><div class="brand"><span class="mark">≈</span><div>WATERFIGHTER<small>Tullner Donauauen · ein Hochwasserspiel</small></div></div><div class="stats"><div><small>ZEIT ÜBRIG</small><strong id="time">6:00</strong></div><div><small>SANDSÄCKE</small><strong id="material">900</strong></div><div><small>GERETTET</small><strong id="rescued">0 / 140</strong></div><div><small>ZU HAUSE SICHER</small><strong id="safe">140</strong></div><div><small>BESCHÄDIGTE HÄUSER</small><strong id="damage">0</strong></div></div><button id="pause" aria-label="Spiel pausieren">Ⅱ Pause</button></header>
<div class="intro" id="intro"><span class="eyebrow">DIE DONAU STEIGT</span><h1>Gib dem Dorf ein wenig mehr Zeit.</h1><p>Ziehe Sandsacklinien auf trockenem Boden. Klicke Häuser an, um Menschen zu retten.<br>Die ersten 45 Sekunden sind ruhig. Sieh dich um und schütze, was dir wichtig ist.</p><button id="dismiss">Los geht’s ↗</button></div>
<div class="context" role="status" aria-live="polite"><span id="status">Sandsacklinie ziehen · 2 Sandsäcke je Abschnitt</span><span id="feedback"></span></div>
<nav class="toolbar" aria-label="Hochwasser-Werkzeuge"><div class="tools"><button data-tool="barrier" class="selected" title="Sandsäcke zeichnen (1)">▰ <span>Sandsäcke</span><kbd>1</kbd></button><button data-tool="remove" title="Sandsäcke entfernen (2)">⌫ <span>Entfernen</span><kbd>2</kbd></button><button data-tool="rescue" title="Häuser zur Rettung anklicken (3)">⌂ <span>Retten</span><kbd>3</kbd></button><button data-tool="gate" title="Flussschütz anklicken (4)">≋ <span>Schütz</span><kbd>4</kbd></button></div><span class="divider"></span><button id="overview" title="Ansicht zurücksetzen">⌖ <span>Übersicht</span></button><button id="quality" title="Grafikqualität ändern"></button><button id="restart" title="Runde neu starten">↻</button></nav>
<footer><span>Rechts ziehen: Ansicht · Mausrad: Zoom · Esc: Abbrechen</span><span>Tulln als Vorbild · Modelllandschaft, keine Gefahrenprognose</span></footer>
<div class="overlay" id="loading"><div class="dialog"><span class="eyebrow">DONAU / ÖSTERREICH</span><h2>Die Flusslandschaft entsteht…</h2><p>WebGPU und Hochwassersimulation werden gestartet.</p></div></div>
<div class="overlay" id="failure" hidden><div class="dialog"><span class="eyebrow">LANDSCHAFT NICHT VERFÜGBAR</span><h2>Diese Runde konnte nicht starten.</h2><p id="failure-message"></p><button id="retry">Erneut versuchen</button></div></div>
<div class="overlay" id="result" hidden><div class="dialog"><span class="eyebrow">DAS WASSER GEHT ZURÜCK</span><h2>Die Hochwasserrunde ist beendet.</h2><p id="result-text"></p><button id="again">Noch eine Runde ↗</button></div></div>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("landscape");
let quality: Quality =
  localStorage.getItem("waterfighter-quality") === "low" ? "low" : "high";
let view: ReturnType<typeof createLandscape>,
  terrain: Terrain,
  snapshot: Snapshot,
  tool: Tool = "barrier",
  points: Point[] | undefined;
const previewThrottle = new LatestThrottle<{ path: Point[]; revision: number }>(
  65,
  ({ path, revision }) => preview(path, revision),
);
let sequence = 0,
  previewRevision = 0,
  feedbackTimer: number,
  failed = false;
const pending = new Map<
  number,
  {
    resolve: (r: Response) => void;
    reject: (error: Error) => void;
    timer: number;
  }
>();
const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
function failure(message: string) {
  if (failed) return;
  failed = true;
  previewThrottle.cancel();
  points = undefined;
  $("loading").hidden = true;
  $("failure").hidden = false;
  $("failure-message").textContent = message;
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.reject(new Error(message));
  }
  pending.clear();
  worker.terminate();
  view?.dispose();
}
worker.onerror = (e) =>
  failure(
    `Die Simulation wurde angehalten: ${e.message || "Worker-Fehler"}. Bitte erneut versuchen.`,
  );
window.addEventListener("error", (event) => {
  if (event.error)
    failure(
      `Die Landschaft wurde angehalten: ${event.message}. Bitte erneut versuchen.`,
    );
});
worker.onmessageerror = () =>
  failure(
    "Die Simulation hat unlesbare Daten geliefert. Bitte erneut versuchen.",
  );
worker.onmessage = ({ data: r }: { data: Response }) => {
  if (r.snapshot) {
    snapshot = r.snapshot;
    if (view) {
      view.update(snapshot);
      renderHUD();
    }
    worker.postMessage({ id: 0, type: "ack" });
  }
  const p = pending.get(r.id);
  if (p) {
    clearTimeout(p.timer);
    pending.delete(r.id);
    if (r.type === "error") p.reject(new Error(r.error));
    else p.resolve(r);
  } else if (r.type === "error") failure(r.error ?? "Simulation error");
};
type Outgoing = Request extends infer R
  ? R extends { id: number }
    ? Omit<R, "id">
    : never
  : never;
function request(data: Outgoing): Promise<Response> {
  if (failed) return Promise.reject(new Error("Round unavailable"));
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error("Simulation timed out"));
      failure("Die Simulation antwortet nicht mehr. Bitte erneut versuchen.");
    }, 120000);
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ ...data, id });
  });
}
function userReason(reason?: string) {
  return (
    (
      {
        "Game is paused": "Pause · Rettungen können erst nach dem Fortsetzen starten.",
        "Flood has finished": "Die Hochwasserrunde ist beendet.",
        "Unknown gate": "Dieses Schütz ist nicht bekannt.",
        "Unknown building": "Dieses Haus ist nicht bekannt.",
        "Draw a line inside the map": "Ziehe eine Linie innerhalb der Karte.",
        "Barrier crosses a building, gate, or deep water":
          "Die Linie kreuzt ein Gebäude, das Schütz oder zu tiefes Wasser.",
        "Insufficient sandbags": "Dafür reichen die Sandsäcke nicht.",
      } as Record<string, string>
    )[reason ?? ""] ??
    reason ??
    "Diese Aktion ist gerade nicht möglich."
  );
}
function feedback(message: string) {
  $("feedback").textContent = message;
  clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(
    () => ($("feedback").textContent = ""),
    4500,
  );
}
function cancel() {
  points = undefined;
  previewRevision++;
  previewThrottle.cancel();
  view?.setPreview(undefined);
}
async function command(c: Command) {
  if (c.type === "reset" || c.type === "pause" || c.type === "resume") cancel();
  const r = await request({ type: "command", command: c });
  if (r.result && !r.result.ok) feedback(userReason(r.result.reason));
  return r.result!;
}
function select(next: Tool) {
  cancel();
  tool = next;
  canvas.dataset.tool = tool;
  document
    .querySelectorAll<HTMLButtonElement>("[data-tool]")
    .forEach(
      (b) => (
        b.classList.toggle("selected", b.dataset.tool === tool),
        b.setAttribute("aria-pressed", String(b.dataset.tool === tool))
      ),
    );
  renderHUD();
}
function renderHUD() {
  if (!snapshot) return;
  const left = Math.max(0, Math.ceil(360 - snapshot.time));
  $("time").textContent =
    `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  $("material").textContent = String(snapshot.resources);
  $("rescued").textContent =
    `${snapshot.results.rescued} / ${snapshot.results.totalPeople}`;
  $("safe").textContent = String(snapshot.results.safePeople);
  $("damage").textContent = String(snapshot.results.damagedBuildings);
  $("pause").textContent = snapshot.phase === "paused" ? "▶ Weiter" : "Ⅱ Pause";
  $("pause").setAttribute(
    "aria-label",
    snapshot.phase === "paused" ? "Spiel fortsetzen" : "Spiel pausieren",
  );
  const active = snapshot.rescues.filter((r) => r.status === "active");
  const rescueStatus = active.length
    ? ` · ${active.length} Rettung${active.length === 1 ? "" : "en"} ${snapshot.phase === "paused" ? "pausiert" : "aktiv"} (${Math.max(...active.map((r) => Math.ceil(6 - r.elapsed)))}s)`
    : "";
  const hints: Record<Tool, string> = {
    barrier: "Sandsacklinie ziehen · 2 Sandsäcke je Abschnitt",
    remove: "Über Sandsäcke ziehen · geplant: 100% / begonnen: 50% zurück",
    rescue: "Haus anklicken · Rettungen dauern 6 Sekunden und laufen parallel",
    gate: "Schütz anklicken: Entlastungskanal öffnen oder schließen",
  };
  $("status").textContent =
    (snapshot.phase === "paused"
      ? "Pause · Linien werden geplant, Material ist reserviert. "
      : snapshot.time < 45
        ? `Ruhiger Beginn · ${Math.ceil(45 - snapshot.time)}s zum Vorbereiten. `
        : "") +
    hints[tool] +
    rescueStatus;
  if (snapshot.phase === "finished") {
    $("result-text").textContent =
      `${snapshot.results.rescued} Menschen gerettet, ${snapshot.results.safePeople} zu Hause sicher. ${snapshot.results.damagedBuildings} Häuser beschädigt.`;
    $("result").hidden = false;
  } else $("result").hidden = true;
}
async function preview(path: Point[], revision: number) {
  try {
    const r = await request({
      type: "preview",
      command: { type: tool === "remove" ? "remove" : "barrier", points: path },
    });
    if (revision !== previewRevision || !points) return;
    const result = r.result!;
    view.setPreview({
      points: path,
      valid: result.ok,
      cost: result.cost ?? 0,
      reason: result.ok ? undefined : userReason(result.reason),
    });
    $("feedback").textContent = result.ok
      ? tool === "remove"
        ? `Zurück: ${-(result.cost ?? 0)} Sandsäcke`
        : `${result.cost} Sandsäcke${snapshot.phase === "paused" ? " · nach Loslassen geplant" : ""}`
      : userReason(result.reason);
  } catch (error) {
    failure(
      `Die Landschaft konnte nicht geladen werden. Technischer Hinweis: ${String(error)}`,
    );
  }
}
function pointer(phase: "down" | "move" | "up" | "cancel", pick: ScenePick) {
  if (failed) return;
  if (phase === "cancel") {
    cancel();
    return;
  }
  if ((phase === "down" || phase === "up") && pick.button !== 0) return;
  if (phase === "down") {
    $("intro").hidden = true;
    canvas.focus();
    if (tool === "rescue") {
      if (pick.buildingId !== undefined) {
        const buildingId = pick.buildingId;
        if (snapshot.phase === "paused" || snapshot.phase === "finished") {
          feedback(rescueFeedback(snapshot, buildingId));
        } else {
          void command({ type: "rescue", buildingId }).then((result) => {
            if (result.ok) feedback(rescueFeedback(snapshot, buildingId));
          }).catch((e) => failure(String(e)));
        }
      } else feedback("Klicke ein Haus an, um seine Bewohner zu retten");
      return;
    }
    if (tool === "gate") {
      if (pick.gateId !== undefined) {
        const gate = snapshot.gates.find((g) => g.id === pick.gateId)!;
        void command({ type: "gate", gateId: gate.id, open: !gate.open }).catch(
          (e) => failure(String(e)),
        );
      } else feedback("Klicke das Schütz im Deichkanal an");
      return;
    }
    points = [pick.point];
    previewRevision++;
    return;
  }
  if (!points) return;
  const last = points.at(-1)!;
  if (Math.hypot(last.x - pick.point.x, last.y - pick.point.y) > 0.25)
    points.push(pick.point);
  if (phase === "move") {
    const revision = ++previewRevision,
      path = [...points];
    view.setPreview({
      points: path,
      valid: false,
      cost: 0,
      reason: "Prüfung läuft…",
    });
    $("feedback").textContent = "Linie wird geprüft…";
    previewThrottle.push({ path, revision });
  } else if (phase === "up") {
    const path = [...points],
      action = tool === "remove" ? "remove" : "barrier";
    cancel();
    if (path.length > 1)
      void command({ type: action, points: path })
        .then((r) => {
          if (r.ok)
            feedback(
              action === "remove"
                ? "Sandsäcke entfernt · Material zurückgegeben"
                : snapshot.phase === "paused"
                  ? "Linie geplant · Bau beginnt beim Fortsetzen"
                  : "Sandsacklinie wird gebaut…",
            );
        })
        .catch((e) => failure(String(e)));
  }
}
$("dismiss").onclick = () => ($("intro").hidden = true);
$("pause").onclick = () =>
  void command({
    type: snapshot.phase === "paused" ? "resume" : "pause",
  }).catch((e) => failure(String(e)));
$("overview").onclick = () => view.resetCamera();
$("restart").onclick = $("again").onclick = () =>
  void command({ type: "reset" }).catch((e) => failure(String(e)));
$("retry").onclick = () => location.reload();
document
  .querySelectorAll<HTMLButtonElement>("[data-tool]")
  .forEach((b) => (b.onclick = () => select(b.dataset.tool as Tool)));
function qualityLabel() {
  $("quality").textContent = quality === "high" ? "◐ Hoch" : "◐ Niedrig";
}
qualityLabel();
$("quality").onclick = async () => {
  cancel();
  quality = quality === "high" ? "low" : "high";
  localStorage.setItem("waterfighter-quality", quality);
  qualityLabel();
  await rebuild();
};
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cancel();
  const next = (
    { 1: "barrier", 2: "remove", 3: "rescue", 4: "gate" } as Record<
      string,
      Tool
    >
  )[e.key];
  if (next) select(next);
  if (e.code === "Space" && e.target === canvas) {
    e.preventDefault();
    $("pause").click();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && snapshot?.phase === "running")
    void command({ type: "pause" }).catch((e) => failure(String(e)));
});
async function rebuild() {
  $("loading").hidden = false;
  $<HTMLButtonElement>("quality").disabled = true;
  view?.dispose();
  view = createLandscape(terrain, {
    quality,
    onPointer: pointer,
    onDeviceLost: (message) =>
      failure(`Grafikgerät verloren: ${message}. Bitte erneut versuchen.`),
  });
  try {
    await view.initialize(canvas);
    view.update(snapshot);
    renderHUD();
    $("loading").hidden = true;
    $<HTMLButtonElement>("quality").disabled = false;
  } catch (error) {
    failure(
      `Die Landschaft konnte nicht geladen werden. Technischer Hinweis: ${String(error)}`,
    );
    throw error;
  }
}
let resolveReady!: () => void, rejectReady!: (error: unknown) => void;
const ready = new Promise<void>((resolve, reject) => {
  resolveReady = resolve;
  rejectReady = reject;
});
// Every hook is absent in normal play. Worker responses are awaited before returning state.
if (testing)
  Object.assign(window, {
    __waterfighter: {
      ready,
      benchmark: async () => {
        view.setRendering(false);
        try {
          return (await request({ type: "benchmark" })).diagnostics;
        } finally {
          view.setRendering(true);
        }
      },
      state: () => structuredClone(snapshot),
      command,
      advance: async (seconds: number) => {
        await request({ type: "advance", seconds });
        return structuredClone(snapshot);
      },
      select,
      project: (point: Point) => view.project(point),
      get terrain() {
        return terrain;
      },
      get buildings() {
        return terrain.buildings;
      },
      diagnostics: async () => ({
        scene: view.diagnostics(),
        worker: (await request({ type: "diagnostics" })).diagnostics,
      }),
      camera: {
        pan: (dx: number, dy: number) => view.pan(dx, dy),
        zoom: (factor: number) => view.zoom(factor),
        reset: () => view.resetCamera(),
      },
    },
  });
void (async () => {
  try {
    const r = await request({
      type: "init",
      test: testing && !new URLSearchParams(location.search).has("realtime"),
    });
    terrain = r.terrain!;
    await rebuild();
    await request({ type: "startclock" });
    if (document.hidden) await command({ type: "pause" });
    select("barrier");
    if (testing) $("intro").hidden = true;
    resolveReady();
  } catch (error) {
    failure(
      `Die Landschaft konnte nicht geladen werden. Technischer Hinweis: ${String(error)}`,
    );
    rejectReady(error);
  }
})();
// Normal play has no consumer for readiness rejection.
void ready.catch(() => {});
