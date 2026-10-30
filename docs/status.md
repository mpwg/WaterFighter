# Die Donau kommt – Stand und Abnahme

Stand: 30. Oktober 2026. HQ100 ist implementiert und automatisiert in Desktop-Chromium geprüft. Die menschliche Spielabnahme steht aus. Der frühere V2-Stand bleibt unter `prototype/v2-preserved-2026-10-30` erhalten.

## Kriterienmatrix

| Kriterium | Status | Beleg und Grenze |
| --- | --- | --- |
| Dreiminütiges HQ100, feste Karte und deterministischer Wasserkern | erfüllt | `src/core/`, `src/render/`; Core-Tests und beschleunigte vollständige HQ100-Browserrunde. Die Karte zeigt reale Ortsnamen auf erfundener Topologie. |
| Drei frei kombinierbare und abwählbare Vorbereitungen | erfüllt | Browserprüfung: Abwahl, Kategorien, genau drei Wahlen, Startschranke. |
| Wasserbilanz, begrenzte Becken, Überläufe und Rückstau | erfüllt | Core-Tests und Vergleichsläufe; Bilanzfehler in allen dokumentierten Runden unter 2e-11. Keine Aussage zur realen Hochwasserprognose. |
| Vier Wehre, Stellzeit, zwei Notdämme und irreversible Dammöffnung | erfüllt | Core-Tests; Browser: Canvas-Mauswahl, Wehrwechsel, Bau und 0,9-s-Hold einschließlich Abbrüchen. |
| Zwei Rettungsteams, Umverteilung, Schäden und Ergebnis Menschen vor Sachwerten | erfüllt | Core-Tests; Browser: Zuweisung/Umverteilung und vollständiges Ergebnis mit sicheren, geretteten, noch in Not befindlichen Menschen und Sachschäden. |
| Pause sperrt Eingriffe und Auswahl, Neustart setzt zurück | erfüllt | Browserprüfung für Canvas, Direktwahl, Test-API-Auswahl und Command-Sperre; eingefrorene Simulationszeit sowie Reset geprüft. |
| Warnung bei 70 s trotz ungültigem Befehl; Fehlermeldung läuft ab | erfüllt | Browser-Regression mit ungültigem Wehrbefehl vor 70 s und erneutem Fehler ohne Folgeereignis. |
| Produktionsbuild und Desktop-Chrome-Browserpfad | erfüllt | `bun run test:browser`: Typecheck, Vite-Build und sechs Playwright-Tests auf exklusivem Port 4187. Keine UI-JavaScriptfehler oder externen Laufzeitanfragen in diesen Pfaden. |
| Kurzer Echtzeitlauf mit RAF | erfüllt | 15,001 s Wandzeit und 14,967 s Simulationszeit, Karte mit sichtbarem Wasserfluss; [Messdaten](browser-evidence.json). Kein Nachweis einer vollständigen Echtzeit-Dreiminutenrunde oder exakter Bildrate. |
| Ganze Karte und feste Bedienung bei 1280×800 und 1440×960 | erfüllt | Browser-Viewport-Assertions mit `ratio: 1` für die ganze Karte und visuell geprüfte Screenshots. Seitenleiste ist bei Bedarf scrollbar. |
| Natürlicher Tabwechsel pausiert automatisch | offen | Ein zweiter Browser-Tab wurde aktiviert; in dieser Headless-Umgebung blieb `document.hidden=false` und die Runde lief weiter. Handler vorhanden, aber natürliche Hintergrundpause nicht nachgewiesen. Im sichtbaren Desktopbrowser prüfen. |
| Drei menschliche HQ100-Spielrunden, Verständlichkeit und Spielspaß | offen | [Spieltest-Leitfaden](spieltest.md); noch keine menschliche Runde. |
| HQ10, HQ50, HQ500 und HQ1000 | offen | Bis nach drei menschlichen HQ100-Runden und Entscheidung über Verständlichkeit und Spielspaß zurückgestellt. |
| Safari, Touch und mobile Geräte | nicht prüfbar | Nicht Teil der ausgeführten Desktop-Chromium-Abnahme; keine Plattformfreigabe. |

## Ausgeführte Belege

- `bun run test`: 24 Kernprüfungen bestanden. `bun run test:browser`: sechs Browserprüfungen bestanden; nach den letzten Testschärfungen zusätzlich zwei gezielte Browserprüfungen. Ein 15-Sekunden-Lauf nutzte echte RAF-Zeit; die vollständige Runde verwendete die nur mit `?test=1` erreichbare Beschleunigung.
- `bun --bun tools/compare-rounds.ts`: acht deterministische HQ100-Strategien mit identischen drei Speicher-Vorbereitungen; [Werte und Grenzen](vergleichsrunden.md).
- Browser: Chromium 156.0.8078.4, macOS/Darwin 27.2.0 arm64, Viewports 1280×800 und 1440×960. [Start](v3-start.png), [Echtzeit nach 15 s](v3-echtzeit.png), [Flut nach weiteren 90 beschleunigten Simulationssekunden](v3-flut.png), [Ergebnis](v3-ergebnis.png). Diese Screenshots sind Desktop-Chrome-Belege, keine Geräte- oder menschliche Abnahme.
