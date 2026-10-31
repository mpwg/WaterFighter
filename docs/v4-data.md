# V4: Wiener Datengrundlage und Spielmodell

Stand: 31.10.2026. Datenquelle: Stadt Wien - data.wien.gv.at.

Die lokale Datei `public/v4/map.json` enthält einen amtlichen Kartenausschnitt um die tatsächliche Kreuzung Vorgartenstraße/Ennsgasse. Mittelpunkt in EPSG:31256: `(5298.3438,342719.8906)`, Grenzen `[5042.3438,342463.8906,5554.3438,342975.8906]`, Ausdehnung512×512m. Das Schema heißt `waterfighter-map/4`; das Raster hat256×256Zellen zu2m. Lokale Spielkoordinaten beginnen links oben: x nach Osten, y nach Süden. Zeile0 ist Norden.

## Amtliche Daten

- Straßengraph: Stadt Wien WFS, Layer `ogdwien:STRASSENGRAPHOGD`, 62 gelieferte Features, 61 beschnittene Linienabschnitte einschließlich Vorgartenstraße und Ennsgasse.
- Gebäude: WFS `ogdwien:FMZKGEBOGD`, 813 gelieferte Polygonteile. Zusammenfassung nach amtlicher `BW_GEB_ID`, falls vorhanden, sonst Feature-ID; Beschnitt, mindestens2m² und mindestens ein Rasterzentrum im Gebäude ergeben226 spielbare Gebäudeobjekte. Dies sind Geodatenobjekte, keine verifizierten Hausadressen oder Nutzungen.
- Gelände: DGM-TIFF-Kacheln `36_1` und `36_3`. EPSG:31256 ist in beiden TIFFs angegeben. Originalwerte werden am Zentrum jeder2m-Zelle aus dem1m-DGM abgetastet, ohne Glättung, Höhenoffset, erfundene Böschung oder Geländeersatz. Die native vertikale Referenz wird unverändert übernommen. Die Werte im Ausschnitt liegen zwischen4.0300 und11.6080. Es wird keine unbestätigte Umrechnung auf Meereshöhe vorgenommen.
- Gebäudeumringe, Innenhöfe und Mehrfachpolygone bleiben in `geometry` erhalten. `polygons` enthält nur Außenringe als einfache Anzeigehilfe. Der Solver verwendet exakt die amtlich abgeleiteten belegten `cells`. Gebäude sind anfangs undurchlässige Spielhindernisse; Abriss öffnet genau diese Zellen auf dem unveränderten DGM.

Die vollständigen tatsächlich abgerufenen WFS-URLs, Abrufdatum und SHA256 der Rohdateien stehen in `map.provenance.sources`. Beide WFS-Abfragen verwenden denselben oben genannten512m-Ausschnitt in EPSG:31256. Die zunächst weiter gefasste Explorationsabfrage wurde vor dem Import durch den exakten Ausschnitt ersetzt. WFS-Inhalte können sich später ändern; ein erneuter Live-Abruf ist dann eine neue Datenversion.

DGM-Downloads:

- <https://www.wien.gv.at/ma41datenviewer/downloads/geodaten/dgm_tif/36_1_dgm_tif.zip>
- <https://www.wien.gv.at/ma41datenviewer/downloads/geodaten/dgm_tif/36_3_dgm_tif.zip>

Offizielle Erläuterung: [DGM-Daten beziehen](https://www.wien.gv.at/stadtplanung/digitales-gelaendemodell-daten-beziehen), [Wiener OGD-Nutzungsbedingungen](https://digitales.wien.gv.at/ogd-nutzungsbedingungen/). Die Stadt veröffentlicht diese OGD unter CC BY4.0; die vorgeschriebene Attribution lautet „Datenquelle: Stadt Wien - data.wien.gv.at“. Die Geometrien wurden beschnitten und rasterisiert, Höhen wurden neu abgetastet. Reale Nutzungsarten und Immobilienwerte werden nicht behauptet.

## Reproduzierbarer Import

```sh
python3 -m venv /tmp/v4-geo
/tmp/v4-geo/bin/pip install -r tools/v4-import-requirements.txt
/tmp/v4-geo/bin/python tools/v4-import.py --download --raw-dir /tmp/v4-raw --output public/v4/map.json
```

Ohne `--download` liest der Import ausschließlich vorhandene Rohdateien und bricht bei fehlenden oder unplausiblen DGM-Werten ab. Mit `--download` werden fehlende Dateien von den gespeicherten amtlichen URLs geholt. Für einen neuen Live-Abruf ein leeres Rohdatenverzeichnis verwenden. Die Rohdaten bleiben außerhalb des Repositorys; im Spiel wird nur die lokale versionierte Karte geladen. Gleiche Rohdateien und die gepinnten Pakete erzeugen dieselbe JSON-Datei; kein Zufall und kein stiller synthetischer Ersatz.

Rohdaten-Hashes des Imports:

| Datei | SHA256 |
|---|---|
| roads-wide.json | `7819abc2ffde4535da02a6cec2c391f19fe72922d08aa0d5595abd8897cc21f3` |
| buildings.json | `ec4331e3dfaf5d55bef46fe9aa204762b1b8007677466b778ed0c5e91d98a3ce` |
|36_1_dgm_tif.zip| `eb998deb9ecccbe024d1e4541bd40466ccfee46e1c4b17f1ddabf194660df4e1` |
|36_3_dgm_tif.zip| `5706236acf18c0096a021f0d80dd5c6885062326b46dd4af2908c4c792abff86` |

## Bewusste Spielfiktion

Der Deichbruch liegt fiktiv am westlichen Rand nahe der Lassallestraße, in einem64m-Fenster bei lokalen y200…264m. Von32 Randzellen sind28 offen. Ein externer Wasserspiegel relativ zum mittleren Quellgelände steigt bis10s auf0.12m, dann bis65s auf3.2m, bis90s auf3.8m. Diese Kurve ist keine reale Wiener Gefahrenprognose. Andere äußere Randzellen lassen Wasser austreten; außerhalb des Ausschnitts wird keine Landschaft simuliert. Nach Eintritt bestimmen das unveränderte DGM, echte Gebäudezellen und die gesetzten Rasterkanten den Fluss. Es gibt keinen versteckten Zielkanal.

Eine Spielsekunde entspricht sechs hydraulischen Sekunden. Der Solver verwendet0.025s feste Spielschritte, lokale träge, vom Wasserstand angetriebene Nachbarflüsse und lineare Dämpfung0.08. Ein simultaner Donor-Limiter verhindert, dass eine Zelle insgesamt mehr Wasser abgibt als vorhanden. Jeder interne Transfer wird genau einmal abgezogen und einmal addiert; Quelle und Randabfluss werden separat bilanziert. Dies ist ein vereinfachtes Rastermodell mit Arcade-Kalibrierung, kein validierter Hochwasserrechner.

149 Barrierenkandidaten entstehen quer zu amtlichen Straßenlinien. Die Linien werden auf zusammenhängende gemeinsame Rasterkanten geschnappt; `points` und `faces` beschreiben exakt dieselbe Geometrie. Die Hindernisoberkante liegt1.25m über dem höheren Gelände der beiden Nachbarzellen. Höheres Wasser kann überströmen. Die maximal30m Suche je Straßenseite ist eine fiktive Platzierungsregel; amtliche Fahrbahnbreiten oder technische Bauwerke werden damit nicht nachgebildet.

Nördlich von lokal y230m liegt das fiktive Schutzviertel, südlich das fiktive Opfergebiet. Die Klassifikation beeinflusst ausschließlich feste Punktwerte, keine Höhen oder Durchlässigkeit: Schutzwerte `3 × clamp(round(2.5 × Fläche),350,7000)`, Opferwerte `round(clamp(0.35 × Fläche,100,2000))`. Die niedrigeren südlichen Werte wurden bewusst so kalibriert, dass ein reales geöffnetes Gebäude eine wirtschaftlich sinnvolle Entlastung ermöglichen kann. Keine reale Nutzung oder reale Entschädigung wird abgebildet.

Flutschaden sammelt sich nach mittlerer Wassertiefe an den äußeren Gebäudezellen und Einwirkdauer, gedeckelt auf den Gebäudepunktwert: Wert×min(Tiefe,3m)×dt/90. Innenhöfe bleiben geometrisch offen. Abriss kostet immer den noch nicht als Flutschaden gezählten Restwert **plus250Punkte**, auch nach vollständiger Flutschädigung. Vorheriger Flutschaden bleibt bestehen. Abriss löscht oder erzeugt kein Wasser und kann nicht wiederholt werden. Der sichtbare Preis wird vom Kern als `demolitionCosts` geliefert und bei Ausführung neu autoritativ berechnet.

Das Spiel startet mit100000Punkten,3 Barrieren und2 Abrissen. Barrieren laden alle15s laufender Spielzeit um1 nach (maximal3), Abriss einmal bei45s um1 (maximal2). Entfernen einer Barriere erstattet nichts. Pause und Rundenende sperren Werkzeuge und Zeitfortschritt; Neustart erzeugt den vollständigen Ausgangszustand.

## Prüfung und Grenzen

`bun run test tests/v4-core.test.ts` prüft Gelände/Geometrie, exakte Barrierenkanten, ruhenden Wasserspiegel, Gefällefluss, Wassererhalt, Überströmen/Entfernen, Umleitung, Abrissöffnung/positiven Preis, Ressourcen, Pause, Neustart und deterministische Wiederholung. Eine vollständige amtliche90s-Runde prüft endliche nichtnegative Wasserstände und die Quellen-/Randbilanz. `bun tools/v4-compare.ts` vergleicht dieselbe Flut mit dokumentierten Eingriffen und misst komplette90s-Runden. Ergebnisse gehören zum Task-1-Bericht und späteren V4-Abnahmebericht.

Browserdarstellung, menschliche Verständlichkeit, echtes Spielgefühl und reale Geräte sind hiermit noch nicht abgenommen. Barrieren und Gebäude sind Rasterhindernisse; unterirdische Leitungen, Abwasser, Gebäudeinneres, reale Tragfähigkeit, Bauhöhen und reale Bruchszenarien werden nicht modelliert.
