# WaterFighter

WaterFighter soll ein browserbasiertes Hochwasserschutzspiel in einem realen Wiener Donauviertel werden. Der aktuelle Prototyp umfasst das Szenario, drei Bauwerkzeuge, eine Flutrunde und die Ergebnisanzeige. Die Szenario- und Geräteabnahme ist noch unvollständig. Die Anwendung ist keine Hochwasserprognose.

## Einrichtung und Prüfung

Voraussetzung: Node.js 24 und npm; für Browserprüfungen zusätzlich ein von Playwright unterstützter Browser mit seinen Systembibliotheken.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run test:browser
```

Der Entwicklungsserver nennt seine lokale Adresse. `npm run preview` liefert den zuvor erzeugten Produktionsbuild lokal aus. Die technische Vorschau zeigt das vorläufige Szenario und einen pausierbaren Solver im Worker. Im Kartenmodus verschieben, zoomen und durch Antippen Wassertiefe oder Gebäudeschaden abfragen; für Damm oder Graben Start und Ende wählen, beim Abriss ein Gebäude auswählen und anschließend die Vorschau bestätigen. Die Geodaten-Voruntersuchung mit Python und Rasterio/GDAL ist in [geodaten-voruntersuchung.md](docs/geodaten-voruntersuchung.md) beschrieben; ein vorläufiges Szenariopaket liegt bei; seine Eignung und Vollständigkeit sind noch nicht abgenommen. Eine öffentliche Veröffentlichung ist nicht beauftragt.

## Dokumentation

- [Spielplan](docs/spielplan.md): Produktziel und Spielregeln.
- [Umsetzungsplan](docs/umsetzungsplan.md): Architektur, Arbeitspakete und Abnahmekriterien.
- [Status und Kriterienmatrix](docs/status.md): Fortschritt und tatsächliche Nachweise.
- [Goal-Auftrag](docs/goal-auftrag.md): Implementierungsauftrag.
- [Historischer 3D-Enginevergleich](docs/archiv/enginevergleich-3d.md): früherer Ansatz, keine Architekturvorgabe.
