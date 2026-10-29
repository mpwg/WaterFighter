# WaterFighter – Status und Kriterienmatrix

Stand: 29. Oktober 2026.

## Aktueller Stand

Die Projektgrundlage ist geprüft. Ein vorläufiges Wiener Szenariopaket wird aus Rohdaten erzeugt und vom Worker geladen; die Vorschau unterstützt Bauaktionen und eine vorläufige Flutkurve, ist aber noch keine vollständig abgestimmte Spielrunde. AP 2–6 sind in Arbeit, AP 7 ist offen. Keine Veröffentlichung oder Geräteabnahme erfolgte.

## Arbeitspakete

| Paket | Status | Tatsächlicher Nachweis | Nächster Schritt |
| --- | --- | --- | --- |
| AP 1 – Projektgrundlage | geprüft | Build, Typprüfung, Protokolltest, Entwicklungsserver und Browserlauf bestanden; Szene visuell geprüft | Bei Änderungen erneut prüfen |
| AP 2 – Wiener Geodaten | in Arbeit | DGM und OSM bezogen, vorläufiges Szenariopaket zweimal bytegleich erzeugt und im Browser geladen: [Voruntersuchung](geodaten-voruntersuchung.md) | Bruchkanten-Näherung und Durchlässe prüfen, zwei Wasserwege und Lizenzpflichten belegen |
| AP 3 – Simulation | in Arbeit | Synthetische Solver- und Bilanztests; früher Desktop-Leistungstest auf Szenarioentwurf: [Solverbericht](solverbericht.md) | Zuflusskurve, Dammöffnung, Spielintegration und mobile Leistung prüfen |
| AP 4 – Darstellung | in Arbeit | Szenarioansicht und Worker-Snapshots, Maus-/Touch-Kamerasteuerung; zwei Playwright-Chromium-Abläufe | Strömungsanimation und Schadensanzeige auf tatsächlichen Geräten prüfen |
| AP 5 – Werkzeuge/Schäden | in Arbeit | Worker-Regeln, Vorschau, Bestätigung, Budget und Schadenstests; drei Werkzeuge in Playwright-Chromium bedient | Wirkungsnachweise weiter abstimmen und Bedienung auf Geräten prüfen |
| AP 6 – Spielrunde | in Arbeit | Ergebnisanzeige und numerische Referenzstrategie; verkürzter Browserablauf | Strategie auf echten Geräten prüfen; Werkzeugnutzen im Szenario belegen |
| AP 7 – Gesamtprüfung | offen | Abnahmeverfahren spezifiziert | Browser und reale Geräte prüfen |

### Bisherige Prüfungen

- Node.js 24.22.0, npm 12.2.0; Vite 8.3.5, Babylon.js 9.33.0, Vitest 5.0.5 und Playwright 1.64.1 sind in der Lockdatei festgelegt.
- `npm run build` und `npm test` bestanden (ein Protokolltest); `npm run dev` startete und lieferte HTML über HTTP.
- `npm run test:browser` scheiterte zunächst an fehlenden Systembibliotheken. Nach temporärem Entpacken der Ubuntu-Bibliotheken unter `/tmp/waterfighter-libs` bestand `LD_LIBRARY_PATH=/tmp/waterfighter-libs/root/usr/lib/x86_64-linux-gnu npm run test:browser` in Playwright-Chromium; Worker-Meldung und Canvas waren sichtbar. Ein Screenshot der Entwickleransicht zeigte die grüne Fläche. Das ist keine Desktop-Browserabnahme.
- `gdalinfo` ist auf diesem Rechner nicht vorhanden; Rasterio verwendet GDAL 3.12.2. Die Voruntersuchung dokumentiert Rohdatenprüfsummen und zwei bytegleiche Pipeline-Läufe. Build, 29 Vitest-Tests, zwei Python-Tests und elf Playwright-Chromium-Tests bestanden nach Einbindung des Szenarioladers und des Solvers. Geräteverfügbarkeit ist noch zu prüfen.

## Kriterienmatrix

| Kriterium | Status | Beleg beziehungsweise fehlender Nachweis |
| --- | --- | --- |
| Spielkonzept dokumentiert | erfüllt | `spielplan.md` |
| AP 1–7 mit Schnittstellen und Abnahme dokumentiert | erfüllt | `umsetzungsplan.md` |
| Goal-Übergabe dokumentiert | erfüllt | `goal-auftrag.md` |
| Historische Untersuchung erhalten; README aktualisiert | erfüllt | `archiv/enginevergleich-3d.md`, `../README.md` |
| Build, Typprüfung, Entwicklungsserver und Worker-Start | erfüllt | Build, Server, Protokolltest und Worker-Initialisierung in Playwright-Chromium geprüft |
| Reproduzierbares reales Wiener Szenario | offen | Version 1.2-draft mit approximierten Bruchlinien; Orthofotoüberlagerung geprüft, Durchlässe, Eignung und Lizenzpflichten offen |
| Ausrichtung, Höhenbezug, Datenlücken und Quellen geprüft | offen | Orthofotoüberlagerung, Höhenbezug und endliche Rasterwerte geprüft; fachliche Datenlücken und Bruchkanteninterpretation offen |
| Stabiler Solver und Bilanzfehler unter 0,1 % | offen | Geschlossenes Becken und bilanziertes Zu-/Abfluss-Testfeld bestehen; vollständige Stabilitäts- und Integrationsprüfung fehlt |
| Plausible Flutwelle, Barrieren und Überströmung | offen | Symmetrische Welle, Dammöffnung und überströmbare Barriere numerisch geprüft; visuelle Wellenkontrolle fehlt |
| 2,5D-Ansicht, Touch-Modi und Fehlerbehandlung | offen | Karten- und Werkzeugmodi, Strömungsmarker und Zustandsabfrage vorhanden; tatsächliche Geräte und umfassende Fehlerprüfung fehlen |
| Atomare Aktionen, Budget, Wassererhaltung und Schadenswertung | offen | Regel-, Worker- und hydraulische Tests sowie Werkzeugvergleiche im Szenario bestehen; Geräteprüfungen fehlen |
| Vollständige Runde und bezahlbare erfolgreiche Strategie | offen | Version 1.2: ohne Maßnahmen 322.771,10 Schaden; vollständige automatisierte 2×-Browserrunde mit Strategie 0 bei Budgetrest 2.600. Menschliche Gerätebedienung fehlt |
| Neustart und Schutz vor alten/doppelten Nachrichten | offen | Uhr, Raster und Aktionszustand sowie alte/doppelte Nachrichten in Tests geprüft; vollständige Runden fehlen |
| Tatsächliche Desktop-Abnahme Safari/Chrome/Firefox | offen | Chrome 156: elf Headless-Abläufe; Firefox 159: virtuelle Desktop-Abläufe und vollständige 2×-Runde; Safari und manuelle Abnahme offen |
| Echte iPhone-/Android-Abnahme | nicht prüfbar | Lokal kein Smartphone sichtbar und `adb`/`idevice_id` fehlen; Zugang zu echten Geräten bereitstellen |
| Mobile Framezeiten, Simulationsrate und Aktionslatenz | nicht prüfbar | Keine echten Smartphones lokal erreichbar; Messung auf beiden Geräten erforderlich |
| Drei stabile aufeinanderfolgende Runden | offen | Drei 2×-Runden im vorigen Build bestanden; JS-Heap ohne fortlaufenden Anstieg, Prozessspeicher und endgültiger Build offen: [Browserprüfung](browser-pruefung.md) |
| Statischer Produktionsbuild und vollständige Quellenhinweise | offen | Build vorhanden; vollständige Quellen- und Lizenzprüfung fehlt |

„Offen“ bedeutet hier, dass die Arbeit noch auszuführen ist. „Nicht prüfbar“ darf erst eingetragen werden, wenn ein konkretes Hindernis ermittelt und beschrieben wurde. Untersuchte, aber nicht erreichbare reale Geräte wären ein solcher Fall; ihr Fehlen wird aktuell nicht behauptet.

## Fortsetzung

AP 2 benötigt insbesondere hydraulische Interpretation der Bruchkanten, zwei geeignete Wasserwege und Lizenzprüfung. Der Solver wurde unabhängig davon bereits begonnen; Szenarioabnahme und Solverabnahme bleiben offen. Die verbleibenden Kriterien und die reale Geräteabnahme sind offen.

Lokale Geräteprüfung: USB zeigte ein QEMU-Tablet und Controller; `adb`, `idevice_id`, `xcrun`, Chrome und Firefox waren nicht im Pfad. Safari ist auf diesem Linux-Rechner nicht verfügbar. Ein entfernter Gerätezugang wurde nicht ausgeschlossen. Die vollständige Chromium-Headless-Runde und ihre Grenzen sind im [Solverbericht](solverbericht.md#vollständige-browserrunde-vorheriger-build) dokumentiert.

Die Auswahlkoordinaten wurden zusätzlich mit verdoppelter Babylon-Renderauflösung im Entwicklungsbrowser überprüft; dies ersetzt keinen Touch-Test auf echter Hardware.
