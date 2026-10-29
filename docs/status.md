# WaterFighter – Status und Kriterienmatrix

Stand: 29. Oktober 2026.

**Nächster Implementierungsauftrag für Terra:** [Review und Kurskorrektur zur Spielbarkeit](review-steuerung-terra.md). Nutzerpriorität: Vorbereitung und Eingriffe während der Flut gleichwertig verbessern; sinnvollen Werkzeugnutzen und sichtbares Schadensfeedback vor weiteren Detailoptimierungen belegen. Der Auftrag ist in Arbeit; vollständige Abnahme bleibt offen.

## Aktueller Stand

Der spielbare Prototyp lädt ein vorläufiges Wiener Szenariopaket, berechnet die Flut im Worker und bietet alle drei Werkzeuge sowie Ergebnis und Neustart. Eine vollständige automatisierte Runde und eine erfolgreiche Dammstrategie sind belegt. Die Szenario- und Gesamtprüfungen bleiben in Arbeit; echte Mobilgeräte und Safari wurden nicht abgenommen. Eine öffentliche Veröffentlichung erfolgte nicht.

Der [Review-Steuerungsauftrag](review-steuerung-terra.md) priorisiert Spielgefühl und zwei nachvollziehbare Schutzansätze. Die vorgeschlagenen kürzeren Damm- und Ableitungskandidaten samt Kontrollfällen wurden unabhängig numerisch verglichen; der offene Westrand und die 3-m-Grabentiefe wurden als dokumentierte Spielannahmen in den Entwurf 1.4 übernommen: [Solverbericht](solverbericht.md#review-kandidaten-mit-zusätzlichem-westlichem-modellabfluss).

Ein [Gebäudevergleich auf Version 1.4](review-gebaeudevergleich.md) zeigt die Schutzwirkung beider Strategien und den geopferten Grundriss. Ein einzelner Abriss senkt den Gesamtschaden um 3.950,98 bei Kosten von 1.106; er erreicht allein das Schadensziel nicht. Die kombinierte Ableitung spart gegenüber den zwei Dämmen 1.121,23 Gesamtschaden bei 2.202 zusätzlichen Maßnahmenkosten. Die wirtschaftliche Wirkung hängt somit vom gewählten Vergleichsmaßstab und Einsatzort ab.

Für diese Kandidaten wurden außerdem gemeinsame Eingriffe zu verschiedenen Flutzeitpunkten und einzelne Zellverschiebungen berechnet. Die Dammvariante erreicht das Ziel bei 120 s noch, bei 130 s nicht mehr; dies ist keine menschliche Platzierungszeit. Ablehnungen unterscheiden nun Kartenrand, bestehende Dämme und Gebäudehindernisse. Weitere Szenarioabstimmung und ein Bedienungstest ohne Testkoordinaten bleiben offen.

Die Grabenvorschau weist auf modellierte Geländekanten hin, die durch die geplanten Zellen zusammen mit bereits ausgehobenen Zellen abgesenkt würden. Der Worker berechnet die Anzahl vor der Bestätigung. Ein Regeltest prüft auch den Anschluss an einen vorhandenen Graben; ein Chromium-Test nutzt eine künstlich eingesetzte Kante und prüft Hinweis, unverändertes Budget vor Bestätigung und anschließende Ausführung. Produktionsbuild und 53 Vitest-Tests bestanden; menschliche Verständlichkeit und echte Geräte bleiben offen.

Der längere Kantenhinweis schob im ersten emulierten Querformattest die Bestätigung unter den Bildschirm. Eine breitere Vorschau bei geringer Fensterhöhe behebt dies für die getesteten Ansichten: In Chromium mit emulierter Touchbedienung waren Hinweis und beide Schaltflächen bei 480 × 320 und 320 × 480 erreichbar; auch die bisherige kurze Vorschau bestand in beiden Ansichten. Die Kante wurde im Test künstlich ergänzt. Echte Smartphones bleiben ungeprüft.

Ein zusätzlicher Regeltest auf dem ausgelieferten Szenario 1.4 prüft den kurzen Graben durch die zuvor untersuchten Kanten `x:7072` und `x:7073`: Die Vorschau meldet zwei Kanten ohne Zustandsänderung; die bestätigte Aktion senkt beide tatsächlich um die konfigurierte Grabentiefe. Die 13 Tests der Spielregeln bestanden. Das belegt die konkrete Zuordnung im Spielmodell, keine reale Schutzfunktion der Kanten.

Nach einer Bestätigung zeigt die Vorschau „Maßnahme wird ausgeführt“; Verwerfen und Werkzeugwechsel bleiben bis zur Workerantwort gesperrt. Ein Chromium-Test verzögert die Übermittlung künstlich und prüft die Sperre, das unveränderte Budget während des Wartens und die anschließende Ausführung. Produktionsbuild, 54 Vitest-Tests und zwei gezielte Chromium-Prüfungen bestanden; die Verzögerung ist ein Testaufbau und keine gemessene Geräte-Latenz.

Die Wartephase wurde ergänzend in Chromium mit kontrolliert zurückgehaltener Aktion geprüft: Nach Ablehnung sind Verwerfen und Werkzeugwahl wieder verfügbar; nach Neustart beeinflusst eine erst danach zugestellte Aktion aus der alten Runde weder Budget noch neue Grabenvorschau. Alle drei Prüfungen dieser Datei und die Typprüfung bestanden. Die Ablehnung wurde durch eine testseitig veränderte Worker-Nachricht ausgelöst.

Auf dem Produktionsbuild von Anwendungscode `803b812` bestanden alle 42 Chromium-Browserprüfungen unter Linux mit Softwaregrafik, einschließlich der Grabenvorschau und emulierten Touchbedienung. Die Prüfungen ersetzen keine vollständige menschliche Bedienung oder Abnahme auf echten Geräten.

Eine passive Modellmarkierung am Eingang des experimentellen Ableitungsgrabens zeigt, dass ein Teil vier Querschnitte in Reihenfolge passiert und den offenen Modellrand erreicht; der Kontrolllauf ohne Graben zeigt dies nicht. Dieser Nachweis beschreibt den numerischen Ausschnitt, keine reale sichere Ableitung: [Solverbericht](solverbericht.md#markierter-verlauf-im-experimentellen-ableitungsgraben).

Die experimentelle Kombination wurde außerdem über die Oberfläche im instrumentierten Entwicklungsbrowser gesetzt und in einer vollständigen 2×-Runde erfolgreich gespielt. Das Bedienfeld verdeckte zunächst das betroffene Gebäude; der Graben ist in der Übersicht schwer erkennbar. Der historische Test verwendete projizierte Koordinaten und ein testseitig verändertes Szenario: [Browserprüfung](browser-pruefung.md#experimentelle-ableitungsstrategie-im-browser). Ein späterer [Produktionslauf der Referenz](browser-pruefung.md#referenzrunde-mit-strömungsmarkern) ist inzwischen dokumentiert; menschliche Bedienbarkeit bleibt offen.

Bestätigte Gräben werden nun anhand der Worker-Zellen braun auf dem Gelände markiert und beim Neustart entfernt. Ein Vorbereitungs-Sichttest zeigt die Markierung bei ausgeblendetem Menü; sie bleibt in der Übersicht schmal und kann durch Wasser verdeckt werden. Echte Geräte bleiben ungeprüft: [Browserprüfung](browser-pruefung.md#bestätigte-gräben-sichtbar-machen).

Zusätzliche, auf 200 begrenzte Strömungsmarker tasten bestätigte Grabenzellen anhand der Worker-Impulswerte ab; beim Neustart werden sie entfernt. Eine [Sichtprobe numerischer Landgrabenzustände](review-gebaeudevergleich.md#sichtprobe-gespeicherter-zustände) zeigt nach Korrektur der Animationsweite und des Ausblendens bei Kameraverschiebung Strömungsstriche am Graben. In der [Produktionsrunde](browser-pruefung.md#referenzrunde-mit-strömungsmarkern) bleibt der Weg in der Gesamtansicht sehr klein; menschliche Verständlichkeit und mobile Leistung bleiben zu prüfen.

Ein ergänzender [Live-Browserlauf mit Landgraben](landgraben-live.md) zeigt die Marker bei laufendem Worker zu zwei Zeitpunkten und erreicht nach drei Dämmen und Graben das Schadensziel. Kamera und Klickpunkte wurden testseitig gesetzt; menschliche Verständlichkeit und mobile Leistung bleiben offen.

Eine vollständige experimentelle 2×-Runde mit Grabenmarkierung bestand anschließend im Entwicklungsbrowser. Schematische Pfeile und eine Legende kennzeichnen inzwischen Zufluss und offene Modellränder; die experimentelle Referenzrunde wurde vor dieser Änderung gespielt: [Browserprüfung](browser-pruefung.md#flutrunde-mit-grabenmarkierung-und-modellrand-hinweise).

Nach der Pfeiländerung bestanden Produktionsbuild, 49 Vitest-Tests und 33 Chrome-Browserprüfungen. Die Tests der Pfeilpositionen prüfen gruppierte Zuflusszellen, konfigurierte Modellränder und Richtung; sie ersetzen keine vollständige Runde oder Geräteprüfung.

Auf diesem Stand bestanden Produktionsbuild, 46 Vitest-Tests und 32 Chrome-Browserprüfungen einschließlich der verständlichen Ablehnung eines durch ein Gebäude versperrten Grabens. Die Platzierungs- und Zeitvergleiche sind numerisch; sie ersetzen keine vollständige Runde auf echten Geräten.

Die Kopfzeile zeigt laufende Schäden und Ziel auch bei ausgeblendetem Menü. Gebäude werden anhand von Schaden und aktueller Wassertiefe am Rand eingefärbt; Antippen liefert einen Text mit Zustand und Werten. Der Worker liefert die Schadenssummen und Exposition; die Darstellung aktualisiert Gebäudefarben bei jedem Snapshot unabhängig von der Aktionsrevision. Build, 45 Vitest-Tests und 31 Chrome-Prüfungen bestanden; nach einer anschließenden Verdichtung des kleinen Hochformats bestanden die fünf betroffenen Ansichtsprüfungen erneut. Eine spätere Produktionsrunde mit dieser Anzeige ist unten dokumentiert; tatsächliche Geräte bleiben ungeprüft.

Das Projekt verwendet Bun 1.4.4 und `bun.lock`; ältere Prüfprotokolle nennen die damals ausgeführten npm-, npx- und pnpm-Befehle. Als Browserziel gelten aktuelle stabile Versionen, ohne gesonderte Unterstützung älterer Versionen. Nach der vorherigen pnpm-Umstellung bestanden eine saubere `pnpm ci`-Installation, Typprüfung, Build, 35 Vitest-Tests, zwei Python-Tests, 21 Chrome-Browserprüfungen und der statische Unterpfadtest; `pnpm audit` meldete keine bekannten Schwachstellen.

Die Bun-Migration wurde mit einer Neuinstallation und ohne Node im PATH geprüft: Build, Typprüfung, 35 Vitest-Tests, zwei Python-Tests, 21 Chrome-Browserprüfungen, Entwicklungsserver, statischer Unterpfad und 600-s-Szenariolauf bestanden. `bun outdated` meldete keine veralteten direkten Pakete, `bun audit` keine bekannten Schwachstellen. Für Node-kompatible APIs bleibt `@types/node` als Typabhängigkeit erhalten.

Der Produktionsbuild verwendet gezielte Babylon-Imports; Ausgangsansicht und Abrissvorschau wurden mit dem vorigen Build verglichen: [Browserprüfung](browser-pruefung.md#gezielte-babylon-imports).

Der [Gebäudevergleich](review-gebaeudevergleich.md) ordnet die drei Referenzrunden gebäudeweise ein. Die kombinierte Ableitung spart gegenüber zwei Dämmen 1.121,23 Gesamtschaden bei 2.202 zusätzlichen Budgeteinheiten; ein positiver Gesamtsaldo aus beiden Größen ist damit nicht belegt. Der Zehn-Minuten-Lauf auf dem ausgelieferten Szenario weist einen relativen Bilanzfehler von 8,42 × 10⁻¹⁴ aus. Ein einzelner Abriss zeigt inzwischen eine wirtschaftliche Verbesserung; menschliche Nutzbarkeit und eine erfolgreiche Strategie mit diesem Einzelabriss bleiben offen.

Eine vollständige lokale Produktionsrunde mit einem während der laufenden Flut bestätigten Graben zeigte Schadensanzeige, Ergebnis und zurückgesetzte Werte nach Neustart. Der willkürlich platzierte Graben verfehlte das Ziel; die automatisierte Mausprüfung ersetzt keinen menschlichen Spieltest: [Browserprüfung](browser-pruefung.md#produktionsrunde-mit-laufendem-grabeneingriff).

Die Spielhilfe erklärt nun, wie Zufluss, Dämme, Gräben und Pause bei der Planung zusammenwirken. Nach dem Produktionsbuild bestanden 49 Vitest-Tests und alle 33 Chromium-Browserprüfungen einschließlich emuliertem Touch und kombiniertem Neustart; [Details und Testumgebung](browser-pruefung.md#produktionsrunde-mit-laufendem-grabeneingriff). Ein menschlicher Spieltest bleibt offen.

Die Dachnormalen der Gebäude wurden korrigiert: Unbeschädigte Dächer erscheinen in der Produktionsansicht hell statt nahezu schwarz, wodurch die Zustandsfarben besser erkennbar sind. Build und 50 Vitest-Tests sowie Chromium-Prüfungen für Abriss und kombinierten Neustart bestanden; eine menschliche Beurteilung der Zustandsfarben bleibt offen.

Die [Datenlizenz-Prüfung](datenlizenz-pruefung.md) ordnet Quellenhinweise und den maschinenlesbaren Download des zum Build gehörigen Szenariopakets ein. Die Lizenzprüfung der Datenkombination und die dauerhafte Bereitstellung bleiben offen.

Für den integrierten Stand `5c2e0c4` bestanden Build, 52 Vitest-Tests, zwei Python-Tests und alle 38 Chromium-Prüfungen; [Prüfumfang und Grenzen](browser-pruefung.md#integrierte-prüfungen-nach-szenariodownload). Nachfolgende Änderungen und echte Geräte sind darin nicht enthalten.

Auf 320 × 480 CSS-Pixeln bleiben Zeit, Budget und Zustand nun einzeilig; die Quellenleiste liegt unter dem scrollbaren Werkzeugfeld. Werkzeugnamen passen in ihre mindestens 44 × 44 Pixel großen Schaltflächen; emulierte Treffflächen- und Vorschautests bestanden: [Browserprüfung](browser-pruefung.md#kompakte-statusanzeige-bei-320--480). Echte Geräte bleiben offen.

## Arbeitspakete

| Paket | Status | Tatsächlicher Nachweis | Nächster Schritt |
| --- | --- | --- | --- |
| AP 1 – Projektgrundlage | geprüft | Build, Typprüfung, Protokolltest, Entwicklungsserver und Browserlauf bestanden; Szene visuell geprüft | Bei Änderungen erneut prüfen |
| AP 2 – Wiener Geodaten | in Arbeit | DGM und OSM bezogen, vorläufiges Szenariopaket zweimal bytegleich erzeugt und im Browser geladen: [Voruntersuchung](geodaten-voruntersuchung.md) | Bruchkanten und Durchlässe fachlich einordnen, Wasserwege und Lizenzpflichten belegen |
| AP 3 – Simulation | in Arbeit | Synthetische Solver- und Bilanztests einschließlich verworfener Schritte, Sichtkontrolle der Dammöffnung, 600-s-Szenariolauf und Schrittweitenvergleich: [Solverbericht](solverbericht.md) | hohe lokale Tiefen einordnen und mobile Leistung prüfen |
| AP 4 – Darstellung | in Arbeit | Szenarioansicht mit OSM-Weglinien, bedarfsgerechter Geländeaktualisierung, Strömungsmarker, Worker-Snapshots und Maus-/Touch-Kamerasteuerung; Browserprüfungen einschließlich kleiner Ansichten und beschädigter Worker-Nachrichten; bei Grafikfehler wird auch ein ausgeblendetes Menü mit Neuladen-Schaltfläche geöffnet | Live-Sichtprüfung im Produktionsbuild dokumentiert; Strömungsanimation und Schadensanzeige auf tatsächlichen Geräten prüfen |
| AP 5 – Werkzeuge/Schäden | in Arbeit | Worker-Regeln, Vorschau mit Maßnahmendetails und zur bestätigten Krone passender Dammhöhe, Bestätigung, Budget und Schadenstests; drei Werkzeuge in Playwright-Chromium bedient | Wirkungsnachweise weiter abstimmen und Bedienung auf Geräten prüfen |
| AP 6 – Spielrunde | in Arbeit | vollständige Browserrunden und erfolgreiche Dammstrategie; Werkzeugvergleiche im Szenario | Strategie auf echten Geräten prüfen; Werkzeugnutzen und Wirkungswege weiter einordnen |
| AP 7 – Gesamtprüfung | offen | Chrome- und Firefox-Abläufe, vollständige Runden und Messverfahren dokumentiert | Safari, reale Geräte und verbleibende Kriterien prüfen |

### Bisherige Prüfungen

- Auf Stand `0935599` bestanden `PATH=$HOME/.bun/bin:$PATH bun run test --maxWorkers=1` mit 52 Vitest-Tests, `PATH=$HOME/.bun/bin:$PATH bun run typecheck` und `python3 tools/test-breakline-faces.py` mit zwei Tests. Diese Prüfungen ersetzen keine vollständige Browser- oder Geräteabnahme.
- Auf Stand `7e91234` bestanden der Produktionsbuild und alle 39 Chromium-Browserprüfungen; Anwendung, Szenario und Browsertests blieben bis `2593e2e` unverändert: [Prüfbeleg](browser-pruefung.md#gesamte-chromium-suite-nach-den-review-prüfungen). Menschliche und echte Geräteprüfungen bleiben offen.
- Nach der Korrektur alter und doppelter `ready`-Nachrichten in `01f0a1f` bestanden Build, 52 Vitest-Tests und 40 Chromium-Browserprüfungen. Die danach eingegangenen Anwendungsänderungen benötigen eine erneute Gesamtprüfung: [Prüfbeleg](browser-pruefung.md#gesamte-chromium-suite-nach-den-review-prüfungen).
- Ein neuer Drei-Runden-Versuch mit `1.4-draft` erreichte zwei vollständige Runden; während der dritten meldete die Automatisierung eine geschlossene Browserseite. Damit ist dieser Versuch nicht bestanden. Die Ursache ist anhand des vorhandenen Ergebnisses nicht geklärt; eine Wiederholung mit zusätzlichen Ereignis- und Phasenangaben bestand anschließend drei Runden in Chrome; die Ursache des ersten Abbruchs bleibt ungeklärt.
- Node.js 24.22.0, npm 12.2.0; TypeScript 7.0.2, Vite 8.3.5, Babylon.js 9.33.0, Vitest 5.0.5 und Playwright 1.64.1 sind in der Lockdatei festgelegt. Am 29. Oktober 2026 waren alle direkten npm- und festgelegten Python-Abhängigkeiten auf den aktuellen stabilen Versionen; indirekte Abhängigkeiten folgen den Vorgaben ihrer Elternpakete.
- `npm run build` und `npm test` bestanden (ein Protokolltest); `npm run dev` startete und lieferte HTML über HTTP.
- `npm run test:browser` scheiterte zunächst an fehlenden Systembibliotheken. Nach temporärem Entpacken der Ubuntu-Bibliotheken unter `/tmp/waterfighter-libs` bestand `LD_LIBRARY_PATH=/tmp/waterfighter-libs/root/usr/lib/x86_64-linux-gnu npm run test:browser` in Playwright-Chromium; Worker-Meldung und Canvas waren sichtbar. Ein Screenshot der Entwickleransicht zeigte die grüne Fläche. Das ist keine Desktop-Browserabnahme.
- Das optionale Kommando `gdalinfo` ist lokal nicht installiert; die verwendete Rasterio-Umgebung bringt GDAL 3.12.2 mit und führt die benötigten Rasterprüfungen aus. Für die dokumentierte Pipeline ist `gdalinfo` nicht erforderlich. Die Voruntersuchung dokumentiert Rohdatenprüfsummen und zwei bytegleiche Pipeline-Läufe. Build, 32 Vitest-Tests und 21 Chrome-Browserprüfungen bestanden nach der Wasseroptimierung; nach weiteren Integrationstests für laufende Eingriffe und Snapshot-Wiederverwendung bestehen 35 Vitest-Tests. Zwei Python-Tests bestanden zuvor. Lokale Geräteverfügbarkeit ist unten dokumentiert.

## Kriterienmatrix

| Kriterium | Status | Beleg beziehungsweise fehlender Nachweis |
| --- | --- | --- |
| Spielkonzept dokumentiert | erfüllt | `spielplan.md` |
| AP 1–7 mit Schnittstellen und Abnahme dokumentiert | erfüllt | `umsetzungsplan.md` |
| Goal-Übergabe dokumentiert | erfüllt | `goal-auftrag.md` |
| Historische Untersuchung erhalten; README aktualisiert | erfüllt | `archiv/enginevergleich-3d.md`, `../README.md` |
| Build, Typprüfung, Entwicklungsserver und Worker-Start | erfüllt | Build, Server, Protokolltest und Worker-Initialisierung in Playwright-Chromium geprüft |
| Reproduzierbares reales Wiener Szenario | offen | Version 1.4-draft mit 3-m-Grabentiefe, zusätzlich offenem Westrand und approximierten Bruchlinien; lokales Quellenarchiv und unabhängiger Neuaufbau geprüft, Orthofotoüberlagerung und Kreuzungsstellen einschließlich Überflutungs-, Schnittkanten- und Sensitivitätsanalyse untersucht; Brückenflächen und offene Wege im Rohstand unterschieden; Durchlässe, Eignung und Lizenzpflichten offen |
| Ausrichtung, Höhenbezug, Datenlücken und Quellen geprüft | offen | Orthofotoüberlagerung, Höhenbezug und endliche Rasterwerte geprüft; fachliche Datenlücken und Bruchkanteninterpretation offen |
| Stabiler Solver und Bilanzfehler unter 0,1 % | offen | Geschlossenes Becken, bilanziertes Zu-/Abfluss-Testfeld, 600-s-Szenariolauf und Schrittweitenvergleich bestehen. Die [Spitzentiefen](solverbericht.md#einordnung-der-spitzentiefen-auf-version-14) liegen am Zuflussrand; reale Plausibilität und Geräteprüfung bleiben offen |
| Plausible Flutwelle, Barrieren und Überströmung | offen | Symmetrische Welle, Dammöffnung und überströmbare Barriere numerisch geprüft; [synthetische Sichtkontrolle](solverbericht.md#sichtkontrolle-der-dammöffnung) vorhanden |
| 2,5D-Ansicht, Touch-Modi und Fehlerbehandlung | offen | Karten- und Werkzeugmodi, Strömungsmarker und Zustandsabfrage vorhanden; tatsächliche Geräte und umfassende Fehlerprüfung fehlen |
| Atomare Aktionen, Budget, Wassererhaltung und Schadenswertung | offen | Regel-, Worker- und hydraulische Tests einschließlich aller drei Eingriffe bei laufender Uhr und Werkzeugvergleiche im Szenario einschließlich lokaler Abrissbilanz und Grabenfluss bestehen; Geräteprüfungen fehlen |
| Vollständige Runde und bezahlbare erfolgreiche Strategie | offen | Version 1.4: ohne Maßnahmen numerisch 138.852,13 Schaden; zwei Dämme 34.768,16 bei Budgetrest 8.800, Kombination mit Abriss und Graben 33.646,93 bei Budgetrest 6.598. Menschliche Gerätebedienung fehlt |
| Neustart und Schutz vor alten/doppelten Nachrichten | offen | Uhr, Raster, Kamera, Werkzeugmodus und Aktionszustand sowie alte/doppelte Nachrichten in Tests geprüft; kombinierter Neustart nach allen drei Werkzeugen und Flut geprüft; drei vollständige Neustartrunden auf Anwendungscode `c98eeb2` bestanden |
| Tatsächliche Desktop-Abnahme Safari/Chrome/Firefox | offen | Chrome 156: automatisierte Desktop-Abläufe; Firefox 159: Werkzeuge und vollständige 2×-Runde auf Produktionsbuild `7e91234` mit deaktivierter Firefox-Content-Sandbox für Testschriften; Safari und manuelle Abnahme offen: [Browserprüfung](browser-pruefung.md#firefox-mit-szenario-14) |
| Echte iPhone-/Android-Abnahme | nicht prüfbar | Lokal kein Smartphone sichtbar und `adb`/`idevice_id` fehlen; Zugang zu echten Geräten bereitstellen |
| Mobile Framezeiten, Simulationsrate und Aktionslatenz | nicht prüfbar | Messskript in vollständiger Desktop-1×-Runde mit Straßenlinien geprüft: Framezeit-Ziel mit Softwaregrafik verfehlt; keine echten Smartphones lokal erreichbar: [Verfahren](mobil-messung.md) |
| Drei stabile aufeinanderfolgende Runden | offen | Drei 2×-Runden auf Produktionsbuild `399bfa3` mit Szenario 1.4, Pause, Zoom und Neustarts bestanden in Chrome. Ein vorheriger Chromium-Versuch brach während der dritten Runde aus ungeklärter Ursache ab; Langzeitverhalten und echte Geräte bleiben offen: [Browserprüfung](browser-pruefung.md#drei-runden-auf-szenario-14) |
| Statischer Produktionsbuild und vollständige Quellenhinweise | offen | Produktionsbuild unter Unterpfad einschließlich Worker und komprimiertem Szenario geprüft; Entwicklungscache bei Dateiersatz geprüft; direkte Links zu Aufbereitung und Quellen ergänzt, vollständige Lizenzprüfung fehlt |

„Offen“ bedeutet hier, dass die Arbeit noch auszuführen ist. „Nicht prüfbar“ darf erst eingetragen werden, wenn ein konkretes Hindernis ermittelt und beschrieben wurde. Die lokale Gerätesuche ist unten dokumentiert; ein entfernter Gerätezugang wurde nicht ausgeschlossen.

### Review-Abnahme: Spielbarkeit

| Review-Kriterium | Status | Beleg beziehungsweise fehlender Nachweis |
| --- | --- | --- |
| Vergleichsrunden und Werkzeugkontrollen auf demselben Szenario | erfüllt | Version 1.4: [Gebäude-, Kosten- und Kontrollvergleiche](review-gebaeudevergleich.md); beide Referenzstrategien halten Budget und Schadensziel ein. Die Werte sind numerisch. |
| Räumlicher Wasserverlauf | offen | Für zwei Grabenvarianten ist ein geordneter markierter Modellanteil bis zum Westrand bilanziert. Der Verlauf ist in der Spielansicht noch nicht durchgehend sichtbar und der Modellrand keine real geprüfte Ableitung. |
| Laufender Schaden, Gebäudezustände und Orientierung | offen | Worker-Snapshots, Textabfrage, Farben und Modellrandpfeile sind implementiert; ein Produktionslauf zeigt laufende Schäden und Ergebnis. Menschliche Verständlichkeit und Geräteansichten fehlen. |
| Vorbereitung, laufende Uhr, Pause und Platzierungsabweichungen | offen | Worker- und numerische Zeitvergleiche, Grenz- und Gebäudeablehnungen sowie ein laufender Produktions-Grabeneingriff sind belegt. [Gestaffelte numerische Versuche](review-gebaeudevergleich.md#graben-nach-vorbereiteten-drei-dammabschnitten) zeigen die Wirkung späterer Eingriffe nach vorbereiteten Dämmen, einschließlich eines bis 150 s wirtschaftlich wirksamen Grabens. Eine [gestaffelte Produktionsrunde](browser-pruefung.md#gestaffelte-eingriffe-in-einer-produktionsrunde) erreichte nach Pause, Abriss und Graben das Ziel. In Chrome wurden alle drei Werkzeuge nach Flutbeginn sowohl laufend als auch pausiert bestätigt: [Browserprüfung](browser-pruefung.md#maßnahmen-nach-flutbeginn). Menschliche Ausführung der Referenzen und echte Geräte fehlen. |
| Maus und Touch in Hoch- und Querformat | offen | Separate aktuelle Maus- und emulierte Touchläufe bedienen alle Werkzeuge und Bestätigung in beiden Formaten: [Browserprüfung](browser-pruefung.md#maus-und-touch-in-beiden-ausrichtungen). Vollständige menschliche Bedienung und echte Hardware bleiben offen. |
| Person ohne Testkoordinaten: Runde und zweiter Versuch | offen | Hier wurde keine unabhängige Testperson beobachtet. Der [Spieltestablauf](spieltest.md) bereitet zwei Versuche und die Beobachtung vor; eine tatsächliche Durchführung fehlt. |
| Tatsächliches Safari und echte iPhone-/Android-Geräte | nicht prüfbar | Auf dem dokumentierten Linux-Rechner fehlen diese Geräte und Safari; Zugang bereitstellen. Emulation und Playwright-WebKit ersetzen sie nicht. |

## Fortsetzung

AP 2 benötigt insbesondere hydraulische Interpretation der Bruchkanten, zwei geeignete Wasserwege und Lizenzprüfung. Zwei statische Landkorridore wurden geprüft, jedoch in der Referenzflut nicht vollständig nass; getrennte Eintrittskanten sind über eine Runde einzeln sperrbar. Auf Version 1.4 senken Grabenaktionen entlang des nördlichen Korridors allein den Schaden numerisch, verschlechtern aber die Zwei-Damm-Strategie erheblich; ein Kontrolllauf ordnet dies der Absenkung zweier modellierter Bruchkanten zu. Ein alternativer Graben, der keine Bruchkante absenkt, erhöht den Schaden ebenfalls. Der südliche Korridor bewirkt in beiden Fällen praktisch keinen Unterschied: [Korridorvergleich](geodaten-voruntersuchung.md#zwei-frühere-landkorridore-als-gräben-auf-version-14). Eine Markierungsbilanz bis zur ersten Rückkehr ins Gewässer zeigt unterschiedlich weit reichende Landpassagen. Zwei anhand aller 627 Gewässer-Land-Kanten ausgewählte weitere Kandidaten wurden ebenfalls untersucht; der südliche zeigt auch mit zwei getesteten Gräben keine längere Landpassage oder relevante Schadensverbesserung. Zwei nutzbare Umleitungswege bleiben unbelegt. Der Solver wurde unabhängig davon bereits begonnen; Szenarioabnahme und Solverabnahme bleiben offen. Die verbleibenden Kriterien und die reale Geräteabnahme sind offen.

Lokale Geräteprüfung: USB zeigte ein QEMU-Tablet und Controller; `adb`, `idevice_id`, `xcrun`, Chrome und Firefox waren nicht im Pfad. Safari ist auf diesem Linux-Rechner nicht verfügbar. Chrome und Firefox wurden später temporär installiert; ein entfernter Gerätezugang wurde nicht ausgeschlossen. Die vollständige Chromium-Headless-Runde und ihre Grenzen sind im [Solverbericht](solverbericht.md#vollständige-browserrunde-vorheriger-build) dokumentiert.

Die Auswahlkoordinaten wurden zusätzlich mit verdoppelter Babylon-Renderauflösung im Entwicklungsbrowser überprüft; dies ersetzt keinen Touch-Test auf echter Hardware.
