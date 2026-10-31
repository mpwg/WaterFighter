import "./style.css";
import { GameAudio } from "./audio";
import { MapRenderer } from "./render";
import { barrierAllowed, barrierAt, buildingAt, mapPosition } from "./protocol";
import type { Reply, Request } from "./protocol";
import type { ViewState } from "./render";
import type {
  BarrierSegment,
  Building,
  GameCommand,
  GameSnapshot,
  Point,
  V4Map,
} from "./types";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<main class="shell">
  <header class="masthead"><div class="issue">V4 / 90 SEKUNDEN<span>LEOPOLDSTADT · 512 × 512 M</span></div><h1>WIEN GEHT UNTER<span>.</span></h1><div class="edition">EIN VIERTEL.<br>DEINE ENTSCHEIDUNG.</div></header>
  <section class="scoreboard" aria-label="Spielstand"><div class="clock"><span>VERBLEIBEND</span><strong id="time">90<span>s</span></strong></div><div class="score"><span>PUNKTE</span><strong id="points">100.000</strong></div><div class="loss"><span>FLUTSCHADEN</span><strong id="flood">−0</strong></div><div class="loss"><span>ABRISSSCHADEN</span><strong id="demolition">−0</strong></div><div class="session"><button id="pause" disabled>Pause</button><button id="restart" disabled>Neu starten</button><button id="mute" aria-pressed="false" title="Ton ein- oder ausschalten">Ton an</button></div></section>
  <section class="playfield"><div class="map-column"><div class="map-heading"><span><i></i> FIKTIVER DAMMBRUCH · WESTRAND</span><span>AMTLICHE KARTE / N ↑</span></div><div class="map-frame"><canvas id="map" aria-label="Amtliche Karte der Leopoldstadt. Werkzeug wählen und auf ein Ziel klicken."></canvas><div id="loading" class="cover loading"><strong>KARTE WIRD GELADEN</strong><p>Amtliche Straßen, Gebäude und Gelände.</p></div><div id="overlay" class="cover" hidden></div></div><div class="map-key"><span><i class="water-key"></i>Flut & reale Flussrichtung</span><span><i class="barrier-key"></i>Barriere</span><span>2-m-Raster · gesamtes Gebiet</span></div></div>
  <aside class="toolstrip" aria-label="Werkzeuge"><div class="tool-heading">DU LENKST DIE FLUT.</div><p class="tool-intro">Schütze wertvolle Häuser.<br>Schaffe dem Wasser einen Weg.</p><button class="tool active" id="barrier-tool" aria-pressed="true"><span class="shortcut">1</span><span><strong>BARRIERE</strong><small>Straße sperren / öffnen</small></span><b id="barrier-count">3</b></button><div class="recharge" id="barrier-charge">+1 alle 15 s · maximal 3</div><button class="tool" id="demolition-tool" aria-pressed="false"><span class="shortcut">2</span><span><strong>ABRISS</strong><small>Gebäude gezielt entfernen</small></span><b id="demolition-count">2</b></button><div class="recharge" id="demolition-charge">+1 bei 45 s · maximal 2</div>
  <div class="target-panel" id="target"><span class="eyebrow">SO GEHT’S</span><h2>Eine Straße.<br>Ein neuer Weg.</h2><p>Zeige auf eine Straßenquerung. Die Linie markiert die exakte Barriere. Klicken setzt sie, erneut klicken entfernt sie ohne Erstattung.</p></div>
  <div id="notice" role="status" aria-live="polite">Runde starten, dann eingreifen.</div><div class="district-note"><b>FIKTION, KEINE PROGNOSE.</b><p>Schutzviertel im Norden: hohe Spielwerte. Süden: niedrigere Werte. Abriss kostet Restwert + 250 Punkte.</p></div></aside></section>
  <footer><span>Datenquelle: Stadt Wien – data.wien.gv.at · CC BY 4.0</span><span>Dammbruch, Dynamik & Werte: Spielmodell · <a href="https://www.data.wien.gv.at/" target="_blank" rel="noreferrer">Wien OGD ↗</a></span></footer>
</main>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("map"),
  audio = new GameAudio(),
  testMode = new URLSearchParams(location.search).get("test") === "1";
const view: ViewState = {
  hoverBuilding: null,
  selected: null,
  hoverBarrier: null,
  valid: false,
  tool: "barrier",
  blast: null,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
let map: V4Map | null = null,
  snapshot: GameSnapshot | null = null,
  renderer: MapRenderer | null = null,
  busy = false,
  fatal = false,
  requestId = 0,
  overlayPhase = "",
  lastConfirmPointer = -Infinity;
let lastControlPointer = { x: -999, y: -999, at: -Infinity };
document.addEventListener(
  "click",
  (event) => {
    const id = (event.target as Element)?.closest("button")?.id;
    if (id && ["start", "resume", "again", "pause", "restart"].includes(id))
      lastControlPointer = {
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
      };
  },
  true,
);
const pending = new Map<
  number,
  { resolve: (reply: Reply) => void; reject: (error: Error) => void }
>();
const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
function request(
  payload:
    | Omit<Extract<Request, { type: "command" }>, "id">
    | Omit<Extract<Request, { type: "init" }>, "id">
    | Omit<Extract<Request, { type: "advance" }>, "id">
    | { type: "state" | "hidden" },
): Promise<Reply> {
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ ...payload, id });
  });
}
function fail(reason: string) {
  fatal = true;
  busy = false;
  $("loading").hidden = false;
  $("loading").innerHTML =
    '<strong>KARTE NICHT VERFÜGBAR</strong><p></p><button id="reload">Erneut laden</button>';
  $("loading").querySelector("p")!.textContent = reason;
  $("reload").onclick = () => location.reload();
  $("overlay").hidden = true;
  setControls();
  for (const p of pending.values()) p.reject(new Error(reason));
  pending.clear();
}
worker.onerror = (e) => {
  e.preventDefault();
  fail(
    `Worker-Fehler: ${e.message || "Die Simulation konnte nicht gestartet werden."}`,
  );
};
worker.onmessageerror = () =>
  fail("Die Simulation hat eine unlesbare Nachricht gesendet.");
worker.onmessage = (event: MessageEvent<Reply>) => {
  const reply = event.data;
  if (reply.type === "error") {
    fail(reply.reason);
    return;
  }
  if (reply.type === "ready") {
    map = reply.map;
    renderer = new MapRenderer(canvas, map);
    $("loading").hidden = true;
  }
  const previous = snapshot;
  snapshot = reply.snapshot;
  if (previous && snapshot.phase !== previous.phase) {
    view.selected = null;
    view.hoverBarrier = null;
    view.hoverBuilding = null;
  }
  update();
  const p = pending.get(reply.id);
  if (p) {
    pending.delete(reply.id);
    p.resolve(reply);
  }
};
// Local font buffers also work on hosts without an installed system font set.
async function loadTypography() {
  await Promise.all(
    [
      ["V4 Serif", "libre-baskerville.ttf", "400 700"],
      ["V4 Sans", "dm-sans.ttf", "100 1000"],
    ].map(async ([family, file, weight]) => {
      const response = await fetch(`/v4/fonts/${file}`);
      if (!response.ok)
        throw new Error(
          `Schrift konnte nicht geladen werden (${response.status}).`,
        );
      const font = new FontFace(family, await response.arrayBuffer(), {
        weight,
      });
      await font.load();
      document.fonts.add(font);
    }),
  );
}
void loadTypography()
  .then(() => request({ type: "init", test: testMode }))
  .catch((e) => fail(String(e)));

const exactCost = (value: number) =>
  value.toLocaleString("de-AT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const number = (value: number) => Math.round(value).toLocaleString("de-AT");
function loss(value: number) {
  return "−" + number(value);
}
function setControls() {
  const phase = snapshot?.phase,
    live = phase === "running" && !busy && !fatal;
  $<HTMLButtonElement>("pause").disabled =
    busy || fatal || !(phase === "running" || phase === "paused");
  $("pause").textContent = phase === "paused" ? "Fortsetzen" : "Pause";
  $<HTMLButtonElement>("restart").disabled =
    busy || fatal || !snapshot || phase === "ready";
  $<HTMLButtonElement>("barrier-tool").disabled = !snapshot || fatal || busy;
  $<HTMLButtonElement>("demolition-tool").disabled = !snapshot || fatal || busy;
  const confirm = $<HTMLButtonElement>("confirm");
  if (confirm)
    confirm.disabled = !live || !snapshot?.demolitionCharges || !view.selected;
}
function update() {
  if (!snapshot || !map) return;
  $("time").innerHTML = `${Math.ceil(90 - snapshot.time)}<span>s</span>`;
  $("points").textContent = number(snapshot.points);
  $("flood").textContent = loss(snapshot.floodDamage);
  $("demolition").textContent = loss(snapshot.demolitionDamage);
  $("barrier-count").textContent = String(snapshot.barrierCharges);
  $("demolition-count").textContent = String(snapshot.demolitionCharges);
  $("barrier-charge").textContent =
    snapshot.barrierCharges === 3
      ? "Vorrat voll · maximal 3"
      : `+1 in ${Math.ceil(snapshot.nextBarrierIn)} s · maximal 3`;
  $("demolition-charge").textContent =
    snapshot.demolitionCharges === 2
      ? "Vorrat voll · maximal 2"
      : snapshot.nextDemolitionIn === null
        ? "Kein weiterer Nachschub"
        : `+1 in ${Math.ceil(snapshot.nextDemolitionIn)} s`;
  if (view.selected && snapshot.demolished.includes(view.selected.id))
    view.selected = null;
  if (snapshot.phase !== overlayPhase) {
    overlayPhase = snapshot.phase;
    const overlay = $("overlay");
    overlay.hidden = snapshot.phase === "running";
    if (snapshot.phase === "ready")
      overlay.innerHTML =
        '<span class="eyebrow">EINSATZ / 01</span><h2>90 Sekunden.<br>Was bleibt stehen?</h2><p>Die Flut kommt von Westen in die Leopoldstadt.<br>Setze Barrieren auf Straßen oder bestätige den Abriss eines Hauses.<br>Bewahre möglichst viele der 100.000 Punkte.</p><button id="start">Runde starten <span>→</span></button>';
    if (snapshot.phase === "paused")
      overlay.innerHTML =
        '<span class="eyebrow">EINSATZ ANGEHALTEN</span><h2>Die Flut wartet.</h2><p>Die Uhr und alle Werkzeuge sind pausiert.<br>Nach einem Tabwechsel geht es nur mit dir weiter.</p><button id="resume">Fortsetzen →</button>';
    if (snapshot.phase === "finished")
      overlay.innerHTML = `<span class="eyebrow">EINSATZ BEENDET / 90 S</span><h2>${number(snapshot.points)}<small>PUNKTE BEWAHRT</small></h2><p>Flutschaden: ${loss(snapshot.floodDamage)}<br>Abrissschaden: ${loss(snapshot.demolitionDamage)}</p><button id="again">Noch eine Runde →</button>`;
    const start = $("start"),
      resume = $("resume"),
      again = $("again");
    if (start)
      start.onclick = (e) => {
        if (e.detail > 1) return;
        audio.unlock();
        void act({ type: "start" });
      };
    if (resume)
      resume.onclick = (e) => {
        if (e.detail <= 1) void act({ type: "resume" });
      };
    if (again)
      again.onclick = (e) => {
        if (e.detail <= 1) void act({ type: "reset" });
      };
  }
  targetPanel();
  setControls();
}
let targetKey = "";
function targetPanel() {
  if (!snapshot || !map) return;
  const b = view.selected,
    barrier = view.hoverBarrier;
  const key = b
    ? `building:${b.id}`
    : view.tool === "demolition"
      ? "demolition"
      : barrier
        ? `barrier:${barrier.id}:${view.valid}:${snapshot.barriers.includes(barrier.id)}`
        : "barrier";
  if (key !== targetKey) {
    targetKey = key;
    if (b) {
      $("target").innerHTML =
        '<span class="eyebrow">GEBÄUDE AUSGEWÄHLT</span><h2 id="building-name"></h2><p id="building-zone"></p><div class="cost"><span>ABRISSSCHADEN</span><strong id="cost"></strong></div><p>Aktueller Restwert + 250 Punkte. Öffnet exakt die markierten Rasterzellen.</p><button id="confirm">Abriss bestätigen</button><button class="cancel" id="cancel">Auswahl verwerfen</button>';
      $("building-name").textContent = b.name || b.id;
      $("building-zone").textContent =
        b.zone === "protected"
          ? "Nördliches Schutzviertel · hoher Spielwert"
          : "Südliches Viertel · niedriger Spielwert";
      $("confirm").onclick = (event) => {
        if (event.detail > 1 || performance.now() - lastConfirmPointer < 450)
          return;
        lastConfirmPointer = performance.now();
        const selected = view.selected;
        if (!selected) return;
        view.selected = null;
        targetKey = "";
        void act(
          { type: "demolish", buildingId: selected.id },
          "blast",
          selected.center,
        );
      };
      $("cancel").onclick = () => {
        view.selected = null;
        targetKey = "";
        targetPanel();
        setControls();
      };
    } else if (view.tool === "demolition")
      $("target").innerHTML =
        '<span class="eyebrow">WERKZEUG / 02</span><h2>Raum für<br>die Flut.</h2><p>Klicke auf ein Gebäude. Prüfe den aktuellen Punktverlust und bestätige den Abriss. Ein Innenhof ist kein Gebäudeziel.</p>';
    else if (barrier) {
      $("target").innerHTML =
        '<span class="eyebrow">STRASSENQUERUNG</span><h2 id="road-name"></h2><p id="barrier-help"></p>';
      $("road-name").textContent = barrier.road;
      $("barrier-help").textContent = snapshot.barriers.includes(barrier.id)
        ? "Klicken entfernt diese Barriere. Keine Erstattung."
        : view.valid
          ? "Klicken setzt exakt diese Linie. Endliche Höhe: Wasser kann sie überströmen."
          : "Hier ist gerade keine Platzierung möglich. Prüfe Vorrat und benachbarte Barrieren.";
    } else
      $("target").innerHTML =
        '<span class="eyebrow">WERKZEUG / 01</span><h2>Eine Straße.<br>Ein neuer Weg.</h2><p>Zeige auf eine Straßenquerung. Die Linie markiert die exakte Barriere. Klicken setzt sie, erneut klicken entfernt sie ohne Erstattung.</p>';
  }
  if (b) {
    const index = map.buildings.indexOf(b);
    $("cost").textContent = "−" + exactCost(snapshot.demolitionCosts[index]);
  }
}
async function act(
  command: GameCommand,
  sound?: "blast" | "barrier" | "remove",
  point?: Point,
) {
  if (busy || fatal) return;
  busy = true;
  setControls();
  if (["pause", "resume", "reset", "start"].includes(command.type)) {
    view.selected = null;
    view.hoverBarrier = null;
    view.hoverBuilding = null;
    targetKey = "";
  }
  try {
    const reply = await request({ type: "command", command });
    if (reply.type === "snapshot") {
      if (!reply.ok)
        $("notice").textContent = reply.reason || "Aktion nicht möglich.";
      else {
        if (sound) {
          audio.play(sound);
          if (sound === "blast" && point)
            view.blast = { point, at: performance.now() };
        }
        $("notice").textContent =
          command.type === "placeBarrier"
            ? "Barriere gesetzt. Beobachte, wohin das Wasser ausweicht."
            : command.type === "removeBarrier"
              ? "Barriere entfernt. Keine Ladung erstattet."
              : command.type === "demolish"
                ? "Gebäude entfernt. Der Abrissschaden bleibt bestehen."
                : command.type === "pause"
                  ? "Einsatz pausiert."
                  : command.type === "resume"
                    ? "Einsatz fortgesetzt."
                    : command.type === "reset"
                      ? "Neue Runde bereit."
                      : "Die Flut kommt. Wähle deinen ersten Eingriff.";
      }
    }
  } catch (e) {
    if (!fatal) fail(String(e));
  } finally {
    busy = false;
    update();
  }
}
function selectTool(tool: "barrier" | "demolition") {
  view.tool = tool;
  view.selected = null;
  view.hoverBuilding = null;
  view.hoverBarrier = null;
  targetKey = "";
  $("barrier-tool").classList.toggle("active", tool === "barrier");
  $("demolition-tool").classList.toggle("active", tool === "demolition");
  $("barrier-tool").setAttribute("aria-pressed", String(tool === "barrier"));
  $("demolition-tool").setAttribute(
    "aria-pressed",
    String(tool === "demolition"),
  );
  targetPanel();
  setControls();
}
$("barrier-tool").onclick = () => selectTool("barrier");
$("demolition-tool").onclick = () => selectTool("demolition");
$("pause").onclick = (e) => {
  if (e.detail <= 1)
    void act({ type: snapshot?.phase === "paused" ? "resume" : "pause" });
};
$("restart").onclick = (e) => {
  if (e.detail <= 1) void act({ type: "reset" });
};
$("mute").onclick = () => {
  audio.unlock();
  audio.muted = !audio.muted;
  $("mute").textContent = audio.muted ? "Ton aus" : "Ton an";
  $("mute").setAttribute("aria-pressed", String(audio.muted));
};
document.addEventListener("keydown", (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "1") selectTool("barrier");
  if (event.key === "2") selectTool("demolition");
  if (event.key === "Escape") {
    view.selected = null;
    targetKey = "";
    targetPanel();
  }
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    if (snapshot?.phase === "running" || snapshot?.phase === "paused")
      void act({ type: snapshot.phase === "running" ? "pause" : "resume" });
  }
});
function pick(event: PointerEvent | MouseEvent): Point | null {
  return map
    ? mapPosition(
        event.clientX,
        event.clientY,
        canvas.getBoundingClientRect(),
        map.width * map.cellSize,
      )
    : null;
}
function hover(point: Point | null) {
  if (!map || !snapshot) return;
  view.hoverBarrier =
    point && view.tool === "barrier"
      ? barrierAt(map, point, 6, new Set(snapshot.barriers))
      : null;
  view.hoverBuilding =
    point && view.tool === "demolition" ? buildingAt(map, point) : null;
  view.valid =
    !!view.hoverBarrier &&
    snapshot.phase === "running" &&
    snapshot.barrierCharges > 0 &&
    barrierAllowed(map, view.hoverBarrier.id, new Set(snapshot.barriers));
  targetPanel();
}
canvas.addEventListener("pointermove", (event) => hover(pick(event)));
canvas.addEventListener("pointerleave", () => hover(null));
canvas.addEventListener("click", (event) => {
  audio.unlock();
  if (
    event.detail > 1 ||
    (performance.now() - lastControlPointer.at < 450 &&
      Math.hypot(
        event.clientX - lastControlPointer.x,
        event.clientY - lastControlPointer.y,
      ) < 16) ||
    busy ||
    !map ||
    snapshot?.phase !== "running"
  )
    return;
  const point = pick(event);
  hover(point);
  if (!point) return;
  if (view.tool === "barrier") {
    const s = view.hoverBarrier;
    if (!s) {
      $("notice").textContent = "Zeige näher auf eine Straßenquerung.";
      return;
    }
    const remove = snapshot.barriers.includes(s.id);
    if (!remove && !view.valid) {
      $("notice").textContent =
        "Keine Barriere verfügbar oder überlappende Querung.";
      return;
    }
    void act(
      { type: remove ? "removeBarrier" : "placeBarrier", segmentId: s.id },
      remove ? "remove" : "barrier",
    );
  } else {
    const b = buildingAt(map, point);
    view.selected = b && !snapshot.demolished.includes(b.id) ? b : null;
    targetKey = "";
    targetPanel();
    setControls();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    view.selected = null;
    view.hoverBarrier = null;
    view.hoverBuilding = null;
    targetKey = "";
    void request({ type: "hidden" }).catch((e) => fail(String(e)));
  }
});
let lastDraw = 0;
function frame(now: number) {
  if (renderer && snapshot && now - lastDraw > 30) {
    renderer.draw(snapshot, view, now);
    lastDraw = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Deliberately absent on normal URLs. All simulation access still crosses the Worker.
if (testMode) {
  const state = async () => {
    await request({ type: "state" });
    return {
      ...snapshot!,
      tool: view.tool,
      selectedBuilding: view.selected?.id ?? null,
    };
  };
  const targets = async () => {
    await state();
    const rect = canvas.getBoundingClientRect(),
      m = map!,
      s = snapshot!;
    const screen = (p: Point) => ({
      x: rect.left + (p[0] / (m.width * m.cellSize)) * rect.width,
      y: rect.top + (p[1] / (m.height * m.cellSize)) * rect.height,
    });
    return {
      barriers: m.barrierSegments.map((segment) => {
        let p = segment.points[Math.floor(segment.points.length / 2)];
        for (let i = 1; i < segment.points.length; i++) {
          const candidate: Point = [
            (segment.points[i][0] + segment.points[i - 1][0]) / 2,
            (segment.points[i][1] + segment.points[i - 1][1]) / 2,
          ];
          if (
            barrierAt(m, candidate, 6, new Set(s.barriers))?.id === segment.id
          ) {
            p = candidate;
            break;
          }
        }
        return {
          id: segment.id,
          road: segment.road,
          ...screen(p),
          placed: s.barriers.includes(segment.id),
          local: p,
        };
      }),
      buildings: m.buildings.map((b, index) => {
        const cell = b.cells.reduce((best, i) => {
          const d = (j: number) =>
            Math.hypot(
              ((j % m.width) + 0.5) * m.cellSize - b.center[0],
              (Math.floor(j / m.width) + 0.5) * m.cellSize - b.center[1],
            );
          return d(i) < d(best) ? i : best;
        }, b.cells[0]);
        const p: Point = [
          ((cell % m.width) + 0.5) * m.cellSize,
          (Math.floor(cell / m.width) + 0.5) * m.cellSize,
        ];
        return {
          id: b.id,
          name: b.name,
          zone: b.zone,
          ...screen(p),
          local: p,
          cost: s.demolitionCosts[index],
          demolished: s.demolished.includes(b.id),
        };
      }),
    };
  };
  Object.assign(window, {
    __WF_V4__: {
      state,
      advance: async (seconds: number) => {
        await request({ type: "advance", seconds });
        return state();
      },
      command: async (command: GameCommand) => {
        await act(command);
        return state();
      },
      targets,
      select: (tool: "barrier" | "demolition") => selectTool(tool),
    },
  });
}
