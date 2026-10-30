# Flutwehr – Implementierung und Abnahme

Stand: 30. Oktober 2026. Das Arcade-Spiel ist implementiert. **Es ist noch nicht vollständig abgenommen:** Der menschliche Spielspaßtest, ein echter Browser-Tabwechsel und eine Hörprobe bleiben offen. Touch/mobile Geräte und Safari gehören nicht zur abgenommenen Desktop-Umgebung.

## Umsetzung

Der bisherige Solver-, Worker- und Geodatenprototyp wurde aus dem aktuellen Branch entfernt. `prototype/v1` bleibt unverändert auf `baf0b198732377907eab29eb45869d6da7d5b1cd`. Die Entwicklung liegt auf `codex/arcade-flutwehr`; auf ausdrücklichen Nutzerwunsch werden abgeschlossene Meilensteine committet und auf diesen Branch gepusht. Kein Merge nach `main`, keine Veröffentlichung und kein Release.

Der Kern tickt unabhängig vom Renderer mit 30 festen Schritten pro Sekunde. Zwei räumlich getrennte Flutrouten, sechs Bauplätze, sechs Häuser mit je vier Bewohnern und fünf Wellen bilden die Arena. Startenergie 100, Kosten 50 pro Gerät, Regeneration 2/s, Abschlussbonus 35 und maximal 250 Energie. Drei Geräte wirken verschieden und haben jeweils genau einen Ausbau. Schutz, Evakuierung, Schaden, Wertung und Rundenende sind im Kern definiert.

## Kriterienmatrix

| Kriterium | Status | Aktueller Beleg / Grenze |
|---|---|---|
| TS/Vite/Bun/Babylon; alter Solver außerhalb des aktuellen Branches | erfüllt | Produktionsbuild erfolgreich; aktive Quellen ausschließlich `src/core`, `src/render`, `src/main.ts`; alte Dateien entfernt, Sicherungsreferenz unverändert. |
| Deterministischer Fixschritt, State/Commands/Events getrennt von Darstellung | erfüllt | `tests/core.test.ts`: identische Eingaben und unterschiedliche Zeitportionen erzeugen gleiche Zustände; Pause und Reset geprüft. |
| Fünf Wellen, erste bei 5 s, Bedrohung bis 15 s, angekündigter zweiter Zufluss, Überlappung, Schlusswelle, maximal 180 s | erfüllt | Core-Tests und `src/core/arena.ts`; echter RAF-Lauf bis 14 s zeigt erste bedrohte Wohnung, ohne Vorspulen; Timergrenze separat geprüft. |
| Ressourcen, zwei Startgeräte, Regeneration, einmaliger Abschlussbonus | erfüllt | Kern- und Randtests; Vergleichsläufer mit Ausgaben-/Energiebilanz. |
| Pumpe reduziert Stärke, Frost verlangsamt, Werfer schiebt vorderste Front ohne Stärkeschaden | erfüllt | Kern-Randtests und vergleichbare Runden; alle drei Geräte durch echte Canvas-Mausauswahl im Browser gebaut. |
| Genau ein Ausbau je Gerät, Wirkung/Preis/Reichweite sichtbar | erfüllt | Core prüft Ausbauwirkung und Reichweite; Browser kauft Pumpenausbau und verweigert weiteren Ausbau; Auswahl zeigt den wirksamen Routenabschnitt sowie Kosten/Wirkung. |
| Luftkissen 6 s / 20 s und Boot 2 s / 25 s, sofortige Erstverfügbarkeit | erfüllt | Core prüft Dauer, Cooldowns, bedrohte Zielauswahl und Rettung vor tödlichem Treffer; Browser benutzt beide Fähigkeiten über echte Hausauswahl. |
| Drei Schadenstreffer, Kontakt 2 s, Schutz unterbricht, Verlust bleibt, Evakuierte bleiben sicher | erfüllt | Kernprüfungen sowie Browser-Durchbruch und spätere Zerstörung eines zuvor evakuierten Hauses; Häuser tragen Lebens-, Schutz- und Schadensanzeigen. |
| Sieg bei mindestens 12/24, frühe vollständige Verluste, Punkte ohne Schadenfarmen | erfüllt | Gleichstands-/Evakuierungsgrenze im Randtest; Nichtstun endet vorzeitig mit 0 Punkten; Wertung nach Ende unveränderlich. |
| Vergleichbare Runden, bessere Kombination, Rettung nach Durchbruch | erfüllt | `bun tools/compare-rounds.ts` und [Vergleichsrunden](vergleichsrunden.md): gleiche Kaufregel, je 300 Energie; Kombination 16/24, mit Boot 20/24, Monokulturen 0/24. |
| Vollständige Browserrunde, Bau, Ausbau, beide Fähigkeiten, Neustart | erfüllt | `tests/browser/arcade.spec.ts`: sechs Browserprüfungen gegen frischen Produktionsbuild; Vollrunde mit sechs Mauskäufen, übrige Simulationszeit über `advance` beschleunigt. Kein Echtzeit-Dreiminutenbeleg. |
| Pause stoppt Zeit und sperrt Spielaktionen | erfüllt | Core-Negativtests und Browserprüfung, inklusive Fähigkeitsschaltflächen; Fortsetzen ausdrücklich erforderlich. |
| Automatische Pause bei verborgenem Dokument: Handler | erfüllt | Synthetisches `document.hidden` plus `visibilitychange` im Chromium-Test; Rückkehr startet nicht automatisch. |
| Automatische Pause bei echtem Browser-Tabwechsel | offen | Automatisierte Fenster-/Tabversuche lieferten in dieser Laufzeit weiterhin `document.hidden=false`; kein natürlicher Hintergrundwechsel nachgewiesen. Nächster Schritt: im normalen Desktopbrowser einen zweiten Tab aktivieren und Pause/Rückkehr prüfen. |
| Ganze Arena sichtbar, Bau-/Hausauswahl, Pause/Neustart auf üblichen Desktopgrößen | erfüllt | Screenshots bei 1440 × 960 und 1280 × 800 visuell geprüft; Browserassertionen für erreichbare Steuerung auch bei 1366 × 768. Seitenleiste scrollt, Pause/Neustart bleiben sichtbar. |
| Zusammenhängende Wasserzüge, Schaumfronten, Strudel, Eisrisse, Rückstoß, Spritzer, sichtbare Rettung | erfüllt | Renderer und visuell geprüfte Screenshots `arcade-kombination.png`, `arcade-durchbruch.png`, `arcade-rettung.png`, `arcade-echtzeit.png`; kurzlebige Effekte nutzen tatsächliche Eventzeit. |
| Schnelle sichtbare Rückmeldung und kurzer Echtzeitlauf | erfüllt | UI aktualisiert spätestens jeden dritten Renderframe; im gemessenen 14-Sekunden-Lauf ca. 16,7 ms mittlere Framezeit, sichtbare erste Flut und Hauswarnung. Build-/Fähigkeitseingaben aktualisieren Darstellung unmittelbar. Gilt für gemessene Umgebung, keine schwachen Geräte oder vollständige Runde vermessen. |
| Ton schaltbar, visuell verständlich, Kamerawackeln abschaltbar | erfüllt | Browser prüft beide Einstellschalter; WebAudio-Erzeugung im Quelltext, Ereignisse auch sichtbar. Akustische Qualität ist separat offen. |
| Wahrnehmbare Audiowiedergabe und Klangqualität | nicht prüfbar | Keine Hörprobe in der automatisierten Umgebung. Nächster Schritt: im Desktopbrowser Ton an/aus und Warn-/Rettungstöne anhören. |
| README und aktuelle Kriterienmatrix | erfüllt | README ersetzt das frühere Konzept und beschreibt Start, Regeln, Tests, Architektur sowie Abnahmegrenzen. |
| Menschlicher Spielspaß, Verständlichkeit und Schwierigkeitskurve | offen | Keine menschliche Spielsession. Nächster Schritt: mehrere unvorbereitete Desktop-Runden beobachten und gezielt Lesbarkeit, Entscheidungsdruck und Gerätemischung bewerten. |
| Safari, Touch und echte mobile Geräte | nicht prüfbar | In dieser Arcade-Abnahme nicht ausgeübt; ausdrücklich keine Plattform-/Touchfreigabe. |

## Ausgeführte Prüfungen

- `bun run test`: 25 Tests aus zwei Dateien bestanden.
- `bun run test:browser`: Build inklusive Typecheck und sechs Playwright-Chromium-Prüfungen bestanden. Der Test startet den aktuellen Produktionsbuild exklusiv auf Port 4187, ohne fremden Server wiederzuverwenden.
- `bun tools/compare-rounds.ts`: sieben reproduzierbare Strategien, dokumentiert in `vergleichsrunden.md`.
- Kurzer Echtzeitlauf ohne Test-Zeitsprung: erste Hausbedrohung bei 14 simulierten Sekunden nach etwa 14,1 realen Sekunden. Messwerte und genaue Browser-/Systemversion in [browser-evidence.json](browser-evidence.json). Der längere Browser-Sieg ist beschleunigt.
- Keine Browser-JavaScriptfehler in den geprüften Bau-/Rundenpfaden, keine externen Ressourcenabrufe im Starttest. Babylon-Hauptbundle rund 1,02 MB, komprimiert rund 245 KB; Vite weist weiterhin auf einen Chunk größer 500 KB hin.

Die Umgebung war Playwright Chromium 156 auf macOS/Darwin 27.2, arm64, mit WebGL im Headlessbetrieb. Screenshots belegen diese Umgebung, keine Safari-, reale Touch-, Geräte- oder menschliche Abnahme.

## Sichtbelege

- [Startansicht](arcade-start.png)
- [Desktop 1280 × 800](arcade-desktop-1280.png)
- [Erste Bedrohung im echten Lauf](arcade-echtzeit.png)
- [Durchbruch und Hausauswahl](arcade-durchbruch.png)
- [Rettungsboot unterwegs](arcade-rettung.png)
- [Kombinierte Verteidigung](arcade-kombination.png)
- [Rundenergebnis](arcade-ergebnis.png)
