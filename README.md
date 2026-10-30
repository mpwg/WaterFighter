# WaterFighter · Tullner Donauauen

Ein sechsminütiges Desktop-Hochwasserspiel mit einer WebGPU-Landschaft und einem deterministischen Wasserkern. Ziehe freie Sandsacklinien, rette Menschen durch Hausklicks und bediene den Flussschütz. Die Landschaft ist eine stilisierte Annäherung mit regelmäßig angeordneten Häusern, keine vermessene Darstellung von Tulln und keine Hochwasserprognose.

Voraussetzung: Bun 1.4.4 und ein Browser mit WebGPU.

```sh
bun install --frozen-lockfile
bun run dev
bun run test
bun run build
bun run test:browser
bun tools/compare-strategies.ts
```

Die Browserprüfung startet den Produktionsbuild exklusiv auf Port 4187. `WATERFIGHTER_CHROME` wählt eine vorhandene Chrome-Datei. `WATERFIGHTER_SOFTWARE_GPU=1` aktiviert die dokumentierten SwiftShader/Vulkan-Flags für funktionale Headless-Tests. Software-Rendering belegt keine Hardware-GPU-Leistung. Der Browserlauf enthält eine vollständige echte 360-Sekunden-Runde und dauert entsprechend länger.

Die Runde startet nach dem Laden. Die ersten 45 Sekunden bleiben ruhig. Werkzeug **Sandsäcke** (1) zeichnet per linker Maustaste freie Linien auf trockenem Boden; Materialkosten werden am Cursor geprüft. **Entfernen** (2) entfernt Linien und erstattet unbegonnenes Material vollständig, begonnenes teilweise. **Retten** (3) startet durch Hausklick eine sechssekündige Rettung; mehrere Häuser sind gleichzeitig möglich. Kleine Markierungen über den Häusern zeigen Restzeit und Fortschritt; ein Häkchen bedeutet gerettet. **Schütz** (4) schaltet den Durchlass. Rechts ziehen verschiebt die Kamera, das Mausrad zoomt, **Übersicht** setzt die Kamera zurück. Escape bricht eine Linie ab.

**Pause** hält Wasser und Rettungen an; neue Rettungen starten erst nach Weiter; neue Sandsäcke werden mit reservierten Kosten geplant und nach Weiter gebaut. **Neustart** setzt Zeit und Material zurück. Qualität Hoch/Niedrig kann während der Runde gewechselt werden. Nach sechs Minuten erscheint die Bilanz.

`src/flood/` enthält den 256×192-Wasserkern mit festen 1/30-Sekunden-Schritten, `src/worker.ts` besitzt die laufende Simulation, `src/scene/` rendert Babylon.js WebGPU. `?test=1` stellt eine eingefrorene Test-API bereit; `?test=1&realtime=1` beobachtet echte Zeit. Normale URLs besitzen diese API nicht. Compiler und Schriftdateien werden lokal gebündelt.

[Abnahme und Grenzen](docs/status.md), [Strategiedaten](docs/strategy-evidence.json) und [Browsermessdaten](docs/browser-evidence.json) dokumentieren den aktuellen Stand. Safari, physische GPUs, reale Mobilgeräte und menschlicher Spielspaß wurden nicht abgenommen.
