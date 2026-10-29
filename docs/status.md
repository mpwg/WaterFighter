# WaterFighter – Status und Kriterienmatrix

Stand: 29. Oktober 2026.

## Aktueller Stand

Der spielbare Prototyp lädt ein vorläufiges Wiener Szenariopaket, berechnet die Flut im Worker und bietet alle drei Werkzeuge sowie Ergebnis und Neustart. Eine vollständige automatisierte Runde und eine erfolgreiche Dammstrategie sind belegt. Die Szenario- und Gesamtprüfungen bleiben in Arbeit; echte Mobilgeräte und Safari wurden nicht abgenommen. Eine öffentliche Veröffentlichung erfolgte nicht.

## Arbeitspakete

| Paket | Status | Tatsächlicher Nachweis | Nächster Schritt |
| --- | --- | --- | --- |
| AP 1 – Projektgrundlage | geprüft | Build, Typprüfung, Protokolltest, Entwicklungsserver und Browserlauf bestanden; Szene visuell geprüft | Bei Änderungen erneut prüfen |
| AP 2 – Wiener Geodaten | in Arbeit | DGM und OSM bezogen, vorläufiges Szenariopaket zweimal bytegleich erzeugt und im Browser geladen: [Voruntersuchung](geodaten-voruntersuchung.md) | Bruchkanten und Durchlässe fachlich einordnen, Wasserwege und Lizenzpflichten belegen |
| AP 3 – Simulation | in Arbeit | Synthetische Solver- und Bilanztests, Sichtkontrolle der Dammöffnung, 600-s-Szenariolauf und Schrittweitenvergleich: [Solverbericht](solverbericht.md) | hohe lokale Tiefen einordnen und mobile Leistung prüfen |
| AP 4 – Darstellung | in Arbeit | Szenarioansicht, Strömungsmarker, Worker-Snapshots und Maus-/Touch-Kamerasteuerung; 19 Chrome-Browserprüfungen | Strömungsanimation und Schadensanzeige auf tatsächlichen Geräten prüfen |
| AP 5 – Werkzeuge/Schäden | in Arbeit | Worker-Regeln, Vorschau, Bestätigung, Budget und Schadenstests; drei Werkzeuge in Playwright-Chromium bedient | Wirkungsnachweise weiter abstimmen und Bedienung auf Geräten prüfen |
| AP 6 – Spielrunde | in Arbeit | vollständige Browserrunden und erfolgreiche Dammstrategie; Werkzeugvergleiche im Szenario | Strategie auf echten Geräten prüfen; Werkzeugnutzen im Szenario belegen |
| AP 7 – Gesamtprüfung | offen | Chrome- und Firefox-Abläufe, vollständige Runden und Messverfahren dokumentiert | Safari, reale Geräte und verbleibende Kriterien prüfen |

### Bisherige Prüfungen

- Node.js 24.22.0, npm 12.2.0; TypeScript 7.0.2, Vite 8.3.5, Babylon.js 9.33.0, Vitest 5.0.5 und Playwright 1.64.1 sind in der Lockdatei festgelegt. Am 29. Oktober 2026 waren alle direkten npm- und festgelegten Python-Abhängigkeiten auf den aktuellen stabilen Versionen; indirekte Abhängigkeiten folgen den Vorgaben ihrer Elternpakete.
- `npm run build` und `npm test` bestanden (ein Protokolltest); `npm run dev` startete und lieferte HTML über HTTP.
- `npm run test:browser` scheiterte zunächst an fehlenden Systembibliotheken. Nach temporärem Entpacken der Ubuntu-Bibliotheken unter `/tmp/waterfighter-libs` bestand `LD_LIBRARY_PATH=/tmp/waterfighter-libs/root/usr/lib/x86_64-linux-gnu npm run test:browser` in Playwright-Chromium; Worker-Meldung und Canvas waren sichtbar. Ein Screenshot der Entwickleransicht zeigte die grüne Fläche. Das ist keine Desktop-Browserabnahme.
- `gdalinfo` ist auf diesem Rechner nicht vorhanden; Rasterio verwendet GDAL 3.12.2. Die Voruntersuchung dokumentiert Rohdatenprüfsummen und zwei bytegleiche Pipeline-Läufe. Build, 32 Vitest-Tests und 19 Chrome-Browserprüfungen bestanden nach der Wasseroptimierung; der zusätzliche Integrationstest für laufende Eingriffe ergibt nun 33 bestandene Vitest-Tests. Zwei Python-Tests bestanden zuvor. Lokale Geräteverfügbarkeit ist unten dokumentiert.

## Kriterienmatrix

| Kriterium | Status | Beleg beziehungsweise fehlender Nachweis |
| --- | --- | --- |
| Spielkonzept dokumentiert | erfüllt | `spielplan.md` |
| AP 1–7 mit Schnittstellen und Abnahme dokumentiert | erfüllt | `umsetzungsplan.md` |
| Goal-Übergabe dokumentiert | erfüllt | `goal-auftrag.md` |
| Historische Untersuchung erhalten; README aktualisiert | erfüllt | `archiv/enginevergleich-3d.md`, `../README.md` |
| Build, Typprüfung, Entwicklungsserver und Worker-Start | erfüllt | Build, Server, Protokolltest und Worker-Initialisierung in Playwright-Chromium geprüft |
| Reproduzierbares reales Wiener Szenario | offen | Version 1.2-draft mit approximierten Bruchlinien; lokales Quellenarchiv und unabhängiger Neuaufbau geprüft, Orthofotoüberlagerung und Kreuzungsstellen untersucht; Durchlässe, Eignung und Lizenzpflichten offen |
| Ausrichtung, Höhenbezug, Datenlücken und Quellen geprüft | offen | Orthofotoüberlagerung, Höhenbezug und endliche Rasterwerte geprüft; fachliche Datenlücken und Bruchkanteninterpretation offen |
| Stabiler Solver und Bilanzfehler unter 0,1 % | offen | Geschlossenes Becken, bilanziertes Zu-/Abfluss-Testfeld, 600-s-Szenariolauf und Schrittweitenvergleich bestehen; Einordnung der hohen lokalen Tiefe und Geräteprüfung fehlen |
| Plausible Flutwelle, Barrieren und Überströmung | offen | Symmetrische Welle, Dammöffnung und überströmbare Barriere numerisch geprüft; [synthetische Sichtkontrolle](solverbericht.md#sichtkontrolle-der-dammöffnung) vorhanden |
| 2,5D-Ansicht, Touch-Modi und Fehlerbehandlung | offen | Karten- und Werkzeugmodi, Strömungsmarker und Zustandsabfrage vorhanden; tatsächliche Geräte und umfassende Fehlerprüfung fehlen |
| Atomare Aktionen, Budget, Wassererhaltung und Schadenswertung | offen | Regel-, Worker- und hydraulische Tests einschließlich aller drei Eingriffe bei laufender Uhr und Werkzeugvergleiche im Szenario bestehen; Geräteprüfungen fehlen |
| Vollständige Runde und bezahlbare erfolgreiche Strategie | offen | Version 1.2: ohne Maßnahmen 322.771,10 Schaden; vollständige automatisierte 2×-Browserrunde auf Anwendungscode `d72a25e` mit Strategie 0 bei Budgetrest 2.600. Menschliche Gerätebedienung fehlt |
| Neustart und Schutz vor alten/doppelten Nachrichten | offen | Uhr, Raster, Kamera, Werkzeugmodus und Aktionszustand sowie alte/doppelte Nachrichten in Tests geprüft; drei vollständige Neustartrunden auf Anwendungscode `40ff739` bestanden |
| Tatsächliche Desktop-Abnahme Safari/Chrome/Firefox | offen | Chrome 156: 19 Headless-Abläufe; Firefox 159: virtuelle Desktop-Abläufe und vollständige 2×-Runde nach Wasseroptimierung; in einem separaten Test mit deaktivierter Firefox-Content-Sandbox sind Texte lesbar; Safari und manuelle Abnahme offen |
| Echte iPhone-/Android-Abnahme | nicht prüfbar | Lokal kein Smartphone sichtbar und `adb`/`idevice_id` fehlen; Zugang zu echten Geräten bereitstellen |
| Mobile Framezeiten, Simulationsrate und Aktionslatenz | nicht prüfbar | Messskript in vollständiger Desktop-1×-Runde geprüft: Framezeit-Ziel mit Softwaregrafik verfehlt; keine echten Smartphones lokal erreichbar: [Verfahren](mobil-messung.md) |
| Drei stabile aufeinanderfolgende Runden | offen | Drei 2×-Runden auf dem optimierten Produktionsbuild `3bbc7af` mit Pause, Zoom und Neustart bestanden; nach der Menüänderung erneut zu prüfen. Speicherstichproben steigen; zwölf kurze Neustarts mit Seiten- und Worker-Garbage-Collection sowie Prozessrollen untersucht; Ursachen und Langzeitverhalten bleiben offen: [Browserprüfung](browser-pruefung.md) |
| Statischer Produktionsbuild und vollständige Quellenhinweise | offen | Produktionsbuild unter Unterpfad einschließlich Worker und Szenario geprüft; vollständige Lizenzprüfung fehlt |

„Offen“ bedeutet hier, dass die Arbeit noch auszuführen ist. „Nicht prüfbar“ darf erst eingetragen werden, wenn ein konkretes Hindernis ermittelt und beschrieben wurde. Die lokale Gerätesuche ist unten dokumentiert; ein entfernter Gerätezugang wurde nicht ausgeschlossen.

## Fortsetzung

AP 2 benötigt insbesondere hydraulische Interpretation der Bruchkanten, zwei geeignete Wasserwege und Lizenzprüfung. Zwei statische Landkorridore wurden geprüft, jedoch in der Referenzflut nicht vollständig nass; Momentaufnahmen zeigen getrennte nasse Bereiche; Flussauswertung an zwei ausgewählten Uferabschnitten belegt dort keine zwei wirksamen Umleitungen. Der Solver wurde unabhängig davon bereits begonnen; Szenarioabnahme und Solverabnahme bleiben offen. Die verbleibenden Kriterien und die reale Geräteabnahme sind offen.

Lokale Geräteprüfung: USB zeigte ein QEMU-Tablet und Controller; `adb`, `idevice_id`, `xcrun`, Chrome und Firefox waren nicht im Pfad. Safari ist auf diesem Linux-Rechner nicht verfügbar. Chrome und Firefox wurden später temporär installiert; ein entfernter Gerätezugang wurde nicht ausgeschlossen. Die vollständige Chromium-Headless-Runde und ihre Grenzen sind im [Solverbericht](solverbericht.md#vollständige-browserrunde-vorheriger-build) dokumentiert.

Die Auswahlkoordinaten wurden zusätzlich mit verdoppelter Babylon-Renderauflösung im Entwicklungsbrowser überprüft; dies ersetzt keinen Touch-Test auf echter Hardware.
