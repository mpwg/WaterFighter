# Voruntersuchung Wiener Geodaten

Stand: 29. Oktober 2026. Dieser Ausschnitt und das Prüfskript sind vorläufig; sie sind **kein fertiges Spielszenario**.

Als Kandidat dient ein 800 × 800 m großes Gebiet in der Brigittenau an der Donau: EPSG:31256, West/Süd/Ost/Nord 3900/344150/4700/344950 m. Die räumliche Übereinstimmung wurde anhand eines unabhängigen Orthofotos visuell geprüft; die Eignung für mindestens zwei spielbare Wasserwege ist hydraulisch noch zu belegen. Die OSM-Abfrage umfasst einen etwas größeren Bereich, damit Gebäude am Rand erfasst werden.

## Bezogene Rohdaten

Die Rohdaten liegen unter `raw-data/` und sind nicht in Git enthalten. Abruf am 29. Oktober 2026:

- [Wiener DGM, Blatt 35/2, GeoTIFF](https://www.wien.gv.at/ma41datenviewer/downloads/geodaten/dgm_tif/35_2_dgm_tif.zip): SHA-256 `e8808f973a48223240e2c8863223ee4e2e85b988426c44fadd5f0b0cb95aa638`. Das Archiv enthält ein 1-m-Raster und World-Datei; Dateidatum im Archiv 30. September 2026. Laut [Stadt Wien](https://www.wien.gv.at/stadtplanung/geodatenviewer-ogd-daten-herunterladen) CC BY 4.0, erforderliche Angabe: „Datenquelle: Stadt Wien - data.wien.gv.at“. Die Höhen sind in Metern über Wiener Null (EPSG:8881), nicht Adriahöhen. Das DGM enthält keine Brücken; Gewässerbett und Durchlässe benötigen gesonderte Prüfung und gegebenenfalls dokumentierte Spielanpassungen.
- [OSM-Kartenabfrage](https://api.openstreetmap.org/api/0.6/map?bbox=16.383,48.234,16.398,48.244): `raw-data/brigittenau.osm`, SHA-256 `954e0ac7985cc586ca5bdcb3eb912b3a1e7c75d0bbffe188b2e0bcdb9ceff9fd`. Live-Daten; ein späterer Download kann sich ändern. © OpenStreetMap-Mitwirkende, [ODbL](https://www.openstreetmap.org/copyright). Weitergabe und Attribution des abgeleiteten Pakets sind noch zu prüfen; diese Notiz ersetzt keine Lizenzprüfung.

Reproduktion setzt exakt diese Dateien voraus; bei geändertem Abruf sind Prüfsummen neu zu dokumentieren. Das ZIP nach `raw-data/35_2/` entpacken und mit Python und den Versionen in `tools/requirements-geo.txt` ausführen:

```sh
python tools/inspect-geodata.py
```

Das Prüfskript benutzt Rasterio/GDAL zur Mittelung auf 4 m und PyProj zur Koordinatentransformation. Es schreibt ausschließlich `/tmp/waterfighter-geodata-inspection.json`. Der geprüfte Rasterausschnitt enthält 200 × 200 endliche Zellen, Werte 0,647 bis 11,247 m Wiener Null; 91 geschlossene gültige Gebäudewege, 419 Straßenwege und ein Gewässerweg schneiden das Rechteck. Diese Zählung beweist weder lückenlose OSM-Relationen noch ein übereinstimmendes Ufer. Der Donau-Mittelachsenweg allein bildet die Wasserfläche nicht ab. Multipolygone, Ufer, schmale Barrieren und Randbeschnitt sind vor einem Szenariopaket zu bearbeiten. Eine spätere Pipelineprüfung kontrolliert die Quelldatei auf maskierte und nicht endliche Rasterwerte und die Ausgabe auf endliche Werte; der Quellraster meldet keinen expliziten NoData-Wert. Eine weitergehende Prüfung auf fachlich falsche, aber endliche Werte bleibt offen.

## Gewässerrelationen und Kontrollbild

Zusätzlich über die OSM-API am 29. Oktober 2026 geladen:

- [Donau, Relation 32484 mit Elementen](https://api.openstreetmap.org/api/0.6/relation/32484/full), `raw-data/donau-relation.osm`, SHA-256 `ea5984cc48996b5455208f16aae808b72928ef03d4f88fe6fb9646a230485b88`.
- [Neue Donau, Relation 18444 mit Elementen](https://api.openstreetmap.org/api/0.6/relation/18444/full), `raw-data/neue-donau-relation.osm`, SHA-256 `f68a06ba1ea23689703972b6ef48c1afc7511725cb918950ca9a1a9ff2afe682`.

Nach dem ersten Prüfskript erzeugt `python tools/inspect-water.py` ein SVG in `/tmp/waterfighter-geodata.svg`. Das [Kontrollbild](geodaten-kontrolle.png) zeigt Höhen in Graustufen, Gewässer blau, Gebäude orange und Straßen gelb. Ufer und Gelände scheinen auf dieser Überlagerung räumlich plausibel; sie ist noch kein unabhängiger Vergleich mit einem Referenzbild. Die berechnete Donaufläche im Ausschnitt beträgt 240.480 m², die Neue Donau 9.290 m². Die Erkennung von Fließwegen, Brücken, Bruchkanten, möglichen Datenlücken und Spielanpassungen bleibt offen. Die Voruntersuchung umfasst keine vollständige Validierung aller Multipolygon-Relationen oder der ODbL-Weitergabepflichten.

## Vorläufiges Szenariopaket

`tools/build-scenario.py` liest die oben aufgeführten Rohdateien und die unten genannten sechs Gebäude-Relationen direkt und prüft ihre SHA-256-Werte vor der Verarbeitung. Ausgabe ist `public/scenarios/brigittenau-v1.json`; diese Datei ist ein Entwurf (`1.2-draft`), keine abgenommene Spielkarte. Eine Python-Umgebung mit `pip install -r tools/requirements-geo.txt` vorausgesetzt:

```sh
python tools/build-scenario.py
sha256sum public/scenarios/brigittenau-v1.json
```

Zwei aufeinanderfolgende Läufe ergaben SHA-256 `623eee76fdb023176a7207453a5c9350ae006bb1885ce8a1f518dcdcb76aea93`. Verwendet: Python 3.14.4, Rasterio 1.5.2 mit GDAL 3.12.2, PyProj 3.8.0/PROJ 9.8.1, Shapely 2.2.0/GEOS 3.14.1, NumPy 2.5.4. Andere Bibliotheksstände können die Geometrie oder Rundung ändern. Die WKT-Dateien besitzen unvollständige Autoritätsmetadaten; die Pipeline vergleicht deshalb Projektion, Meridian, Verschiebung, Maßstab und Bessel-Ellipsoid direkt, statt einen unsicheren EPSG-Vorschlag zu übernehmen. Die maßgebliche CRS-Angabe der Stadt ist oben dokumentiert.

Das Paket enthält das unbearbeitete gemittelte Gelände, separat ein Simulationsbett, initiale Wassertiefen, Gewässermasken und OSM-Geometrien. Mangels Bathymetrie wird die Sohle der OSM-Gewässerflächen im Entwurf künstlich auf 0 m Wiener Null und der Anfangsspiegel auf 2 m Wiener Null gesetzt; dies ist keine Messung. 12 m dienen als Darstellungshöhe, wenn keine brauchbare OSM-Höhe vorliegt. Das vorläufige Schadensziel ist 50.000; eine rechnerische Dammstrategie erreicht es. Vollständige spielerische und hydraulische Abnahme stehen aus. Die Geometrien werden am Szenariorand beschnitten; Gebäude-Multipolygone aus dem Kartenausschnitt werden inklusive Innenringen aufgelöst; sechs in der Kartenabfrage unvollständige Relationen wurden zusätzlich vollständig heruntergeladen. Ein Teil der Bruchlinien wird näherungsweise als überströmbare Zellkante abgebildet; Durchlässe sind noch nicht gesondert modelliert. Das Paket ist ohne Laufzeit-Kartenabfrage verfügbar und enthält Quellenangaben; die Lizenz- und Vollständigkeitsprüfung der OSM-Ableitung bleibt offen.

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

Der aktuelle Entwurf führt außerdem 26 OSM-Linien mit Mauer- oder Böschungskennzeichen und 73 Brücken-/Tunnelabschnitte getrennt auf. Diese Merkmale sind Kandidaten, keine bereits geprüften hydraulischen Sperren oder Durchlässe; ihre Höhen und tatsächliche Funktion sind nicht aus den Tags ableitbar. Die vier Meter gemittelten Höhen können schmale Kanten glätten. Die bezogenen Bruchkanten und näherungsweise daraus abgeleitete Zellkanten sind separat im Paket enthalten. Ihre hydraulische Interpretation und mögliche Durchlässe müssen vor der Szenarioabnahme geprüft werden.

## Unabhängiges Orthofoto und Wiener Bruchkanten

Am 29. Oktober 2026 wurden 72 Kacheln des [basemap.at-Orthofotos](https://basemap.at/orthofoto/) über den [WMTS-Dienst](https://mapsneu.wien.gv.at/basemapneu/1.0.0/WMTSCapabilities.xml) (Zoom 18) abgerufen. Datenquelle: [basemap.at](https://basemap.at/), CC BY 4.0. Die Kacheln liegen nur in `raw-data/basemap-orthofoto/`; ihre Prüfsummen stehen in [orthofoto-kacheln.json](orthofoto-kacheln.json). `python tools/check-overlay.py --download` bezieht fehlende Kacheln, die erneute Ausführung ohne diesen Schalter prüft die gespeicherten Prüfsummen und erzeugt beide Bilder. Aktualisierte Serverkacheln können nicht den ursprünglichen Abruf ersetzen, wenn ihre Prüfsumme abweicht. Pillow 13.0.0 ist zusätzlich in den Python-Voraussetzungen enthalten.

[Orthofoto mit Szenariogeometrien](orthofoto-kontrolle.jpg): Grundkarte basemap.at, © OpenStreetMap-Mitwirkende; Gebäude rot, Straßen gelb, Gewässerränder cyan. Die visuellen Kontrollen zeigen passende Gebäudeumrisse, Ufer und Brückenachsen ohne auffälligen großflächigen Projektionsversatz. Dies ist keine Vermessung der Lagegenauigkeit; Vegetation, Bauzustand und Erfassungszeitpunkt können einzelne Abweichungen verdecken.

Die [DGM-Bruchkanten, Blatt 35/2](https://www.wien.gv.at/ma41datenviewer/downloads/geodaten/dgm_bk_shp/35_2_dgm_bk.zip), wurden am selben Tag bezogen: SHA-256 `f5abb28d8a6d93ee99ae2f0934639ad5e5e1358b2985081aa3c9a9ca771aa7db`, CC BY 4.0, Datenquelle: Stadt Wien - data.wien.gv.at. Das Paket enthält 289 beschnittene 3D-Liniensegmente mit Höhen von 0,650 bis 11,275 m Wiener Null. Das [Bruchkanten-Kontrollbild](bruchkanten-kontrolle.jpg) ergänzt dieselbe Überlagerung um Typ 1 in Grün und Typ 2 in Magenta. Die [Datensatzbeschreibung](https://datasets.dataspace.fiwarebox.com/dataset/gelandemodell-bruchkanten-wien) bezeichnet Typ 1 als Bruchlinie und Typ 2 als Formlinie. Ab Version `1.2-draft` tastet `tools/breakline_faces.py` nur Typ-1-Linien ungefähr im Meterabstand ab, ordnet sie orthogonal Zellkanten zu und übernimmt die gemessene Höhenordinate als überströmbare Krone, wenn sie mehr als 0,15 m über beiden benachbarten gemittelten Sohlen liegt. So entstehen 291 Zellkanten; Typ 2 wird nicht als Sperre interpretiert. Ein Graben, der beide angrenzenden Zellen aushebt, senkt auch die abgeleitete Kante um seine Tiefe; ein separat gebauter Damm bleibt erhalten. Die Schwelle und die Rasterung sind nachvollziehbare Spielvereinfachungen, keine bestätigte Klassifikation einzelner Hochwasserschutzanlagen. Die [Kontrolle der Kandidaten](bruchkanten-kandidaten.jpg) zeigt sie grün über dem Orthofoto. Durchlässe, Brücken und die lokale Eignung der Näherung bleiben eine offene Abnahmelücke.

Die OSM-Ableitung und ihre Lizenzhinweise sind in [DATENQUELLEN.md](../public/scenarios/DATENQUELLEN.md) aufgeführt; die OSM-abgeleiteten Daten sind im Szenariopaket maschinenlesbar verfügbar. Ob die dauerhafte Bereitstellung der exakt verwendeten Ausgangsdaten und die Kombination aller Daten sämtliche Weitergabepflichten erfüllt, bleibt zu prüfen.

## Prüfung der Nutzungsbedingungen

Am 29. Oktober 2026 wurden die aktuellen Primärquellen erneut geprüft: Die [Stadt Wien](https://www.wien.gv.at/stadtplanung/geodatenviewer-ogd-daten-herunterladen) nennt für die Geobasisdaten der MA 41 CC BY 4.0 und den Quellenhinweis „Datenquelle: Stadt Wien - data.wien.gv.at“; sie bestätigt dort auch M34 und Wiener Null. Die [OSMF-Lizenz-FAQ](https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ) beschreibt Namensnennung, ODbL-Weitergabe abgeleiteter Datenbanken und die Bereitstellung der Daten beziehungsweise der Mittel zu ihrer Herstellung bei öffentlichen erzeugten Werken. Ihre [Namensnennungsrichtlinie](https://osmfoundation.org/wiki/Attribution_Guidelines) erläutert die sichtbare Kennzeichnung. Das Repository enthält die bearbeitete Szenariodatei, den Quellhinweis und das Aufbereitungsskript; die ursprünglichen Abrufe liegen außerhalb von Git und sind durch URLs und Prüfsummen dokumentiert.

Diese Prüfung bestätigt die einschlägigen Quellen und dokumentiert die vorgesehenen Maßnahmen, entscheidet aber nicht abschließend, ob die kombinierten und aufbereiteten Daten in jedem Verbreitungsfall eine abgeleitete oder eine Sammeldatenbank bilden oder ob die historisch exakten Rohdaten dauerhaft bereitgestellt werden können. Diese Punkte bleiben vor einer öffentlichen Bereitstellung zu klären.

## Systematische Prüfung von Kreuzungsstellen

`python tools/inspect-crossings.py` untersucht das ausgelieferte Szenario mit Shapely aus `tools/requirements-geo.txt`. Es vergleicht die OSM-Kreuzungslinien mit Gebäudegrundrissen und den aus Bruchlinien abgeleiteten Zellkanten; eine Kante gilt bei höchstens 4 m Abstand als nahe. Das Ergebnis wird als JSON auf stdout ausgegeben. Auf `1.2-draft` ergeben sich 73 Kreuzungsabschnitte: 41 mit `bridge=yes`, 12 mit `bridge=viaduct` und 20 mit `tunnel=building_passage`. Alle 20 Gebäudedurchgänge überlappen Gebäudegrundrisse um mehr als 5 cm. Bei den Brücken liegen 16 von 41 beziehungsweise 4 von 12 Abschnitten höchstens 4 m von mindestens einer modellierten Geländekante entfernt. Gebäudeüberlappungen betreffen außerdem 4 der 41 Brücken und 9 der 12 Viaduktabschnitte. Abschnitte sind keine unabhängig gezählten Bauwerke.

Beispielsweise schneiden die OSM-Abschnitte `1133399442` und `1133399444` den Grundriss `r11949528-0` jeweils über rund 11,2 m. Das Spiel behandelt den Gebäudegrundriss als hydraulisches Hindernis; diese Kartierung eines Durchgangs wird nicht als Öffnung übernommen. Das kann Fließwege gegenüber der Realität einschränken. Ein markierter Gebäudedurchgang belegt allein weder seine tatsächliche Höhenlage, freie Breite und hydraulische Funktion noch seine Öffnung während eines Hochwassers. Ebenso beweist die Nähe einer Brücke zu einer simulierten Kante keine fehlerhafte Sperre. Die Liste dient der gezielten fachlichen Prüfung; pauschales Öffnen anhand der Tags wäre unbegründet. Eine verbindliche Aussage zu Durchlässen und zwei geeigneten Wasserwegen bleibt offen.

## Zwei statische Landkorridore und Referenzflut

`npx tsx tools/find-land-routes.ts > /tmp/waterfighter-land-routes.json` sucht im tatsächlichen Spielraster `1.2-draft` getrennt in den Zeilenbereichen 20–70 und 120–170 nach vierfach benachbarten Landzellen vom Gewässerrand bis zum linken Szenariorand. Zugelassen sind nur Zellen und dazwischenliegende modellierte Kronen unter einem vorab gewählten Wasserspiegel von 10 m Wiener Null. Das ist eine hypothetische topologische Schwelle, kein gemessener Pegel. Gebäude und abgeleitete Geländekanten werden durch die vom Spiel gesetzten Kronen berücksichtigt. Der linke Szenariorand ist keine offene Abflussgrenze; die Suche beweist daher keine Abflussroute.

Gefunden wurden ein 61 Zellen langer Korridor von (53,35) nach (0,42), 240 m zwischen Zellmittelpunkten, und ein 207 Zellen langer Korridor von (149,166) nach (0,139), 824 m. `npx tsx tools/inspect-land-route-flood.ts` beobachtet anschließend diese Zellen während einer ungeschützten 300-s-Referenzrunde. Im ersten Korridor wurden 39 von 61 Zellen irgendwann tiefer als 0,01 m nass, im zweiten 4 von 207. Die jeweiligen lokalen Höchsttiefen waren 4,33 und 1,29 m; beide Korridore enthalten trocken gebliebene Zellen. Da die Maxima zu verschiedenen Zeitpunkten auftreten können, beweisen sie keinen gleichzeitig zusammenhängenden Wasserweg. Die zwei geometrischen Kandidaten erfüllen damit noch nicht den Nachweis zweier sinnvoller dynamischer Umleitungswege. Andere Wege wurden durch diese enge Suche nicht ausgeschlossen; insbesondere sind weitere Platzierungen von Graben und Abriss sowie Flussrichtungen zu untersuchen.

`npx tsx tools/inspect-wet-corridors.ts` untersucht ergänzend die ungeschützte Referenzflut zu sechs gleichzeitigen Zeitpunkten. Eine Landzelle zählt ab 0,05 m Tiefe; benachbarte nasse Zellen werden nur verbunden, wenn mindestens eine ihrer Wasseroberflächen über der dazwischenliegenden modellierten Krone liegt. Ausgegeben werden zusammenhängende Landbereiche mit mindestens zehn Zellen und Kontakt zu einer nassen Zelle der Gewässermaske. Bei 200 s ergeben sich drei solche getrennten Bereiche mit 2.810, 524 und 201 Zellen; ihre Zellkoordinaten-Grenzen sind (5,0)–(108,114), (132,17)–(199,112) und (117,123)–(163,184). Die maximalen lokalen Tiefen betragen dort 4,09, 2,03 und 1,51 m. Bei 80 s wurde kein entsprechender Bereich gefunden, bei 160 s drei. Das zeigt unterschiedliche gleichzeitig benetzte Landbereiche im vereinfachten Spielmodell. Der Test misst weder Flussrichtung noch Durchfluss, und Bereiche auf unterschiedlichen Ufern sind nicht automatisch alternative Umleitungen innerhalb des zu schützenden Viertels. Die Anforderung zweier sinnvoll nutzbarer Wasserwege bleibt deshalb offen.

`npx tsx tools/inspect-bank-flux.ts` ergänzt die Momentaufnahmen um eine Flussabschätzung über zwei vorab festgelegte Gruppen vertikaler Zellkanten: Zeilen 0–49 und 50–119, jeweils Landzelle links und Gewässermaskenzelle rechts. Vor jedem Schritt berechnet das Werkzeug aus dem alten Zustand denselben hydrostatisch rekonstruierten Rusanov-Massenfluss wie der Solver und integriert ihn mit der tatsächlich verwendeten Schrittweite. Dies ist eine separate Nachrechnung der Formel, keine direkte Instrumentierung des Solvers; horizontale Uferkanten und andere Abschnitte sind nicht enthalten.

Bei der unbehandelten 300-s-Runde von `1.2-draft` wurden über 103 Kanten im ersten Abschnitt insgesamt 12.710 m³ in Richtung Land und 71.779 m³ zurück in Richtung Gewässer verrechnet; über 71 Kanten im zweiten Abschnitt waren es 16 beziehungsweise 215.802 m³. Die saldierten Werte betragen −59.069 und −215.786 m³ in Richtung Land. Die Summen zählen Fluss in beiden Richtungen getrennt und können dasselbe Wasser mehrfach erfassen. Sie zeigen zeitweilige Bewegung über diese ausgewählten Kanten, aber keine zwei nachgewiesenen nutzbaren Umleitungen; insbesondere schließen sie andere Uferstellen und Maßnahmen nicht aus. Die Werte sind spielmodellabhängig und keine realen Hochwassermengen.
