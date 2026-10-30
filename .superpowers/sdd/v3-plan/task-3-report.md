# Task 3 – Browserabnahme und Dokumentation

Stand: 30. Oktober 2026. Branch `codex/donau-v3`. Keine App- oder Kernänderung, kein Push.

## Umsetzung

- `tests/browser/flood.spec.ts` enthält sechs Tests gegen den frischen Produktionsbuild auf exklusivem Port 4187. Sie prüfen die fehlende Test-API ohne Query, Vorbereitungen und Startschranke, echte Canvas-Mausauswahl mit Viewport/Letterbox-Transformation, Wehrstellung und Stellzeit, Notdamm, Rettungsteams samt Umverteilung, Pausensperren für Canvas/Direktwahl/Test-API/Commands, Neustart und ein vollständiges beschleunigtes Ergebnis.
- Dammöffnung: rechter Mausklick, kurzes Maus- und Tastaturhalten, Fokusverlust, Pointercancel, Verlassen des Buttons, Auswahlwechsel und Pause verhindern Öffnung. Erfolgreiches Halten wurde mit Tastatur und echter Maus an zwei Dämmen geprüft.
- Ungültiger Wehrbefehl vor 70 s verdeckt die 70-s-Warnung nicht; ein neuer Fehler ohne Folgeereignis läuft nach drei Simulationssekunden ab.
- 15 Sekunden liefen ohne `advance` über echte RAF-Zeit. Danach erzeugte eine um 90 Simulationssekunden beschleunigte Prüfung eine deutlich sichtbare Flutansicht. Die komplette 180-s-Runde wurde ebenfalls beschleunigt. Dies belegt keine dreiminütige Echtzeitperformance und keine exakte Framerate.
- `tools/compare-rounds.ts` und `docs/vergleichsrunden.md` enthalten zwei zusätzliche faire Strategien mit denselben drei Speicher-Vorbereitungen: alle Wehre ab 90 s öffnen (225 sicher, 360,877 Schaden), Notdamm d3 bei 0 s bauen (365 sicher, 320,000 Schaden). Die acht Läufe bleiben deterministische Modellvergleiche, keine menschliche Abnahme.
- `README.md` erklärt aktuelles Spiel, Build, Tests, V2-Gitarchiv und Abnahmegrenzen. `docs/status.md` ist eine Kriterienmatrix mit erfüllt/offen/nicht prüfbar und den tatsächlich ausgeführten Belegen.

## Frische Prüfungen

- `bun run test`: 3 Testdateien, 24 Tests bestanden, Exit 0.
- `bun run test:browser`: Typecheck und Vite-Produktionsbuild erfolgreich; 6 Playwright-Chromium-Tests bestanden, Exit 0, 27,2 s im letzten vollständigen Lauf vor den zwei Testschärfungen.
- `bun --bun playwright test --grep 'Dammöffnung:|echte RAF-Zeit'`: beide nachgeschärften Tests bestanden, Exit 0, 27,4 s. Diese verwendeten den unveränderten Produktionsbuild vom vorigen Lauf.
- `bun --bun tools/compare-rounds.ts`: acht Strategien ausgegeben; maximaler Bilanzfehler 1,705e-11. `git diff --check`: Exit 0.
- Bun 1.4.4; `@playwright/test` 1.64.1; Chromium 156.0.8078.4; macOS/Darwin 27.2.0 arm64. Browsermessung: 15,001 s Wandzeit, 14,967 s Simulationszeit. In den geprüften Pfaden: 0 `pageerror`, 0 externe Laufzeitanfragen.

## Sichtbelege

- `docs/v3-start.png` – 1280×800, Vorbereitung.
- `docs/v3-echtzeit.png` – 1440×960, nach 15 s echter RAF-Zeit.
- `docs/v3-flut.png` – 1440×960, nach den echten 15 s plus 90 beschleunigten Simulationssekunden.
- `docs/v3-ergebnis.png` – 1440×960, vollständiges beschleunigtes Ergebnis.
- `docs/browser-evidence.json` – Browser-, Plattform-, Zeit-, Tab- und Netzbeobachtungen. Screenshots visuell geprüft; die Karte war in beiden Viewports vollständig sichtbar (`toBeInViewport({ ratio: 1 })`).

## Offene Grenzen

Ein zweiter Tab wurde tatsächlich aktiviert. In dieser Headless-Umgebung blieb `document.hidden=false` und die Runde lief weiter. Natürliche Hintergrundpause bleibt für einen sichtbaren Desktopbrowser offen. Menschliche Verständlichkeit und Spielspaß sind nicht bewertet. HQ10/50/500/1000 sind bis nach drei menschlichen HQ100-Runden zurückgestellt. Safari, Touch und mobile Geräte wurden nicht geprüft. Kein Test belegt exakte Framefrequenz oder 180 Sekunden Echtzeitlauf.

## Geänderte Dateien

`tests/browser/flood.spec.ts`, `tools/compare-rounds.ts`, `docs/vergleichsrunden.md`, `README.md`, `docs/status.md`, `docs/browser-evidence.json`, `docs/v3-start.png`, `docs/v3-echtzeit.png`, `docs/v3-flut.png`, `docs/v3-ergebnis.png`, `.superpowers/sdd/v3-plan/task-3-report.md`.
