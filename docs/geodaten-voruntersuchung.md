# Voruntersuchung Wiener Geodaten

Stand: 29. Oktober 2026. Dieser Ausschnitt und das Prüfskript sind vorläufig; sie sind **kein fertiges Spielszenario**.

Als Kandidat dient ein 800 × 800 m großes Gebiet in der Brigittenau an der Donau: EPSG:31256, West/Süd/Ost/Nord 3900/344150/4700/344950 m. Die Eignung für mindestens zwei spielbare Wasserwege und die Übereinstimmung der Daten sind noch visuell und hydraulisch zu prüfen. Die OSM-Abfrage umfasst einen etwas größeren Bereich, damit Gebäude am Rand erfasst werden.

## Bezogene Rohdaten

Die Rohdaten liegen unter `raw-data/` und sind nicht in Git enthalten. Abruf am 29. Oktober 2026:

- [Wiener DGM, Blatt 35/2, GeoTIFF](https://www.wien.gv.at/ma41datenviewer/downloads/geodaten/dgm_tif/35_2_dgm_tif.zip): SHA-256 `e8808f973a48223240e2c8863223ee4e2e85b988426c44fadd5f0b0cb95aa638`. Das Archiv enthält ein 1-m-Raster und World-Datei; Dateidatum im Archiv 30. September 2026. Laut [Stadt Wien](https://www.wien.gv.at/stadtplanung/geodatenviewer-ogd-daten-herunterladen) CC BY 4.0, erforderliche Angabe: „Datenquelle: Stadt Wien - data.wien.gv.at“. Die Höhen sind in Metern über Wiener Null (EPSG:8881), nicht Adriahöhen. Das DGM enthält keine Brücken; Gewässerbett und Durchlässe benötigen gesonderte Prüfung und gegebenenfalls dokumentierte Spielanpassungen.
- [OSM-Kartenabfrage](https://api.openstreetmap.org/api/0.6/map?bbox=16.383,48.234,16.398,48.244): `raw-data/brigittenau.osm`, SHA-256 `954e0ac7985cc586ca5bdcb3eb912b3a1e7c75d0bbffe188b2e0bcdb9ceff9fd`. Live-Daten; ein späterer Download kann sich ändern. © OpenStreetMap-Mitwirkende, [ODbL](https://www.openstreetmap.org/copyright). Weitergabe und Attribution des abgeleiteten Pakets sind noch zu prüfen; diese Notiz ersetzt keine Lizenzprüfung.

Reproduktion setzt exakt diese Dateien voraus; bei geändertem Abruf sind Prüfsummen neu zu dokumentieren. Das ZIP nach `raw-data/35_2/` entpacken und mit Python und den Versionen in `tools/requirements-geo.txt` ausführen:

```sh
python tools/inspect-geodata.py
```

Das Prüfskript benutzt Rasterio/GDAL zur Mittelung auf 4 m und PyProj zur Koordinatentransformation. Es schreibt ausschließlich `/tmp/waterfighter-geodata-inspection.json`. Der geprüfte Rasterausschnitt enthält 200 × 200 endliche Zellen, Werte 0,647 bis 11,247 m Wiener Null; 91 geschlossene gültige Gebäudewege, 419 Straßenwege und ein Gewässerweg schneiden das Rechteck. Diese Zählung beweist weder lückenlose OSM-Relationen noch ein übereinstimmendes Ufer. Der Donau-Mittelachsenweg allein bildet die Wasserfläche nicht ab. Multipolygone, Ufer, schmale Barrieren und Randbeschnitt sind vor einem Szenariopaket zu bearbeiten. Ein Vergleich mit Referenzkarte, NoData-Prüfung der Quelldaten und reproduzierbare Ausgabeprüfung stehen aus.

## Gewässerrelationen und Kontrollbild

Zusätzlich über die OSM-API am 29. Oktober 2026 geladen:

- [Donau, Relation 32484 mit Elementen](https://api.openstreetmap.org/api/0.6/relation/32484/full), `raw-data/donau-relation.osm`, SHA-256 `ea5984cc48996b5455208f16aae808b72928ef03d4f88fe6fb9646a230485b88`.
- [Neue Donau, Relation 18444 mit Elementen](https://api.openstreetmap.org/api/0.6/relation/18444/full), `raw-data/neue-donau-relation.osm`, SHA-256 `f68a06ba1ea23689703972b6ef48c1afc7511725cb918950ca9a1a9ff2afe682`.

Nach dem ersten Prüfskript erzeugt `python tools/inspect-water.py` ein SVG in `/tmp/waterfighter-geodata.svg`. Das [Kontrollbild](geodaten-kontrolle.png) zeigt Höhen in Graustufen, Gewässer blau, Gebäude orange und Straßen gelb. Ufer und Gelände scheinen auf dieser Überlagerung räumlich plausibel; sie ist noch kein unabhängiger Vergleich mit einem Referenzbild. Die berechnete Donaufläche im Ausschnitt beträgt 240.480 m², die Neue Donau 9.290 m². Die Erkennung von Fließwegen, Brücken, Bruchkanten, möglichen Datenlücken und Spielanpassungen bleibt offen. Die Voruntersuchung umfasst keine vollständige Validierung aller Multipolygon-Relationen oder der ODbL-Weitergabepflichten.

## Vorläufiges Szenariopaket

`tools/build-scenario.py` liest die oben aufgeführten Rohdateien und die unten genannten sechs Gebäude-Relationen direkt und prüft ihre SHA-256-Werte vor der Verarbeitung. Ausgabe ist `public/scenarios/brigittenau-v1.json`; diese Datei ist ein Entwurf (`1-draft`), keine abgenommene Spielkarte. Eine Python-Umgebung mit `pip install -r tools/requirements-geo.txt` vorausgesetzt:

```sh
python tools/build-scenario.py
sha256sum public/scenarios/brigittenau-v1.json
```

Zwei aufeinanderfolgende Läufe ergaben SHA-256 `06fa66ea104b02ce570275a124012d6a95a2296f8d012b6349d996cbb5781bd1`. Verwendet: Python 3.14.4, Rasterio 1.5.2 mit GDAL 3.12.2, PyProj 3.8.0/PROJ 9.8.1, Shapely 2.2.0/GEOS 3.14.1, NumPy 2.5.4. Andere Bibliotheksstände können die Geometrie oder Rundung ändern. Rasterio erkennt die CRS-Kennung des Quell-TIFF nur mit reduziertem Konfidenzschwellwert; die maßgebliche CRS-Angabe der Stadt und die Koordinaten sind oben dokumentiert.

Das Paket enthält das unbearbeitete gemittelte Gelände, separat ein Simulationsbett, initiale Wassertiefen, Gewässermasken und OSM-Geometrien. Mangels Bathymetrie wird die Sohle der OSM-Gewässerflächen im Entwurf künstlich auf 0 m Wiener Null und der Anfangsspiegel auf 2 m Wiener Null gesetzt; dies ist keine Messung. 12 m dienen als Darstellungshöhe, wenn keine brauchbare OSM-Höhe vorliegt. Das vorläufige Schadensziel ist 50.000; eine rechnerische Dammstrategie erreicht es. Vollständige spielerische und hydraulische Abnahme stehen aus. Die Geometrien werden am Szenariorand beschnitten; Gebäude-Multipolygone aus dem Kartenausschnitt werden inklusive Innenringen aufgelöst; sechs in der Kartenabfrage unvollständige Relationen wurden zusätzlich vollständig heruntergeladen. Schutzlinien und Durchlässe wurden noch nicht gesondert modelliert. Das Paket ist ohne Laufzeit-Kartenabfrage verfügbar und enthält Quellenangaben; die Lizenz- und Vollständigkeitsprüfung der OSM-Ableitung bleibt offen.

Die zusätzlich bezogenen Gebäude-Relationen liegen unter `raw-data/building-relations/`; der Abruf lautet jeweils `https://api.openstreetmap.org/api/0.6/relation/<ID>/full`. SHA-256:

| ID | Prüfsumme |
| --- | --- |
| 105223 | `0efc2b3c68d1597945927eaa933993472c000d800d594b0bb6dfc1c6f98b3ebf` |
| 1527647 | `4964b66138ee0bb2d2244f3698efd415dea733caaef74fd5c68e3b64e751b689` |
| 1527705 | `a6a8623de0130ce9037f437b11c9c3763bd57d8cd3f245b63fc34ee47902ccb0` |
| 1536148 | `1a2ab5e81727e15606d5f1dca5d19efd4ea395f1d70fccf3e254e34a470d9704` |
| 1536152 | `a0a4e19e1e9c91d17d24d6c2c379143f7bce7074ca3441ab137f3da35898a99a` |
| 1577738 | `d1f3eb7cb275f6c5b99ccbdcaeccbb7afe7012730897b6752ddeda3e2e7b437f` |

Das erste Kontrollbild zeigt weiterhin nur Gebäudewege und nicht die nachträglich einbezogenen Gebäude-Relationen; es muss mit der endgültigen Ausgabe neu erstellt und unabhängig geprüft werden.

Der aktuelle Entwurf führt außerdem 26 OSM-Linien mit Mauer- oder Böschungskennzeichen und 73 Brücken-/Tunnelabschnitte getrennt auf. Diese Merkmale sind Kandidaten, keine bereits geprüften hydraulischen Sperren oder Durchlässe; ihre Höhen und tatsächliche Funktion sind nicht aus den Tags ableitbar. Die vier Meter gemittelten Höhen können schmale Kanten glätten. Bruchkanten und daraus resultierende Sperren müssen vor der Szenarioabnahme gesondert aufbereitet und geprüft werden.
