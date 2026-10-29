# WaterFighter

WaterFighter ist ein browserbasierter Prototyp eines Hochwasserschutzspiels in einem realen Wiener Donauviertel. Er umfasst das Szenario, drei Bauwerkzeuge, eine Flutrunde und die Ergebnisanzeige. Die Szenario- und Geräteabnahme ist noch unvollständig. Die Anwendung ist keine Hochwasserprognose.

## Einrichtung und Prüfung

Voraussetzung: Node.js 24 und pnpm 12.16.1; TypeScript 7 wird über die Lockdatei installiert; für Browserprüfungen zusätzlich ein von Playwright unterstützter Browser mit seinen Systembibliotheken.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
python3 tools/test-breakline-faces.py
pnpm build
ppnpm test:browser
```

Der Entwicklungsserver nennt seine lokale Adresse. `pnpm preview` liefert den zuvor erzeugten Produktionsbuild lokal aus. Das Spiel verwendet das vorläufige Szenario und einen pausierbaren Solver im Worker. Das Menü lässt sich für eine freie Kartenansicht aus- und wieder einblenden. Im Kartenmodus verschieben, zoomen und durch Antippen Wassertiefe oder Gebäudeschaden abfragen; für Damm oder Graben Start und Ende wählen, beim Abriss ein Gebäude auswählen und anschließend die Vorschau bestätigen. Die Geodaten-Voruntersuchung mit Python und Rasterio/GDAL ist in [geodaten-voruntersuchung.md](docs/geodaten-voruntersuchung.md) beschrieben; ein vorläufiges Szenariopaket liegt bei; seine Eignung und Vollständigkeit sind noch nicht abgenommen. Eine öffentliche Veröffentlichung ist nicht beauftragt.

Das Spiel setzt aktuelle stabile Versionen von Safari, Chrome oder Firefox mit WebGL2 voraus. Ältere Browser werden nicht gesondert unterstützt; Safari und echte Mobilgeräte sind noch nicht abgenommen.

## Dokumentation

- [Spielplan](docs/spielplan.md): Produktziel und Spielregeln.
- [Umsetzungsplan](docs/umsetzungsplan.md): Architektur, Arbeitspakete und Abnahmekriterien.
- [Status und Kriterienmatrix](docs/status.md): Fortschritt und tatsächliche Nachweise.
- [Browser- und Stabilitätsprüfung](docs/browser-pruefung.md): ausgeführte Browserläufe und ihre Grenzen.
- [Mobil-Messverfahren](docs/mobil-messung.md): Vorbereitung der noch ausstehenden Geräteabnahme.
- [Goal-Auftrag](docs/goal-auftrag.md): Implementierungsauftrag.
- [Historischer 3D-Enginevergleich](docs/archiv/enginevergleich-3d.md): früherer Ansatz, keine Architekturvorgabe.
