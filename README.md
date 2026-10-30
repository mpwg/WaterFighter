# WaterFighter

WaterFighter ist ein browserbasierter Prototyp eines Hochwasserschutzspiels in einem realen Wiener Donauviertel. Er umfasst das Szenario, drei Bauwerkzeuge, eine Flutrunde und die Ergebnisanzeige. Die Szenario- und Geräteabnahme ist noch unvollständig. Die Anwendung ist keine Hochwasserprognose.

Der Szenarioentwurf `1.5-draft` entfernt zehn identifizierte OSM-Dächer aus der Gebäude- und Sperrenmodellierung. Ein [wirtschaftlicher Einzelabriss mit südlicher Dammführung](docs/review-gebaeudevergleich.md#wirtschaftlicher-abriss-bei-südlicher-dammführung) wurde numerisch und in einer automatisierten Desktoprunde geprüft; seine menschliche Auffindbarkeit bleibt offen. Kleine Gebäude lassen sich bei eindeutigem Beinahetreffer auswählen; ein Kreuz markiert das ausgewählte kleine Gebäude in der Vorschau. Die Auswahlhilfe wurde automatisiert in [Chromium und Safari](docs/browser-pruefung.md#safari-beinahetreffer-auf-15) geprüft. Die bisherigen Nachweise für `1.4-draft` sind historisch.

## Einrichtung und Prüfung

Voraussetzung: [Bun 1.4.4](https://bun.com/docs/installation) im PATH; TypeScript 7 und Babylon.js 9.33.1 werden über die Lockdatei installiert; für Browserprüfungen zusätzlich ein von Playwright unterstützter Browser mit seinen Systembibliotheken.

Falls Bun bereits unter `~/.bun/bin/bun` installiert ist, aber `bun` nicht gefunden wird, ergänzt `export PATH="$HOME/.bun/bin:$PATH"` den Suchpfad für die aktuelle Shell.

```sh
bun install --frozen-lockfile
bun run dev
bun run typecheck
bun run test
python3 tools/test-breakline-faces.py
bun run build
bun run test:browser
```

Diagnoseprogramme lassen sich direkt ausführen, beispielsweise `bun tools/check-scenario-balance.ts` oder `bun tools/verify-static-subpath.mjs`. Der [isolierte Quellen-Neuaufbau](docs/geodaten-voruntersuchung.md#unabhängiger-neuaufbau-mit-erneut-bezogenen-quellen), der [Rastervergleich](docs/solverbericht.md#rasterverfeinerung-des-unbehandelten-wiener-szenarios) und der [Safari-Prüfablauf](docs/browser-pruefung.md#safari-272-und-drei-chromium-runden-auf-macos) beschreiben weitere Prüfungen und ihre Grenzen. Die Projektbefehle verwenden Bun auch für Werkzeuge mit Node-Shebang.

Der Entwicklungsserver nennt seine lokale Adresse. `bun run preview` liefert den zuvor erzeugten Produktionsbuild lokal aus. Der Build stellt das vorläufige Szenario komprimiert bereit; die Anwendung entpackt es im aktuellen Browser und verwendet einen pausierbaren Solver im Worker; Straßen- und Weglinien dienen der Orientierung auf dem Gelände. Das Menü lässt sich für eine freie Kartenansicht aus- und wieder einblenden; bei ausgeblendetem Menü bleiben Zeit, Budget, Rundenzustand und Schäden in der Kopfzeile sichtbar; Werkzeughinweise erscheinen über der Karte. Nach einer Bestätigung erscheint nach kurzer Zeit wieder der Hinweis für die nächste Auswahl; eine neue Auswahl behält ihren eigenen Hinweis. Die Karte lässt sich in allen Werkzeugmodi ziehen und mit + / − zoomen; ein gewählter Startpunkt bleibt beim Verschieben erhalten. Im Kartenmodus zeigt Antippen Wassertiefe oder Gebäudeschaden; für Damm oder Graben Start und Ende wählen, beim Abriss ein Gebäude auswählen und anschließend die Vorschau bestätigen. Ein weiterer Kartentipp verwirft die unbestätigte Vorschau und beginnt eine neue Auswahl. Die Geodaten-Voruntersuchung mit Python und Rasterio/GDAL ist in [geodaten-voruntersuchung.md](docs/geodaten-voruntersuchung.md) beschrieben; ein vorläufiges Szenariopaket liegt bei; seine Eignung und Vollständigkeit sind noch nicht abgenommen. Eine öffentliche Veröffentlichung ist nicht beauftragt.

Für eine beobachtete Runde beschreibt [Spieltest ohne Testkoordinaten](docs/spieltest.md) die lokale Bereitstellung und den Beobachtungsablauf. Derzeit ist keine unabhängige Testperson verfügbar; diese Spielabnahme steht noch aus.

Das Spiel setzt aktuelle stabile Versionen von Safari, Chrome oder Firefox mit WebGL2 voraus. Ältere Browser werden nicht gesondert unterstützt; Safari und echte Mobilgeräte sind noch nicht abgenommen.

Auf dem aktuellen Mac bestanden Build und 79 automatisierte Tests. Vollständige automatisierte Runden wurden nach der jüngsten Darstellungsänderung in [Safari](docs/browser-pruefung.md#safari-nach-änderung-der-schadensanzeige), [Google Chrome und Firefox](docs/browser-pruefung.md#wiederholung-nach-änderung-der-schadensanzeige) geprüft. Firefox protokollierte dabei Zugriffsfehler. Die Modelltests umfassen eine [Konvergenzprüfung gegen eine analytische Dammbruchwelle](docs/solverbericht.md#räumliche-verfeinerung-einer-analytischen-dammbruchwelle). Mobile Tests werden auf Nutzerwunsch vorläufig ausgelassen. Einzelheiten und offene Kriterien stehen in [status.md](docs/status.md).

Die Typprüfung verwendet ES2025-Bibliothekstypen und prüft auch die TypeScript-Diagnoseprogramme und Konfigurationsdateien. Vite erzeugt den Produktionsbuild mit `esnext` für aktuelle Browser. Das TypeScript-Ziel allein legt das Vite-Ausgabeziel nicht fest; Bibliothekstypen ersetzen keine Prüfung der tatsächlich verfügbaren Browser-APIs.

Bei einem nicht behebbaren Grafik-, Lade- oder Workerfehler wird das Menü geöffnet und bietet einen Knopf zum Neuladen der Seite; dabei beginnt eine neue Runde.

Auf sehr kleinen Ansichten öffnet der Knopf „Hilfe“ neben der Quellenleiste die vorhandene Spielanleitung; die Anleitung lässt sich in der Leiste scrollen.

Wenn die laufende Berechnung mehr als zwei Sekunden Rückstand hat, erscheint ein Hinweis, auch im Kartenmodus bei ausgeblendetem Menü. Nach dem Aufholen oder Pausieren verschwindet er; neuere Bedienhinweise bleiben erhalten. Eine vorübergehend verdeckte Kartenabfrage erscheint danach wieder. Die [Prüfbelege](docs/browser-pruefung.md#rückstandsmeldung-bei-ausgeblendetem-kartenmenü) unterscheiden automatisierte Tests von der noch offenen Geräte- und Spielabnahme.

Die Kopfzeile zeigt laufend Gesamtschaden, Ziel sowie Flut- und Abrissverluste, auch bei ausgeblendetem Menü. Gebäude werden nach Zustand eingefärbt; im Kartenmodus zeigt Antippen zusätzlich Zustand, Schaden und Wassertiefe am Gebäuderand als Text. Bei Wasser nennt die Kartenabfrage Tiefe und Wasserspiegel über Wiener Null; bei ausgeblendetem Menü erscheint sie mit dem Zeitpunkt der Abfrage. So lassen sich Wasserstände auf beiden Seiten eines Damms vergleichen.

Bestätigte Dämme erscheinen als orange Linien und bestätigte Gräben als braune Geländeflächen. Eine schematische dunkelbraune Linie zeigt den Grabenverlauf auch über Wasser und Gebäuden; sie ist eine Kartenüberlagerung. Schräge Gräben folgen rasterverbunden der Verbindung zwischen den beiden gewählten Punkten; die Vorschau zeigt den tatsächlichen Verlauf.

Helle Strömungspfeile zeigen die berechnete Richtung nahe der jeweils abgetasteten Wasserzelle. Entlang bestätigter Gräben sind die Pfeile dunkelblau, wenn dort genügend Wasser und Strömung vorhanden sind. Die Größe der regulären Pfeile passt sich begrenzt dem Zoom an; schmale Grabenmarker können trotz der Farbe in der Übersicht schwer erkennbar sein. Eine [Safari-Sichtprobe](docs/browser-pruefung.md#dunkle-grabenpfeile-in-safari) dokumentiert die Darstellung und ihre Grenzen.

Blaue Pfeile kennzeichnen die Zuflussbereiche; violette Pfeile markieren offene Modellränder, über die Wasser den Ausschnitt verlassen kann. Die Pfeile sind schematisch und keine Aussage über eine sichere reale Ableitung.

Der Szenarioentwurf `1.5-draft` verwendet weiterhin einen offenen westlichen Modellrand und 3 m Grabentiefe als Spielannahmen. Wasser außerhalb des Ausschnitts wird nicht weiter simuliert. Die numerischen Referenzstrategien stehen in `tests/fixtures/review-strategies.json` und lassen sich mit `bun tools/reference-strategies.ts baseline`, `shield`, `land-divert`, `south-control` oder `south-divert` nachvollziehen. [Zeitvergleich](docs/review-gebaeudevergleich.md#südlicher-graben-eingriffszeit-auf-15), [Wegdiagnose](docs/review-gebaeudevergleich.md#modellierter-wasserweg-nach-spätem-südlichem-grabeneingriff-auf-15) und [Platzierungsabweichungen](docs/review-gebaeudevergleich.md#platzierungsabweichungen-der-beiden-gräben-auf-15) zeigen Nutzen und Empfindlichkeit; frühere Gebäudevergleiche beziehen sich auf `1.4-draft`. Schräge Damm- und Grabenverläufe folgen einer verbundenen Rasterlinie; menschliche Platzierung bleibt offen.

Gräben dürfen an bereits ausgehobene Zellen anschließen. Die Vorschau nennt die wiederverwendeten Zellen; Kosten und Vertiefung betreffen nur neue Zellen. Eine vollständig vorhandene Strecke wird abgelehnt.

Wenn eine Bauvorschau nicht zulässig ist, erklärt sie den Grund, etwa einen Kartenrand, einen bereits vorhandenen Damm oder ein Gebäude im geplanten Graben. Eine zulässige Dammvorschau weist außerdem auf Kanten hin, die durch ein Gebäude bereits gesperrt sind und dort derzeit keine zusätzliche Sperre bewirken.

Bei Damm und Graben markiert ein Kreuz den ersten gewählten Punkt. Die Grabenvorschau weist zusätzlich darauf hin, wenn der geplante Verlauf modellierte Geländekanten absenkt und dadurch den Wasserverlauf verändern kann.

## Dokumentation

- [Spielplan](docs/spielplan.md): Produktziel und Spielregeln.
- [Umsetzungsplan](docs/umsetzungsplan.md): Architektur, Arbeitspakete und Abnahmekriterien.
- [Status und Kriterienmatrix](docs/status.md): Fortschritt und tatsächliche Nachweise.
- [Browser- und Stabilitätsprüfung](docs/browser-pruefung.md): ausgeführte Browserläufe und ihre Grenzen.
- [Spieltest ohne Testkoordinaten](docs/spieltest.md): Ablauf und Beobachtungsbogen für die noch offene Prüfung mit einer Person.
- [Mobil-Messverfahren](docs/mobil-messung.md): Vorbereitung der noch ausstehenden Geräteabnahme.
- [Goal-Auftrag](docs/goal-auftrag.md): Implementierungsauftrag.
- [Historischer 3D-Enginevergleich](docs/archiv/enginevergleich-3d.md): früherer Ansatz, keine Architekturvorgabe.
