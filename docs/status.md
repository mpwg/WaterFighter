# Tullner Donauauen · Stand und Abnahme

Stand: 31. Oktober 2026. Aktueller Zweig `codex/tulln-3d-flood`. Das sechsminütige Spiel ersetzt den früheren V3-Prototyp.

| Kriterium | Nachweis und Grenze |
| --- | --- |
| Wasser und Ressourcen | Deterministischer 256×192-Kern mit 1/30-Sekunden-Schritten, Wasserbilanz und trockenen Zellen; 36 automatisierte Kern-, Szenen-, Session-, Eingabe- und Rettungsanzeigetests bestanden. |
| Produktionsbuild | TypeScript und Vite bestanden; Hauptbundle ca. 6.3 MB minifiziert / 1.39 MB gzip. Compiler und Schrift lokal, keine CDN-Abhängigkeit. |
| Freie Linien und Rettung | Worker prüft jede Linie exakt, reserviert Material auch bei Pause, entfernt mit Rückerstattung; parallele sechssekündige Hausrettungen mit hausbezogener Restzeit/Fortschritt und Häkchen. Browserprüfungen unter `tests/browser/flood.spec.ts`. |
| Browser | Ausschließlich Headless Chrome unter Ubuntu; WebGPU-Adapter Google SwiftShader ist Software. Keine Hardware-GPU-Abnahme, keine Aussage über flüssige reale Geräte. |
| Historischer Zeitnachweis | [Browsermessdaten](browser-evidence.json) aus der früheren Geometrie: vollständige echte Runde mit exakt360s Simulationszeit in365.958s erfasster Wandzeit, Chrome156.0.8078.4, keine Seitenfehler. Dieser Nachweis wird nicht als aktuelle Geometrieprüfung ausgegeben. |
| Aktuelle Bildprüfung | [Anfang](tulln-realistic-initial.png), [Scheitel](tulln-realistic-crest.png), [Ergebnis](tulln-realistic-results.png) und [bewegte Chrome-Aufnahme](tulln-realistic-accelerated.webm), 1440×960, ausdrücklich beschleunigte Testzeit. |
| Strategien | [Reproduzierbare Messdaten](strategy-evidence.json), erzeugt durch `bun tools/compare-strategies.ts`: gleiche Karte, gleicher Zufluss, keine Rettungen, nur Bau/Schütz variieren. Auswirkungen gelten ausschließlich innerhalb dieses Modells. |
| Landschaft | Geschwungener Fluss, explizite gewachsene Straßen und 34 variable Hausgrundrisse, Waldgruppen und umliegende Hänge. Fotoquellen und lokale CC0-Texturen: [Bildvorlagen](visual-references.md). Stilisiertes Tullner Motiv, keine vermessene Topographie und keine amtliche Gefahrenkarte. |
| Offene Abnahme | Safari ungetestet; physische GPUs, reale Telefone/Touch, natürlicher Tabwechsel sowie menschliche Verständlichkeit und Spielspaß offen. Kein Ersatz durch Browseremulation. |

Die alten V3-Screenshots und HQ100-Vergleichsannahmen dokumentieren einen früheren Prototyp und gelten nicht als Abnahme dieses Zweigs. Es gibt keine fachliche oder rechtliche Freigabe für Hochwasserschutzentscheidungen.

Eine frühere Review vom 30. Oktober 2026 führte zur kombinierten Korrektur von Rettungsanzeigen und neutraler Ergebnisbilanz. Ein gezielter Chrome-Test prüft echte Hausklicks, Fortschritt, Abschluss, wiederholte Auswahl und Pause. [Rettungsmarkierungen](tulln-rescue-markers.png) zeigen aktive und abgeschlossene Häuser gemeinsam. Die Hochqualitätsbilder `tulln-high-*.png` und [Messdaten](high-quality-evidence.json) wurden nach der Korrektur im eingefrorenen Testmodus erneuert; das Ergebnis enthält nur Fakten (keine Behauptung eines Eingriffserfolgs). Die ältere Echtzeitmessung oben und ihre Bilder bleiben als ursprünglicher 360-Sekunden-Nachweis erhalten; ihr Ergebnisbild zeigt den damaligen Text.

Die Überarbeitung vom 31. Oktober verwendet die organische Geometrie aus der Kalibrierung: 34 Häuser/135 Personen, 12.7m Relief, Schützöffnung an Vertex-y57 mit x176..183. Die aktuellen beschleunigten Aufnahmen oben zeigen die neue Karte; die sechsminütige Echtzeitmessung belegt ausschließlich den unveränderten früher getesteten Uhrablauf. Der Renderer verändert weder Solverhöhen noch Wasserbilanz.
