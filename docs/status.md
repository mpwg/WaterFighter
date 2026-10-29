# WaterFighter – Status und Kriterienmatrix

Stand: 29. Oktober 2026.

## Aktueller Stand

Die Projektgrundlage ist geprüft. Ein vorläufiges Wiener Szenariopaket wird aus Rohdaten erzeugt und vom Worker geladen; die Vorschau unterstützt Bauaktionen und eine vorläufige Flutkurve, ist aber noch keine vollständig abgestimmte Spielrunde. AP 2–5 sind in Arbeit, AP 6–7 sind offen. Keine Veröffentlichung oder Geräteabnahme erfolgte.

## Arbeitspakete

| Paket | Status | Tatsächlicher Nachweis | Nächster Schritt |
| --- | --- | --- | --- |
| AP 1 – Projektgrundlage | geprüft | Build, Typprüfung, Protokolltest, Entwicklungsserver und Browserlauf bestanden; Szene visuell geprüft | Bei Änderungen erneut prüfen |
| AP 2 – Wiener Geodaten | in Arbeit | DGM und OSM bezogen, vorläufiges Szenariopaket zweimal bytegleich erzeugt und im Browser geladen: [Voruntersuchung](geodaten-voruntersuchung.md) | Referenzüberlagerung, Eignung und fertige reproduzierbare Pipeline prüfen |
| AP 3 – Simulation | in Arbeit | Synthetische Solver- und Bilanztests; früher Desktop-Leistungstest auf Szenarioentwurf: [Solverbericht](solverbericht.md) | Zuflusskurve, Dammöffnung, Spielintegration und mobile Leistung prüfen |
| AP 4 – Darstellung | in Arbeit | Szenarioansicht und Worker-Snapshots, Maus-/Touch-Kamerasteuerung; zwei Playwright-Chromium-Abläufe | Werkzeuge, Strömungsanimation, Schäden und tatsächliche Geräte prüfen |
| AP 5 – Werkzeuge/Schäden | in Arbeit | Worker-Regeln, Vorschau, Bestätigung, Budget und Schadenstests; drei Werkzeuge in Playwright-Chromium bedient | Wirkungsnachweise, Bedienung auf Geräten und Prüfung der Gebäuderasterung |
| AP 6 – Spielrunde | offen | Ablauf spezifiziert | Implementieren und abstimmen |
| AP 7 – Gesamtprüfung | offen | Abnahmeverfahren spezifiziert | Browser und reale Geräte prüfen |

### Bisherige Prüfungen

- Node.js 24.22.0, npm 12.2.0; Vite 8.3.5, Babylon.js 9.33.0, Vitest 5.0.5 und Playwright 1.64.1 sind in der Lockdatei festgelegt.
- `npm run build` und `npm test` bestanden (ein Protokolltest); `npm run dev` startete und lieferte HTML über HTTP.
- `npm run test:browser` scheiterte zunächst an fehlenden Systembibliotheken. Nach temporärem Entpacken der Ubuntu-Bibliotheken unter `/tmp/waterfighter-libs` bestand `LD_LIBRARY_PATH=/tmp/waterfighter-libs/root/usr/lib/x86_64-linux-gnu npm run test:browser` in Playwright-Chromium; Worker-Meldung und Canvas waren sichtbar. Ein Screenshot der Entwickleransicht zeigte die grüne Fläche. Das ist keine Desktop-Browserabnahme.
- `gdalinfo` ist auf diesem Rechner nicht vorhanden; Rasterio verwendet GDAL 3.12.2. Die Voruntersuchung dokumentiert Rohdatenprüfsummen und zwei bytegleiche Pipeline-Läufe. Build, 20 Vitest-Tests und vier Playwright-Chromium-Tests bestanden nach Einbindung des Szenarioladers und des Solvers. Geräteverfügbarkeit ist noch zu prüfen.

## Kriterienmatrix

| Kriterium | Status | Beleg beziehungsweise fehlender Nachweis |
| --- | --- | --- |
| Spielkonzept dokumentiert | erfüllt | `spielplan.md` |
| AP 1–7 mit Schnittstellen und Abnahme dokumentiert | erfüllt | `umsetzungsplan.md` |
| Goal-Übergabe dokumentiert | erfüllt | `goal-auftrag.md` |
| Historische Untersuchung erhalten; README aktualisiert | erfüllt | `archiv/enginevergleich-3d.md`, `../README.md` |
| Build, Typprüfung, Entwicklungsserver und Worker-Start | erfüllt | Build, Server, Protokolltest und Worker-Initialisierung in Playwright-Chromium geprüft |
| Reproduzierbares reales Wiener Szenario | offen | Entwurf wird aus festgehaltenen Rohdaten bytegleich erzeugt; Geometrie, Barrieren, Eignung und Lizenzpflichten noch nicht vollständig geprüft |
| Ausrichtung, Höhenbezug, Datenlücken und Quellen geprüft | offen | Höhenbezug und Rohdatenquellen dokumentiert; Überlagerung und Lückenprüfung fehlen |
| Stabiler Solver und Bilanzfehler unter 0,1 % | offen | Geschlossenes Becken und bilanziertes Zu-/Abfluss-Testfeld bestehen; vollständige Stabilitäts- und Integrationsprüfung fehlt |
| Plausible Flutwelle, Barrieren und Überströmung | offen | Symmetrische Welle und überströmbare Barriere numerisch geprüft; Dammöffnung und visuelle Kontrolle fehlen |
| 2,5D-Ansicht, Touch-Modi und Fehlerbehandlung | offen | Erste Kartenansicht und Kamera; Werkzeugmodus, Animation und umfassende Fehlerprüfung fehlen |
| Atomare Aktionen, Budget, Wassererhaltung und Schadenswertung | offen | Regel- und Worker-Tests bestehen für Vorschau, Doppelübermittlung, Graben, Abriss und Schadenszählung; Wirkungs- und Geräteprüfungen fehlen |
| Vollständige Runde und bezahlbare erfolgreiche Strategie | offen | Vorläufige Referenz ohne Maßnahmen: Schaden 324.070,77; erfolgreiche Strategie und Ergebnisansicht fehlen |
| Neustart und Schutz vor alten/doppelten Nachrichten | offen | Uhr und Raster-Neustart sowie alte Runden getestet; Bauaktionen und doppelte Nachrichten fehlen |
| Tatsächliche Desktop-Abnahme Safari/Chrome/Firefox | offen | Keine Browserläufe |
| Echte iPhone-/Android-Abnahme | offen | Gerätezugriff noch nicht untersucht; keine Geräteprüfungen |
| Mobile Framezeiten, Simulationsrate und Aktionslatenz | offen | Keine Messungen |
| Drei stabile aufeinanderfolgende Runden | offen | Keine Laufzeitprüfung |
| Statischer Produktionsbuild und vollständige Quellenhinweise | offen | Build vorhanden; vollständige Quellen- und Lizenzprüfung fehlt |

„Offen“ bedeutet hier, dass die Arbeit noch auszuführen ist. „Nicht prüfbar“ darf erst eingetragen werden, wenn ein konkretes Hindernis ermittelt und beschrieben wurde. Untersuchte, aber nicht erreichbare reale Geräte wären ein solcher Fall; ihr Fehlen wird aktuell nicht behauptet.

## Fortsetzung

AP 2 benötigt insbesondere die unabhängige Referenzüberlagerung der vollständigen Geometrie, Bruchkanten, zwei geeignete Wasserwege und Lizenzprüfung. Der Solver wurde unabhängig davon bereits begonnen; Szenarioabnahme und Solverabnahme bleiben offen. Die verbleibenden Kriterien und die reale Geräteabnahme sind offen.
