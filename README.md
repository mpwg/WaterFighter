# WaterFighter

WaterFighter ist ein browserbasierter Prototyp eines Hochwasserschutzspiels in einem realen Wiener Donauviertel. Er umfasst das Szenario, drei Bauwerkzeuge, eine Flutrunde und die Ergebnisanzeige. Die Szenario- und Geräteabnahme ist noch unvollständig. Die Anwendung ist keine Hochwasserprognose.

## Einrichtung und Prüfung

Voraussetzung: [Bun 1.4.4](https://bun.com/docs/installation) im PATH; TypeScript 7 wird über die Lockdatei installiert; für Browserprüfungen zusätzlich ein von Playwright unterstützter Browser mit seinen Systembibliotheken.

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

Diagnoseprogramme lassen sich direkt ausführen, beispielsweise `bun tools/check-scenario-balance.ts` oder `bun tools/verify-static-subpath.mjs`. Die Projektbefehle verwenden Bun auch für Werkzeuge mit Node-Shebang.

Der Entwicklungsserver nennt seine lokale Adresse. `bun run preview` liefert den zuvor erzeugten Produktionsbuild lokal aus. Der Build stellt das vorläufige Szenario komprimiert bereit; die Anwendung entpackt es im aktuellen Browser und verwendet einen pausierbaren Solver im Worker; Straßen- und Weglinien dienen der Orientierung auf dem Gelände. Das Menü lässt sich für eine freie Kartenansicht aus- und wieder einblenden. Im Kartenmodus verschieben, zoomen und durch Antippen Wassertiefe oder Gebäudeschaden abfragen; für Damm oder Graben Start und Ende wählen, beim Abriss ein Gebäude auswählen und anschließend die Vorschau bestätigen. Die Geodaten-Voruntersuchung mit Python und Rasterio/GDAL ist in [geodaten-voruntersuchung.md](docs/geodaten-voruntersuchung.md) beschrieben; ein vorläufiges Szenariopaket liegt bei; seine Eignung und Vollständigkeit sind noch nicht abgenommen. Eine öffentliche Veröffentlichung ist nicht beauftragt.

Das Spiel setzt aktuelle stabile Versionen von Safari, Chrome oder Firefox mit WebGL2 voraus. Ältere Browser werden nicht gesondert unterstützt; Safari und echte Mobilgeräte sind noch nicht abgenommen.

Die Typprüfung verwendet ES2025-Bibliothekstypen und prüft auch die TypeScript-Diagnoseprogramme und Konfigurationsdateien. Vite erzeugt den Produktionsbuild mit `esnext` für aktuelle Browser. Das TypeScript-Ziel allein legt das Vite-Ausgabeziel nicht fest; Bibliothekstypen ersetzen keine Prüfung der tatsächlich verfügbaren Browser-APIs.

Bei einem nicht behebbaren Grafik-, Lade- oder Workerfehler wird das Menü geöffnet und bietet einen Knopf zum Neuladen der Seite; dabei beginnt eine neue Runde.

Die Kopfzeile zeigt laufend Gesamtschaden, Ziel sowie Flut- und Abrissverluste, auch bei ausgeblendetem Menü. Gebäude werden nach Zustand eingefärbt; im Kartenmodus zeigt Antippen zusätzlich Zustand, Schaden und Wassertiefe am Gebäuderand als Text.

Bestätigte Dämme erscheinen als orange Linien und bestätigte Gräben als braune Geländeflächen. Überflutetes Wasser kann die Grabenmarkierung verdecken.

Blaue Pfeile kennzeichnen die Zuflussbereiche; violette Pfeile markieren offene Modellränder, über die Wasser den Ausschnitt verlassen kann. Die Pfeile sind schematisch und keine Aussage über eine sichere reale Ableitung.

Wenn eine Bauvorschau nicht zulässig ist, erklärt sie den Grund, etwa einen Kartenrand, einen bereits vorhandenen Damm oder ein Gebäude im geplanten Graben.

## Dokumentation

- [Spielplan](docs/spielplan.md): Produktziel und Spielregeln.
- [Umsetzungsplan](docs/umsetzungsplan.md): Architektur, Arbeitspakete und Abnahmekriterien.
- [Status und Kriterienmatrix](docs/status.md): Fortschritt und tatsächliche Nachweise.
- [Browser- und Stabilitätsprüfung](docs/browser-pruefung.md): ausgeführte Browserläufe und ihre Grenzen.
- [Mobil-Messverfahren](docs/mobil-messung.md): Vorbereitung der noch ausstehenden Geräteabnahme.
- [Goal-Auftrag](docs/goal-auftrag.md): Implementierungsauftrag.
- [Historischer 3D-Enginevergleich](docs/archiv/enginevergleich-3d.md): früherer Ansatz, keine Architekturvorgabe.
