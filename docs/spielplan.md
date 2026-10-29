# WaterFighter – verbindlicher Spielplan

Stand: 29. Oktober 2026. Dieses Dokument beschreibt das verbindliche Konzept; Implementierungsstand und offene Abnahme stehen in [status.md](status.md).

## 1. Ziel

WaterFighter ist ein browserbasiertes Hochwasserschutzspiel. Spieler schützen ein reales Wiener Stadtviertel an der Donau durch Dämme, Gräben und gezielten Gebäudeabriss. Das Spiel kombiniert Planung mit Eingriffen während einer sichtbaren Flutwelle.

Die Geografie ist real; Flutereignis, Baukosten und Schäden sind für das Spiel abgestimmt. Die Anwendung ist keine Hochwasserprognose und kein Werkzeug für reale Schutzentscheidungen.

## 2. Verbindlicher Prototypumfang

| Bereich | Festlegung |
| --- | --- |
| Spielwelt | Ein vorbereiteter Wiener Kartenausschnitt an der Donau mit ungefähr 500–1.000 Metern Seitenlänge |
| Geografische Basis | OpenStreetMap für Gebäude, Straßen und Gewässer; Wiener DGM für Geländehöhen |
| Darstellung | Stilisierte 2,5D-Welt aus 3D-Geometrien mit orthografischer, fest schräger Kamera |
| Simulation | Zweidimensionale Flachwassersimulation mit Strömung, Rückstau, Flutwelle und Überströmung |
| Ablauf | Unbegrenzte Vorbereitung, danach jederzeit pausierbare Echtzeit |
| Werkzeuge | Dämme bauen, Gräben ausheben, Gebäude abreißen |
| Herausforderung | Begrenztes Budget; Flutschäden und Abrissverluste minimieren |
| Geräte | Desktop mit Maus und Tastatur; iPhone und Android mit Touch |
| Inhalte | Ein Szenario, Einführung, vollständige Spielrunde, Ergebnis und Neustart |

## 3. Szenario und Daten

Ein Wiener Ausschnitt am Donauufer wird nach Datenprüfung ausgewählt. Er muss Bebauung, einen möglichen Wasserzufluss und mindestens zwei alternative Wasserwege enthalten. Die Auswahl gehört zu AP 2; der aktuelle Entwurf und seine offenen Prüfungen sind in der [Geodaten-Voruntersuchung](geodaten-voruntersuchung.md) dokumentiert.

OSM liefert Grundrisse und Kartenobjekte. Das Wiener DGM liefert die Geländeform. Fehlende Gebäudehöhen dürfen für die Darstellung durch dokumentierte Standardwerte ersetzt werden. Änderungen am Gewässerbett, an Durchlässen oder anderen Teilen der Simulationsgeometrie werden als separate Szenarioanpassungen erfasst. Reale Geografie darf nicht stillschweigend durch eine Fantasiekarte ersetzt werden.

Die Daten werden vorab verarbeitet und als fertiges Szenariopaket ausgeliefert. Im laufenden Spiel sind keine Live-Abfragen an OSM und keine externen Kartenkacheln erforderlich. Quellen und Lizenzhinweise sind im Spiel zugänglich.

## 4. Spielrunde

1. **Laden:** Szenario laden und Fehler verständlich anzeigen.
2. **Einführung:** Ziel, drei Werkzeuge, Kamera, Pause und Kosten erklären.
3. **Vorbereitung:** Ohne Zeitdruck Maßnahmen innerhalb des Budgets bauen.
4. **Flut:** Eine feste Zuflusskurve startet. Spieler können weiter bauen, pausieren und zwischen einfacher und doppelter Geschwindigkeit wechseln.
5. **Ergebnis:** Nach zunächst fünf Minuten simulierter Rundendauer werden Schäden und Zielerreichung ausgewertet. Das ist eine Spielwertung zum Rundenende, keine Aussage über spätere reale Schäden.
6. **Neustart:** Vollständigen Ausgangszustand wiederherstellen.

Die anfängliche Rundendauer, Flutkurve, Werkzeugkosten und das Schadensziel werden als Szenarioparameter geführt und anhand reproduzierbarer Referenzrunden abgestimmt.

## 5. Bauwerkzeuge

### Damm

Ein gezeichneter Verlauf erhöht Barrieren zwischen Simulationszellen. Wasser staut sich und kann bei ausreichendem Pegel überströmen. Automatischer Bruch und Erosion sind nicht Bestandteil des Prototyps.

### Graben

Ein gezeichneter Verlauf senkt das Gelände und schafft einen neuen Wasserweg oder Speicherraum. Vorhandenes Wasser bleibt beim Ausheben erhalten.

### Abriss

Ein Gebäude wird gezielt ausgewählt und nach Vorschau abgerissen. Seine Strömungsblockade entfällt. Der Abriss verursacht Kosten und zählt als vollständiger Verlust dieses Gebäudes.

### Gemeinsame Regeln

- Vorschau zeigt Geometrie, Kosten und verbleibendes Budget, ohne den Spielzustand zu ändern.
- Erst die ausdrückliche Bestätigung löst eine Aktion aus.
- Maßnahmen erfolgen sofort am nächsten Simulationsschritt; während einer Pause werden sie ebenfalls verarbeitet, ohne die Simulationszeit fortzuschreiben.
- Unbezahlbare und ungültige Aktionen werden ohne Teiländerungen abgelehnt.
- Es gibt keine Bauzeiten und keine automatische Rückerstattung.
- Wasser darf durch Bauen oder Graben nicht unbemerkt entstehen oder verschwinden.

## 6. Schäden und Zielerreichung

Gebäudewerte werden für den Prototyp aus der Grundfläche abgeleitet. Flutschäden hängen von Wassertiefe und Überflutungsdauer ab. Eine dokumentierte Spielregel bewertet Wasser an den Gebäudegrenzen; ein als undurchlässig modelliertes Gebäude darf nicht allein deshalb schadensfrei bleiben, weil seine Innenzellen trocken sind.

Das Ergebnis nennt Flutschäden, Abrissverluste, Gesamtschaden, Budgetrest und das Erreichen des Schadensziels. Ein abgerissenes Gebäude zählt einmal mit seinem vollständigen Wert; vorherige Flutschäden werden nicht zusätzlich addiert.

Ohne Maßnahmen muss die Runde deutlich schlechter enden als mit einer sinnvollen Schutzstrategie. Mindestens eine bezahlbare Strategie muss das Ziel erreichen. Jedes der drei Werkzeuge muss eine nachgewiesene sinnvolle Anwendung haben; nicht jede erfolgreiche Strategie muss alle Werkzeuge verwenden.

## 7. Darstellung und Bedienung

- Erkennbare Gebäudegrundrisse, Gelände und Wasserstände in einer stilisierten 2,5D-Ansicht.
- Feste schräge Kameraperspektive mit Verschieben und Zoom.
- Oberflächenanimation macht Strömung sichtbar, beeinflusst aber nicht die Simulation.
- Touch-Bedienung trennt Kamera- und Baumodus ausdrücklich.
- Hoch- und Querformat sind bedienbar; zentrale Bedienelemente sind mindestens 44 CSS-Pixel groß.
- Schäden und Werkzeugzustände werden nicht ausschließlich durch Farben vermittelt.
- Wassertiefe, Gebäudezustand, Budget und Rundenzustand sind verständlich zugänglich.

## 8. Ausgeschlossener Umfang

Keine freie Ortswahl, keine Weltkarte, kein Multiplayer, keine Benutzerkonten, keine Kanalisation, keine Erosion, keine automatischen Dammbrüche, keine Gebäudeeinstürze, kein Treibgut und keine wissenschaftlich kalibrierte Gefahrenbewertung.

Kein erforderliches Laufzeit-Backend, keine kostenpflichtigen Dienste und keine öffentliche Veröffentlichung ohne autorisiertes Hostingziel. Die Implementierung soll keine zusätzlichen Produktfunktionen aufnehmen, um offene Abnahmekriterien zu umgehen.

## 9. Quellenbasis

Diese Quellen wurden während der Planung gelesen. Downloads, Datenstände, Abdeckung und Nutzungsbedingungen müssen bei der tatsächlichen Beschaffung erneut geprüft werden.

- [Stadt Wien: DGM-Datenbezug](https://www.wien.gv.at/stadtplanung/digitales-gelaendemodell-daten-beziehen): unter anderem 1-Meter-Raster, CC BY 4.0 und verlangte Quellenangabe.
- [Stadt Wien: DGM-Produktinformation](https://www.wien.gv.at/stadtplanung/digitales-gelaendemodell-produktinformation): Koordinaten- und Höhenbezug, Genauigkeit, Brücken nicht im DGM enthalten.
- [OpenStreetMap: Copyright und Lizenz](https://www.openstreetmap.org/copyright).
- [OpenStreetMap Foundation: Attribution Guidelines](https://osmfoundation.org/wiki/Attribution_Guidelines).

Die konkrete Lizenzentscheidung für den eigenen Spielcode ist noch nicht getroffen. Sie ist von den Lizenzpflichten der verwendeten Daten und Bibliotheken zu unterscheiden.
