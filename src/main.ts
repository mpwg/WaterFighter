import { SCENARIO } from "./core/arena";
import { advance, command, createGame, getResult, inflowAt } from "./core/game";
import type { Command, GameState, Preparation, Selection } from "./core/types";
import { ArenaView } from "./render/arena";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
const towns = SCENARIO.nodes.filter((n) => n.kind === "town");
const basins = SCENARIO.nodes.filter((n) => n.kind === "basin");
const gates = SCENARIO.links.filter((l) => l.kind === "gate");
const nodeSpec = (id: string) => SCENARIO.nodes.find((n) => n.id === id)!;
const time = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const damagePoints = (n: number) =>
  `${Math.round(n).toLocaleString("de-AT")} Schadenspunkte`;
const escapeHTML = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
let state = createGame();
let selection: Selection = null;
let category: Preparation["kind"] = "reinforce";
let panelKey = "";
let lastFrame = performance.now();
let lastUpdate = 0;
let lastEvents = "";
let hold: {
  button: HTMLButtonElement;
  id: string;
  start: number;
  frame: number;
  source: "pointer" | "keyboard";
} | null = null;

const forecast = Array.from(
  { length: 91 },
  (_, i) => `${i ? "L" : "M"}${12 + i * 4.2},${75 - inflowAt(i * 2) * 1.3}`,
).join(" ");
app.innerHTML = /* HTML */ `<div class="page">
  <header class="masthead">
    <div>
      <span class="eyebrow">WATERFIGHTER / EINSATZ 01</span>
      <h1>Die Donau kommt<span class="period">.</span></h1>
    </div>
    <div class="masthead-right">
      <span class="badge">HQ100 <small>JAHRHUNDERTHOCHWASSER</small></span>
      <div class="top-controls">
        <button id="pause" data-testid="pause">Pause</button
        ><button id="reset" data-testid="reset">Neustart</button>
      </div>
    </div>
  </header>
  <div class="statusbar">
    <div>
      <span>VERBLEIBENDE ZEIT</span
      ><strong id="time-left" data-testid="time-left"></strong>
    </div>
    <div>
      <span>MENSCHEN SICHER</span><strong id="safe" data-testid="safe"></strong>
    </div>
    <div>
      <span>SACHSCHADEN</span><strong id="damage" data-testid="damage"></strong>
    </div>
    <b id="phase" class="phase"></b>
  </div>
  <main class="workspace">
    <section class="map-column" aria-label="Einsatzkarte">
      <div class="map-head">
        <span>01 / DONAUABSCHNITT TULLN – WIEN</span
        ><span>INTERAKTIVE EINSATZKARTE</span>
      </div>
      <div class="map-wrap">
        <canvas id="arena" data-testid="arena"></canvas>
        <div id="map-banner" class="map-banner" hidden>EINSATZ PAUSIERT</div>
      </div>
      <div class="map-foot">
        <span><i class="dot water"></i> Fluss & Rückhalt</span
        ><span><i class="dot town"></i> Gemeinden</span
        ><span><i class="dot gate"></i> Wehre & Dämme</span
        ><span class="scale">N ↑</span>
      </div>
    </section>
    <aside id="sidebar" class="sidebar">
      <section id="intro" class="section intro">
        <span class="eyebrow">LAGEBESPRECHUNG / 00</span>
        <h2>Lenke das Wasser.<br />Schütze die Menschen.</h2>
        <p>
          Leite Wasser durch Wehre in Rückhalteräume. Evakuiere gefährdete Orte.
          Wäge jeden Eingriff gegen mögliche Schäden ab.
        </p>
      </section>
      <section class="section">
        <div class="section-title">
          <span id="panel-heading"></span><span id="panel-counter"></span>
        </div>
        <div id="panel" data-testid="selection-panel"></div>
      </section>
      <section class="section">
        <div class="section-title">ANLAGEN DIREKT WÄHLEN</div>
        <h3>WEHRE</h3>
        <div id="gate-list" class="quick-list"></div>
        <h3>DÄMME</h3>
        <div id="site-list" class="quick-list"></div>
        <h3>GEMEINDEN</h3>
        <div id="town-list" class="quick-list"></div>
      </section>
      <section class="section forecast">
        <div class="section-title">
          <span>ZUFLUSSPROGNOSE</span><span>0–3 MIN.</span>
        </div>
        <svg
          viewBox="0 0 400 92"
          role="img"
          aria-label="Zuflussprognose mit Spitzen bei 0:52 und 1:52"
        >
          <path class="grid" d="M12 75H390M12 44H390M12 13H390" />
          <path class="curve" d="${forecast}" />
          <line
            id="forecast-cursor"
            class="cursor"
            x1="12"
            x2="12"
            y1="4"
            y2="79"
          />
          <text x="99" y="17">1. SCHEITEL</text>
          <text x="226" y="17">2. SCHEITEL</text>
          <text x="12" y="90">0:00</text>
          <text x="354" y="90">3:00</text>
        </svg>
        <div class="forecast-caption">
          <span>AKTUELL <b id="inflow"></b></span
          ><span>MAX. 45 Einheiten/s</span>
        </div>
      </section>
      <section class="section">
        <div class="section-title">MELDUNGEN</div>
        <div id="events" class="events" role="log" aria-live="polite"></div>
      </section>
    </aside>
  </main>
  <footer>
    WATERFIGHTER — EINSATZKARTE WIEN
    <span>SIMULIERTES SZENARIO · ENTSCHEIDUNGEN WIRKEN SOFORT</span>
  </footer>
</div>`;
const $ = (id: string) => document.getElementById(id)!;
const view = new ArenaView($("arena") as HTMLCanvasElement, select);

function cancelHold(): void {
  if (!hold) return;
  cancelAnimationFrame(hold.frame);
  hold.button.style.setProperty("--hold-progress", "0%");
  hold.button.classList.remove("holding");
  hold = null;
}
function select(next: Selection): void {
  cancelHold();
  selection = next;
  panelKey = "";
  refresh(true);
}
function act(c: Command): boolean {
  if (c.type === "pause" || c.type === "reset") cancelHold();
  const ok = command(state, c);
  if (c.type === "reset" && ok) {
    selection = null;
    category = "reinforce";
    lastEvents = "";
    lastFrame = performance.now();
    $("sidebar").scrollTop = 0;
  }
  if (["prepare", "reset", "start"].includes(c.type)) panelKey = "";
  refresh(true);
  return ok;
}

function preparationPanel(): string {
  const labels = {
    reinforce: "Dämme",
    capacity: "Rückhalt",
    evacuation: "Rettung",
  };
  const descriptions = {
    reinforce: "Vorab verstärkte Schutzdämme erhöhen die Überlaufschwelle.",
    capacity: "Rückhalteräume nehmen mehr Wasser auf.",
    evacuation: "Vorbereitete Gemeinden werden schneller evakuiert.",
  };
  const targets =
    category === "reinforce"
      ? SCENARIO.sites
      : category === "capacity"
        ? basins
        : towns;
  return /* HTML */ `<div class="slots" aria-label="Drei Auswahlplätze">
      ${[0, 1, 2]
        .map((i) => {
          const p = state.preparations[i];
          const name = p
            ? p.kind === "reinforce"
              ? SCENARIO.sites.find((s) => s.id === p.targetId)!.name
              : nodeSpec(p.targetId).name
            : "Maßnahme wählen";
          return /* HTML */ `<div class="slot ${p ? "filled" : ""}">
            <span>0${i + 1}</span><b>${escapeHTML(name)}</b>
          </div>`;
        })
        .join("")}
    </div>
    <div class="tabs" role="tablist" aria-label="Maßnahmenkategorie">
      ${(["reinforce", "capacity", "evacuation"] as const).map((k) => `<button role="tab" aria-selected="${category === k}" class="${category === k ? "active" : ""}" data-category="${k}">${labels[k]}</button>`).join("")}
    </div>
    <p class="panel-copy">${descriptions[category]}</p>
    <div class="targets">
      ${targets
        .map((t) => {
          const chosen = state.preparations.some(
            (p) => p.kind === category && p.targetId === t.id,
          );
          return /* HTML */ `<button
            class="target ${chosen ? "chosen" : ""}"
            data-prep="${t.id}"
            data-testid="prepare-${t.id}"
            aria-pressed="${chosen}"
          >
            <span>${escapeHTML(t.name)}</span
            ><b>${chosen ? "✓ GEWÄHLT" : "+ WÄHLEN"}</b>
          </button>`;
        })
        .join("")}
    </div>
    <button
      class="primary start"
      data-action="start"
      data-testid="start"
      ${state.preparations.length === 3 ? "" : "disabled"}
    >
      Einsatz starten <span>→</span>
    </button>`;
}

function selectedPanel(): string {
  if (!selection)
    return /* HTML */ `<div class="empty">
      <span class="compass">✦</span>
      <h2>Wähle ein Ziel auf der Karte.</h2>
      <p>
        Steuere Wehre, baue Notdämme oder schicke Rettungsteams in gefährdete
        Gemeinden.
      </p>
      <small>Alle Wehre und Gemeinden sind auch unten anwählbar.</small>
    </div>`;
  if (selection.kind === "gate") {
    const link = gates.find((g) => g.id === selection!.id);
    if (!link) return "<p>Unbekanntes Wehr.</p>";
    return /* HTML */ `<span class="eyebrow">WASSERLENKUNG / WEHR</span>
      <h2>${escapeHTML(link.name)}</h2>
      <p class="panel-copy">Stellung ändern · Stellzeit 1,2 s</p>
      <div class="metric">
        <span>AKTUELLE STELLUNG</span><b id="gate-status"></b>
      </div>
      <div class="positions">
        ${([0, 0.5, 1] as const).map((v, i) => `<button data-gate="${v}" data-testid="gate-${link.id}-${i}" class="position"><span>${["ZU", "HALB", "OFFEN"][i]}</span><small>${["0 %", "50 %", "100 %"][i]}</small></button>`).join("")}
      </div>
      <p class="small" id="gate-timer"></p>`;
  }
  if (selection.kind === "site") {
    const site = SCENARIO.sites.find((s) => s.id === selection!.id);
    if (!site) return "<p>Unbekannte Dammstelle.</p>";
    return /* HTML */ `<span class="eyebrow">SCHUTZLINIE / DAMM</span>
      <h2>${escapeHTML(site.name)}</h2>
      <div class="metric"><span>STATUS</span><b id="site-status"></b></div>
      <div class="metric">
        <span>BAUEINSÄTZE ÜBRIG</span><b id="builds-left"></b>
      </div>
      <button
        class="secondary full"
        data-action="build"
        data-testid="build-${site.id}"
      >
        Notdamm bauen <small>3 s Bauzeit</small>
      </button>
      <div class="danger-area">
        <span class="eyebrow">IRREVERSIBLER EINGRIFF</span>
        <p>
          Öffnung flutet
          <strong>${escapeHTML(nodeSpec(site.receiverId).name)}</strong>. Zum
          Bestätigen 0,9 s gedrückt halten.
        </p>
        <button
          class="breach"
          data-breach="${site.id}"
          data-testid="breach-${site.id}"
          style="--hold-progress:0%"
        >
          <span class="hold-fill"></span
          ><span class="hold-label">Damm gedrückt halten & öffnen</span>
        </button>
      </div>`;
  }
  const spec = SCENARIO.nodes.find((n) => n.id === selection!.id);
  if (!spec) return "<p>Unbekannter Ort.</p>";
  if (spec.kind === "town")
    return /* HTML */ `<span class="eyebrow">GEMEINDE / RETTUNG</span>
      <h2>${escapeHTML(spec.name)}</h2>
      <div class="metric"><span>SPIELPEGEL</span><b id="node-depth"></b></div>
      <div class="metric"><span>SACHSCHADEN</span><b id="town-damage"></b></div>
      <div class="metric">
        <span>GERETTET / GESAMT</span><b id="town-rescued"></b>
      </div>
      <div class="teams">
        ${[0, 1].map((i) => `<button class="team" data-team="${i}" data-testid="team-${i + 1}"><b>TEAM ${i + 1}</b><span id="team-label-${i}"></span></button>`).join("")}
      </div>
      <p class="small">Erneut klicken, um ein Team abzuziehen.</p>`;
  if (spec.kind === "basin")
    return /* HTML */ `<span class="eyebrow">RÜCKHALT / BECKEN</span>
      <h2>${escapeHTML(spec.name)}</h2>
      <div class="metric"><span>FÜLLUNG</span><b id="basin-fill"></b></div>
      <div class="meter"><span id="basin-meter"></span></div>
      <p class="small">Ein Wehr lenkt Wasser in diesen Rückhalteraum.</p>`;
  return /* HTML */ `<span class="eyebrow">DONAU / FLUSSABSCHNITT</span>
    <h2>${escapeHTML(spec.name)}</h2>
    <div class="metric"><span>SPIELPEGEL</span><b id="node-depth"></b></div>
    <p class="small">Pegeländerung durch Zufluss, Wehre und Überläufe.</p>`;
}

function resultPanel(): string {
  const r = state.result ?? getResult(state);
  const affected = towns.filter((t) => {
    const n = state.nodes.find((n) => n.id === t.id)!;
    return n.exposed || n.damage > 0.001;
  });
  return /* HTML */ `<div class="result">
    <span class="eyebrow">EINSATZ BEENDET</span>
    <h2>Die Bilanz.</h2>
    <div class="result-numbers">
      <div><b>${r.safe}</b><span>MENSCHEN SICHER</span></div>
      <div><b>${r.rescued}</b><span>DAVON GERETTET</span></div>
      <div><b>${r.inNeed}</b><span>NOCH IN NOT</span></div>
    </div>
    <div class="metric">
      <span>SACHSCHÄDEN</span><b>${damagePoints(r.damage)}</b>
    </div>
    <div class="metric">
      <span>SACHWERTE ERHALTEN</span><b>${damagePoints(r.preserved)}</b>
    </div>
    <p class="small">
      Betroffene Gemeinden:
      ${affected.length ? affected.map((t) => escapeHTML(t.name)).join(", ") : "keine"}.
    </p>
    <button class="primary" data-action="reset" data-testid="again">
      Neuen Einsatz beginnen →
    </button>
  </div>`;
}

function updatePanel(): void {
  const key =
    state.phase === "ready"
      ? `ready:${category}:${state.preparations.map((p) => `${p.kind}-${p.targetId}`).join(",")}`
      : state.phase === "finished"
        ? "result"
        : `live:${selection?.kind}:${selection?.id}`;
  if (panelKey !== key) {
    cancelHold();
    $("panel").innerHTML =
      state.phase === "ready"
        ? preparationPanel()
        : state.phase === "finished"
          ? resultPanel()
          : selectedPanel();
    panelKey = key;
    if (key === "result") $("sidebar").scrollTop = 0;
  }
  $("panel-heading").textContent =
    state.phase === "ready"
      ? "VORBEREITUNG"
      : state.phase === "finished"
        ? "EINSATZERGEBNIS"
        : "EINSATZSTEUERUNG";
  $("panel-counter").textContent =
    state.phase === "ready"
      ? `${state.preparations.length} / 3 GEWÄHLT`
      : `${state.buildsLeft} BAUEINSÄTZE`;
  if (state.phase === "ready" || state.phase === "finished" || !selection)
    return;
  const enabled = state.phase === "running";
  if (selection.kind === "gate") {
    const g = state.gates.find((g) => g.id === selection!.id)!;
    const busy = g.readyAt > state.time;
    $("gate-status").textContent = busy
      ? "STELLT UM"
      : g.opening === 0
        ? "GESCHLOSSEN"
        : g.opening === 0.5
          ? "HALB OFFEN"
          : "OFFEN";
    $("gate-timer").textContent = busy
      ? `Noch ${(g.readyAt - state.time).toFixed(1)} s Stellzeit`
      : "Wehr bereit";
    $("panel")
      .querySelectorAll<HTMLButtonElement>("[data-gate]")
      .forEach((b) => {
        b.disabled = !enabled || busy || Number(b.dataset.gate) === g.opening;
        b.classList.toggle("current", Number(b.dataset.gate) === g.opening);
      });
  } else if (selection.kind === "site") {
    const s = state.sites.find((s) => s.id === selection!.id)!;
    $("site-status").textContent = s.breached
      ? "DAUERHAFT GEÖFFNET"
      : s.buildingUntil !== null
        ? `BAU LÄUFT · ${(s.buildingUntil - state.time).toFixed(1)} s`
        : s.built
          ? "NOTDAMM STEHT"
          : "UNVERÄNDERT";
    $("builds-left").textContent = String(state.buildsLeft);
    (
      $("panel").querySelector('[data-action="build"]') as HTMLButtonElement
    ).disabled =
      !enabled ||
      s.breached ||
      s.built ||
      s.buildingUntil !== null ||
      !state.buildsLeft;
    ($("panel").querySelector("[data-breach]") as HTMLButtonElement).disabled =
      !enabled || s.breached || s.buildingUntil !== null;
  } else {
    const spec = nodeSpec(selection.id),
      n = state.nodes.find((n) => n.id === spec.id)!;
    const depth = $("panel").querySelector("#node-depth");
    if (depth) depth.textContent = n.depth.toFixed(2);
    if (spec.kind === "town") {
      $("town-damage").textContent = damagePoints(n.damage * spec.assetValue);
      $("town-rescued").textContent =
        `${Math.floor(n.rescued)} / ${spec.residents}`;
      $("panel")
        .querySelectorAll<HTMLButtonElement>("[data-team]")
        .forEach((b) => {
          const i = Number(b.dataset.team),
            assigned = state.teams[i];
          b.disabled = !enabled;
          b.classList.toggle("assigned", assigned === spec.id);
          $(`team-label-${i}`).textContent =
            assigned === spec.id
              ? "Hier eingesetzt · abziehen"
              : assigned
                ? `Von ${nodeSpec(assigned).name} hierher`
                : "Hier einsetzen";
        });
    } else if (spec.kind === "basin") {
      const fraction = Math.min(1, n.depth / spec.capacityDepth);
      $("basin-fill").textContent =
        `${Math.round(fraction * 100)} % · Spielpegel ${n.depth.toFixed(2)}`;
      ($("basin-meter") as HTMLElement).style.width = `${fraction * 100}%`;
    }
  }
}

function refresh(force = false): void {
  updatePanel();
  const r = getResult(state);
  $("time-left").textContent = time(
    Math.max(0, SCENARIO.duration - state.time),
  );
  $("safe").textContent = `${r.safe} / ${r.total}`;
  $("damage").textContent = damagePoints(r.damage);
  $("phase").textContent = {
    ready: "VORBEREITUNG",
    running: "EINSATZ LÄUFT",
    paused: "PAUSIERT",
    finished: "EINSATZ BEENDET",
  }[state.phase];
  $("intro").hidden = state.phase !== "ready";
  $("map-banner").hidden = state.phase !== "paused";
  const pause = $("pause") as HTMLButtonElement;
  pause.disabled = state.phase === "ready" || state.phase === "finished";
  pause.textContent = state.phase === "paused" ? "Weiter" : "Pause";
  $("inflow").textContent = `${Math.round(inflowAt(state.time))} Einheiten/s`;
  const cursor = $("forecast-cursor"),
    x = String(12 + Math.min(180, state.time) * 2.1);
  cursor.setAttribute("x1", x);
  cursor.setAttribute("x2", x);
  const messages = [...state.events]
    .reverse()
    .filter((e) => ["warning", "flood", "breach", "finish"].includes(e.type))
    .slice(0, 3);
  const eventKey = `${state.lastError ?? ""}:${messages.map((e) => e.id).join(",")}`;
  if (force || lastEvents !== eventKey) {
    lastEvents = eventKey;
    $("events").innerHTML =
      (state.lastError
        ? `<div class="event error">${escapeHTML(state.lastError)}</div>`
        : "") +
      (messages.length
        ? messages
            .map(
              (e) =>
                `<div class="event"><time>${time(e.time)}</time><span>${escapeHTML(e.message)}</span></div>`,
            )
            .join("")
        : '<p class="small">Noch keine Warnungen. Beobachte die Prognose.</p>');
  }
  document
    .querySelectorAll<HTMLButtonElement>("[data-select]")
    .forEach((b) =>
      b.classList.toggle(
        "selected",
        b.dataset.select === `${selection?.kind}:${selection?.id}`,
      ),
    );
  view.update(state, selection);
  view.render();
}

function startHold(
  button: HTMLButtonElement,
  source: "pointer" | "keyboard",
): void {
  if (
    hold ||
    button.disabled ||
    state.phase !== "running" ||
    selection?.kind !== "site" ||
    selection.id !== button.dataset.breach
  )
    return;
  const id = button.dataset.breach!,
    start = performance.now();
  hold = { button, id, start, frame: 0, source };
  button.classList.add("holding");
  const run = (now: number) => {
    if (
      !hold ||
      hold.button !== button ||
      state.phase !== "running" ||
      selection?.id !== id ||
      document.hidden
    ) {
      cancelHold();
      return;
    }
    const ratio = Math.min(1, (now - start) / 900);
    button.style.setProperty("--hold-progress", `${ratio * 100}%`);
    if (ratio >= 1) {
      cancelHold();
      act({ type: "breach", id });
      return;
    }
    hold.frame = requestAnimationFrame(run);
  };
  hold.frame = requestAnimationFrame(run);
}

$("gate-list").innerHTML = gates
  .map(
    (g) =>
      `<button data-select="gate:${g.id}" data-testid="select-${g.id}">${escapeHTML(g.name)} <span>↗</span></button>`,
  )
  .join("");
$("site-list").innerHTML = SCENARIO.sites
  .map(
    (site) =>
      `<button data-select="site:${site.id}" data-testid="select-${site.id}">${escapeHTML(site.name)} <span>↗</span></button>`,
  )
  .join("");
$("town-list").innerHTML = towns
  .map(
    (t) =>
      `<button data-select="node:${t.id}" data-testid="select-${t.id}">${escapeHTML(t.name)} <span>↗</span></button>`,
  )
  .join("");
app.addEventListener("click", (event) => {
  const b = (event.target as Element).closest<HTMLButtonElement>("button");
  if (!b) return;
  if (b.dataset.breach) {
    event.preventDefault();
    return;
  }
  if (b.id === "pause")
    return void act({ type: state.phase === "paused" ? "resume" : "pause" });
  if (b.id === "reset" || b.dataset.action === "reset")
    return void act({ type: "reset" });
  if (b.dataset.category) {
    category = b.dataset.category as Preparation["kind"];
    panelKey = "";
    refresh(true);
    return;
  }
  if (b.dataset.prep) {
    const id = b.dataset.prep;
    act({ type: "prepare", preparation: { kind: category, targetId: id } });
    select({ kind: category === "reinforce" ? "site" : "node", id });
    return;
  }
  if (b.dataset.action === "start") return void act({ type: "start" });
  if (b.dataset.select) {
    const [kind, id] = b.dataset.select.split(":");
    select({ kind: kind as "node" | "gate" | "site", id });
    return;
  }
  if (b.dataset.gate && selection?.kind === "gate")
    return void act({
      type: "gate",
      id: selection.id,
      opening: Number(b.dataset.gate) as 0 | 0.5 | 1,
    });
  if (b.dataset.action === "build" && selection?.kind === "site")
    return void act({ type: "build", id: selection.id });
  if (b.dataset.team && selection?.kind === "node") {
    const index = Number(b.dataset.team);
    act({
      type: "team",
      index,
      townId: state.teams[index] === selection.id ? null : selection.id,
    });
  }
});
app.addEventListener("pointerdown", (event) => {
  const b = (event.target as Element).closest<HTMLButtonElement>(
    "[data-breach]",
  );
  if (b && event.isPrimary && event.button === 0) {
    event.preventDefault();
    startHold(b, "pointer");
  }
});
window.addEventListener("pointerup", cancelHold);
window.addEventListener("pointercancel", cancelHold);
app.addEventListener("pointerout", (event) => {
  if (!hold || hold.source !== "pointer") return;
  const next = event.relatedTarget;
  if (
    event.target === hold.button &&
    !(next instanceof Node && hold.button.contains(next))
  )
    cancelHold();
});
app.addEventListener("focusout", (event) => {
  if (hold?.source === "keyboard" && event.target === hold.button) cancelHold();
});
window.addEventListener("pointermove", (event) => {
  if (!hold || hold.source !== "pointer") return;
  const r = hold.button.getBoundingClientRect();
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    cancelHold();
});
app.addEventListener("keydown", (event) => {
  const target = event.target as HTMLElement;
  if (
    (event.code === "Space" || event.code === "Enter") &&
    target.matches("[data-breach]")
  ) {
    event.preventDefault();
    if (!event.repeat) startHold(target as HTMLButtonElement, "keyboard");
  }
});
window.addEventListener("keyup", (event) => {
  if (
    hold?.source === "keyboard" &&
    (event.code === "Space" || event.code === "Enter")
  ) {
    event.preventDefault();
    cancelHold();
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "Space" ||
    event.repeat ||
    event.defaultPrevented ||
    !["running", "paused"].includes(state.phase)
  )
    return;
  if (
    (event.target as HTMLElement).closest(
      'button,a,input,select,textarea,[role="button"],[contenteditable]',
    )
  )
    return;
  event.preventDefault();
  act({ type: state.phase === "running" ? "pause" : "resume" });
});
window.addEventListener("blur", cancelHold);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelHold();
    if (state.phase === "running") act({ type: "pause" });
  }
});
function frame(now: number): void {
  const dt = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (state.phase === "running") {
    advance(state, dt);
    if (now - lastUpdate > 100 || state.result !== null) {
      lastUpdate = now;
      refresh();
    } else view.render();
  }
  requestAnimationFrame(frame);
}
if (new URLSearchParams(location.search).get("test") === "1")
  Object.assign(window, {
    __waterfighter: {
      state: (): GameState => state,
      command: (c: Command): boolean => act(c),
      advance: (seconds: number): void => {
        advance(state, seconds);
        refresh(true);
      },
      select: (next: Selection): void => select(next),
    },
  });
refresh(true);
requestAnimationFrame(frame);
