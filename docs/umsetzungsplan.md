# WaterFighter – detaillierter Umsetzungsplan

Stand: 29. Oktober 2026. Maßgebliches Produktziel: [Spielplan](spielplan.md).

Dieser Plan ist ein Implementierungsauftrag, kein Nachweis einer vorhandenen Implementierung. Aktueller Fortschritt und Abnahme stehen in [status.md](status.md). Der kopierfertige Arbeitsauftrag steht in [goal-auftrag.md](goal-auftrag.md).

## 1. Arbeitsweise und Abschlussdefinition

Arbeitsreihenfolge: **AP 1 → AP 2 → AP 3 → AP 4 → AP 5 → AP 6 → AP 7**.

Der frühe Leistungstest in AP 3 geht einer umfangreichen Oberfläche voraus. Fehlender Zugriff auf echte Smartphones verhindert unabhängige Implementierungsarbeiten nicht, bleibt aber eine ausdrücklich offene Geräteabnahme.

Nach jedem Arbeitspaket:

1. Relevante Prüfungen auf dem aktuellen Stand ausführen.
2. Ergebnis, verwendete Versionen und etwaige Grenzen dokumentieren.
3. Status und Kriterienmatrix aktualisieren.
4. Erst dann das nächste Paket bearbeiten; unabhängige Arbeiten dürfen bei einer externen Blockade weitergehen.

Statuswerte: **offen**, **in Arbeit**, **implementiert**, **geprüft**, **blockiert**. „Implementiert“ ist kein Abnahmebeleg. „Geprüft“ ist nur zulässig, wenn alle Kriterien des Pakets belegt sind. Einzelkriterien erhalten **erfüllt**, **offen** oder **nicht prüfbar**.

Routineentscheidungen innerhalb des Plans trifft der implementierende Agent selbstständig und dokumentiert sie. Rückfragen sind bei Änderungen des Produktziels erforderlich, insbesondere Entfernung einer Zielplattform, Fantasiegeografie statt realer Daten, Pegelmodell statt Flutwellensimulation oder Einführung notwendiger kostenpflichtiger Dienste beziehungsweise eines Backends.

Keine öffentliche Veröffentlichung ohne autorisiertes Hostingziel. Keine automatische Erweiterung des Funktionsumfangs. Unabhängige Änderungen anderer Beteiligter erhalten. Commits, Pushes und neue Goals werden nicht allein durch dieses Dokument ausgelöst.

## 2. Architektur

### 2.1 Laufzeit und Entwicklungswerkzeuge

| Bereich | Vorgabe |
| --- | --- |
| Anwendung | TypeScript und Vite |
| Rendering | Babylon.js, WebGL2, orthografische Kamera |
| Oberfläche | DOM-basierte Menüs und Anzeigen über der Spielansicht |
| Simulation | Eigenständiger CPU-Solver in einem Web Worker |
| Vorverarbeitung | Python und GDAL, offline vor Auslieferung |
| Tests | Vitest für Solver/Regeln; Playwright für Browserabläufe |
| Bereitstellung | Statische Dateien, kein Laufzeit-Backend |
| Abhängigkeiten | Tatsächliche Versionen und Lockdateien eincheckbar dokumentieren |

WebGPU ist keine Voraussetzung. Auch `SharedArrayBuffer` und besondere Cross-Origin-Isolation-Header sind keine Voraussetzung. Bibliotheksversionen werden zu Beginn der Implementierung auf Kompatibilität geprüft, nicht aus dem Plan geschätzt.

### 2.2 Modulgrenzen

- **Szenariolader:** Manifest und Daten lesen, Version, Dimensionen und endliche Werte prüfen; Fehler vor Start sichtbar machen.
- **Simulation:** Numerik und Wasserbilanz; unabhängig von DOM und Babylon.js testbar.
- **Spielregeln:** Aktionen, Budget, Gebäudezustand, Schäden und Rundenzustand.
- **Worker:** Verbindlicher Spielzustand, Zeitsteuerung und Nachrichtenverarbeitung.
- **Darstellung:** Gelände, Gebäude, Wasser und bestätigte Änderungen visualisieren.
- **Bedienung:** Kamera, Werkzeuge, Vorschau, Bestätigung, Menüs und Statusanzeigen.
- **Geodatenpipeline:** Rohdaten beziehen und in ein reproduzierbares Szenariopaket überführen.

### 2.3 Szenariopaket

Versioniertes Manifest plus kompakte Raster-/Geometriedaten mit:

- Szenariokennung, Version und geografischer Ausdehnung.
- Koordinatensystem, metrischem Ursprung, Höhenbezug, Rastermaßen und Zellweite.
- Geländehöhen, Gebäudegrundrissen, Darstellungsmerkmalen und Spielwerten.
- Straßen, Gewässern, Barrieren und Durchlässen.
- Anfangswasserstand, Zuflusskurve und Randbedingungen.
- Budget, Werkzeugparametern, Kosten, Rundendauer und Schadensziel.
- Herkunft, Datenstand, Lizenz, Quellenangaben und Szenarioanpassungen.

OSM-Daten und DGM werden vorab zusammengeführt. Zur Laufzeit lädt das Spiel nur mitgelieferte Dateien. Abgeleitete Daten müssen entsprechend ihren Lizenzpflichten bereitgestellt und gekennzeichnet werden; eine Quellenangabe allein ist keine pauschale Prüfung aller Weitergabepflichten.

### 2.4 Worker-Protokoll

TypeScript-Typen bilden Nachrichten als diskriminierte Varianten ab. Die konkrete Dateistruktur ist innerhalb der Modulgrenzen frei wählbar.

| Richtung | Inhalt |
| --- | --- |
| Oberfläche → Worker | Szenario laden; zurücksetzen; starten; pausieren/fortsetzen; Geschwindigkeit setzen; Bauaktion bestätigen |
| Worker → Oberfläche | Bereit; Zustand/Snapshot; Aktion bestätigt oder abgelehnt; Ergebnis; Fehler |

Bestätigte Bauaktionen tragen eine eindeutige Kennung und die Kennung der aktuellen Runde. Doppelte Übermittlung darf weder doppelte Kosten noch doppelte Geometrieänderungen verursachen. Verspätete Nachrichten aus einer vorherigen Runde dürfen einen Neustart nicht verändern.

Snapshots enthalten Simulationszeit, Rasterzustand, Strömung, Budget, Gebäudeschäden und Diagnosewerte. Große Felder werden über wiederverwendbare übertragbare Puffer ausgetauscht. Ein begrenzter Pufferpool beziehungsweise eine Rückgaberegel verhindert wachsende Nachrichtenwarteschlangen; fehlende Renderkapazität darf keine Simulationsschritte löschen.

Der Worker ist maßgeblich. Die Oberfläche darf Kosten und Geometrie vorschauen, aber bestätigte Änderungen erst nach erfolgreicher Antwort übernehmen. Während einer Pause bleiben Aktionen verarbeitbar, ohne Zeitfortschritt. Fehler stoppen die Berechnung kontrolliert und erlauben einen Neustart.

## 3. AP 1 – Projektgrundlage und Dokumentation

### Umsetzung

1. Repository-Regeln, Arbeitsverzeichnis und fremde Änderungen prüfen.
2. Vorhandene Planungsdokumente lesen und erhalten; sie sind mit diesem Dokumentationsauftrag bereits angelegt.
3. TypeScript-/Vite-Projekt mit Babylon.js und Worker aufsetzen.
4. Befehle für Entwicklung, Produktionsbuild, Typprüfung und Tests einrichten.
5. Vitest und Playwright konfigurieren, Abhängigkeiten sperren.
6. Eine minimale Szene und einen Worker-Initialisierungsablauf implementieren.
7. README um echte Voraussetzungen, Installations- und Prüfkommandos ergänzen.

### Abnahme

- Entwicklungsserver und Produktionsbuild funktionieren.
- Eine einfache Szene erscheint tatsächlich im Browser.
- Worker und Oberfläche tauschen einen geprüften Initialisierungszustand aus.
- Typprüfung und grundlegende Tests bestehen.
- Ein neuer Entwickler kann Einrichtung und Prüfungen anhand der README nachvollziehen.

**Belege:** Befehle und Ergebnisse mit Versionsständen; Browserbeobachtung. Keine bloße Behauptung anhand des Quellcodes.

## 4. AP 2 – Wiener Szenario und Geodatenpipeline

### Umsetzung

1. Einen Donauufer-Ausschnitt mit Bebauung, Wasserzugang und zwei Umleitungswegen auswählen. Abgrenzung und Auswahlgrund dokumentieren.
2. OSM-Rohdaten und Wiener DGM über dokumentierte Quellen beziehen. Nutzungsbedingungen, Datenstand und Abdeckung live prüfen.
3. Große Rohdaten außerhalb von Git ablegen. Bezug, Dateinamen und Prüfsummen in einem Quellenmanifest dokumentieren.
4. OSM und DGM in ein gemeinsames metrisches Koordinatensystem überführen. Wiener Höhenbezug gesondert prüfen; keine Vermischung mit Meereshöhen ohne Transformation.
5. Mit ungefähr 4 Metern Simulationszellweite beginnen, höher aufgelöste Quelldaten erhalten.
6. Gebäude und hydraulisch wichtige schmale Barrieren gesondert erfassen. Mittelung darf Schutzlinien nicht unbemerkt entfernen.
7. Ufer, Unterwassergeometrie, Brücken und Durchlässe prüfen. Nicht im DGM enthaltene Informationen nur als dokumentierte Ergänzungen verwenden.
8. Fehlende Gebäudehöhen durch ausdrücklich als solche gekennzeichnete Darstellungswerte ersetzen.
9. Spielanpassungen getrennt von den Originaldaten speichern und automatisch anwenden.
10. Wiederholbaren Pipeline-Befehl samt Voraussetzungen und Szenarioausgabe dokumentieren.

### Abnahme

- Aus dokumentierten Rohdaten entsteht reproduzierbar dasselbe Szenariopaket; Zeitstempel dürfen die Inhaltsprüfung nicht verfälschen.
- Gebäude, Straßen, Ufer und Gelände stimmen bei einer visuellen Überlagerungsprüfung überein.
- Keine unbemerkten Datenlücken, NoData-Werte, Projektionsversätze oder falschen Höheneinheiten.
- Quellen, Lizenzhinweise, Anpassungen und Grenzen sind vollständig dokumentiert.
- Der Browser benötigt keine externe Karten-API.

**Belege:** Quellenmanifest, Pipeline-Lauf, Ausgabeprüfsummen, visuelle Kontrollansicht und Bericht über Geometriekorrekturen.

## 5. AP 3 – Flachwassersimulation und frühe Messung

### Umsetzung

1. Synthetische Testfelder für Becken, Gefälle, Engstelle und Dammöffnung anlegen; sie sind Testdaten, kein Ersatz für das reale Spielszenario.
2. Konservatives Finite-Volumen-Verfahren für die zweidimensionalen Flachwassergleichungen implementieren.
3. Ausgangsverfahren: Rusanov-Flüsse, hydrostatische Rekonstruktion, Positivitätsschutz und CFL-gesteuerte Zeitschritte.
4. Trockene Zellen, Bodenreibung und Geländeneigung behandeln. Korrekturen dürfen Massenfehler nicht verdecken.
5. Geschlossene Grenzen, definierte Zuflüsse und offene Abflüsse implementieren.
6. Wasservolumen, Ein-/Ausfluss und Bilanzfehler erfassen.
7. Simulation und Renderfrequenz entkoppeln. Bei Last keine physikalischen Zeitschritte überspringen; Rückstand sichtbar messen.
8. Wiener Szenario einbinden und Leistung früh messen, möglichst auf beiden echten Smartphone-Plattformen.

### Numerische Abnahme

- Ruhender Wasserspiegel bleibt über unebenem Gelände stabil.
- Keine negativen Wassertiefen, NaN-Werte oder unkontrollierten Spitzen.
- Relativer Bilanzfehler unter 0,1 % über zehn Minuten Simulationszeit, sowohl in einem geschlossenen Becken als auch mit bilanzierten Randflüssen.
- Bilanzreferenz und Nenner vor Testausführung dokumentieren; keine Division durch null bei trockenen Fällen. Beispielsweise Fehlerbetrag relativ zu Anfangsvolumen plus kumuliertem Zufluss; für vollständig trockene Fälle absolute Nullprüfung.
- Dammöffnungswelle breitet sich plausibel aus; Symmetrie, Flussrichtung und Ausbreitung werden numerisch geprüft und sichtbar kontrolliert.
- Gleiche Eingaben liefern innerhalb vorab festgelegter, dokumentierter Toleranzen gleiche Ergebnisse.
- Rastergröße, Laufzeit, Subschritte und Testplattform werden protokolliert.

### Leistungsregel

Bei unzureichender Leistung zunächst Profiling, Speicherzugriffe und Schrittberechnung optimieren. Erst anschließend Kartenumfang oder Raster kontrolliert anpassen. Physikalische und spielerische Tests nach Rasteränderungen wiederholen. Kein stiller Wechsel auf WebGPU oder ein reines Pegelmodell.

**Belege:** Automatisierte Solvertests, Wasserbilanz, Testkanal-Darstellung und früher Messbericht. Fehlende Geräte ausdrücklich nennen; Desktop-Werte sind keine Smartphone-Abnahme.

## 6. AP 4 – 2,5D-Darstellung und Bedienung

### Umsetzung

1. Gelände als Mesh und Gebäude als vereinfachte extrudierte Grundrisse darstellen.
2. Wasseroberfläche aus Geländehöhe plus Wassertiefe ableiten.
3. Strömungsabhängige Oberflächenanimation ergänzen, ohne Einfluss auf die Physik.
4. Orthografische, feste schräge Kamera mit Verschieben und Zoom einrichten.
5. Maus und Touch unterstützen; Kamera- und Baumodus ausdrücklich trennen.
6. Werkzeugvorschau, Budget, Wassertiefe, Gebäudeschäden und Rundenzustand anzeigen.
7. Hoch- und Querformat sowie kleine Bildschirme berücksichtigen.
8. Ladefehler, fehlendes WebGL2 und Worker-Ausfälle verständlich behandeln. Bei Context-Verlust kontrolliert anhalten und Wiederherstellung oder Neustart anbieten.

### Abnahme

- Kamera und Werkzeuge sind vollständig ohne Tastatur bedienbar.
- Verschieben und Zoomen lösen keine Baumaßnahmen aus.
- Zentrale Bedienelemente mindestens 44 CSS-Pixel groß.
- Zustände und Schäden sind nicht ausschließlich farbcodiert.
- Gelände, Gebäude und Wasser liegen räumlich konsistent.
- Fehler führen zu einer sichtbaren, handlungsfähigen Oberfläche statt einer leeren Szene.

**Belege:** Browserabläufe, Screenshots und dokumentierte Maus-/Touch-Interaktionen in beiden Orientierungen.

## 7. AP 5 – Werkzeuge, Budget und Schäden

### Umsetzung

**Nächste Produktarbeit:** Nach der spielbaren Übergabe großzügige Arcade-Platzierung für Dämme und Gräben vor weiterem Balancing oder Physik-Feintuning umsetzen. Nahe Endpunkte und sinnvolle Anschlüsse tolerant verbinden; unbeabsichtigte kleine Lecks und fehlende Auslassanschlüsse vermeiden. Die Vorschau zeigt den tatsächlich angewandten Verlauf und seine spürbare Breite; Kosten entsprechen der bestätigten Maßnahme. Kein automatisches Ermitteln einer optimalen Strategie, keine stillen großen Umwege und kein Architekturwechsel. Warnhinweise allein erfüllen diese Anforderung nicht. Der aktuelle Quellstand setzt breite hydraulisch wirksame Damm- und Grabenflächen sowie tolerante Anschlüsse um; die menschliche Verständlichkeit bleibt offen.

1. Gemeinsame Aktionsvalidierung für Geometrie, Kosten, Budget und aktuellen Rundenzustand implementieren.
2. Dämme entlang Linien als Barrieren an Zellgrenzen abbilden. Überströmung konservativ zwischen benachbarten Zellen verrechnen.
3. Gräben entlang Linien ausheben, ohne vorhandenes Wasservolumen zu verändern.
4. Gebäude auswählen, Abriss vorschauen und deren Blockade nach Bestätigung entfernen.
5. Vorschau und verbindliche Anwendung trennen. Kosten, Geländeveränderung und Restbudget zeigen.
6. Bestätigte Aktionen atomar am nächsten Verarbeitungsschritt anwenden, auch in Pause. Ungültige Aktionen vollständig ablehnen.
7. Änderungen während überfluteter Zustände testen; Bewegung/Verdrängung von Wasser explizit bilanzieren.
8. Gebäudewerte aus Grundflächen ableiten. Schäden anhand benachbarter Wassertiefe und Expositionsdauer monoton bis zum Gebäudewert berechnen.
9. Abriss ersetzt den bisherigen Schaden durch vollständigen Verlust; keine Addition beider Werte.

### Abnahme

- Grobe Damm- und Grabenplatzierung verbindet nahe sinnvolle Anschlüsse fehlertolerant; Vorschau, bestätigte Geometrie, Breite und Kosten stimmen überein. Kleine Zeichenabweichungen erzeugen keine unbeabsichtigten winzigen Lecks oder fehlenden Auslassanschlüsse.
- Damm staut und kann überströmt werden; Graben leitet um; Abriss öffnet einen Weg.
- Jede Aktion belastet das Budget genau einmal, auch nach doppelter Nachrichtenübermittlung.
- Vorschau verändert weder Budget noch Simulation.
- Unbezahlbare/ungültige Aktionen lassen den Zustand unverändert.
- Bauen und Graben erzeugen oder löschen kein Wasser.
- Abriss eines beschädigten Gebäudes führt nicht zu doppelter Wertung.
- Werkzeuge funktionieren bei laufender und pausierter Simulation sowie per Touch.

**Belege:** Regeltests, Wasserbilanztests vor/nach Eingriffen und Browserinteraktionen für alle drei Werkzeuge.

## 8. AP 6 – Vollständige Spielrunde und Abstimmung

### Umsetzung

1. Zustandsablauf Laden → Einführung → Vorbereitung → Flut → Ergebnis implementieren.
2. Unbegrenzte Vorbereitung, Pause/Fortsetzen und 1×/2× Geschwindigkeit anbieten.
3. Feste Zuflusskurve, Anfangszustand und zunächst fünf Minuten Simulationsdauer konfigurieren.
4. Ergebnis mit Flutschäden, Abrissverlusten, Gesamtschaden, Budgetrest und Zielerreichung erstellen.
5. Vollständigen Neustart einschließlich Worker-Zustand, Nachrichten und visueller Vorschauen implementieren.
6. Kosten, Werkzeugparameter, Flutkurve und Schadensziel zentral im Szenario halten.
7. Unbehandelte Referenzrunde und mindestens eine bezahlbare erfolgreiche Strategie als reproduzierbare Aktionsfolgen speichern.
8. Für jedes Werkzeug mindestens eine sinnvolle Anwendung belegen. Ein Werkzeug muss nicht zwanghaft in jeder Referenzstrategie verwendet werden.

### Abnahme

- Eine vollständige Runde ist ohne Entwicklungswerkzeuge spielbar.
- Ohne Eingriffe entstehen deutliche Schäden.
- Eine bezahlbare Strategie erreicht das Schadensziel.
- Jedes Werkzeug hat einen nachgewiesenen Nutzen.
- Das vollständige Abreißen der Stadt ist keine erfolgreiche schadensarme Lösung.
- Gleiche Aktionsfolgen liefern vergleichbare Ergebnisse.
- Neustart setzt Wasser, Gelände, Gebäude, Schäden, Budget, Zeit und Vorschauen zurück. Alte Worker-Nachrichten beeinflussen die neue Runde nicht.

**Belege:** Vergleich der Referenzrunden mit Schadenswerten, Aktionsfolgen und Szenarioversion; Integrationsprüfung einer vollständigen Runde und des Neustarts.

## 9. AP 7 – Gesamtprüfung und Übergabe

### Umsetzung

1. Automatisierte Browserprüfung von Laden, Bauvorschau, Bestätigung, Pause, Ergebnis und Neustart.
2. Desktop-Prüfung in tatsächlichem Safari, Chrome und Firefox. Playwright-WebKit nicht als Safari bezeichnen.
3. Mindestens eine vollständige Runde auf einem echten iPhone mit Safari und einem echten Android-Gerät mit Chrome prüfen.
4. Leistung bei 1× Geschwindigkeit während der gesamten Flutphase aufzeichnen; Laden, Pausen und Hintergrundphasen gesondert erfassen.
5. Drei aufeinanderfolgende Runden auf Stabilität und Speicherentwicklung prüfen.
6. Produktionsbuild lokal statisch ausliefern und überprüfen; Quellenhinweise und Datenpakete kontrollieren.
7. README, Status und Abnahmebericht auf den tatsächlichen Endstand aktualisieren.

### Messbare Abnahme

- Auf beiden mobilen Testgeräten liegt das 95. Perzentil der Framezeiten bei höchstens 33,3 ms. Das entspricht einer 30-FPS-Zielrate; nicht das 95. Perzentil von FPS als Ersatzmetrik verwenden.
- Bei 1× wird dauerhaft mindestens eine Simulationssekunde pro realer Sekunde verarbeitet, ohne wachsenden Rückstand.
- Eingriffe werden normalerweise innerhalb von 200 ms nach Bestätigung sichtbar. Dazu Bestätigungszeit und erste Darstellung des bestätigten Zustands korrelieren; Ausreißer berichten und untersuchen.
- Drei aufeinanderfolgende Runden ohne Absturz, blockierte Bedienung oder fortschreitendes Speicherproblem.
- Alle automatisierten Prüfungen bestehen auf dem letzten Änderungsstand.
- Gerät, Betriebssystem, Browser, Szenarioversion, Commit/Arbeitsstand und Messverfahren stehen im Bericht.
- Die statisch ausgelieferte Produktionsversion funktioniert einschließlich Worker und relativer Assetpfade.

**Belege:** Testberichte, Geräteprotokolle, Leistungsdaten und dokumentierte vollständige Runden. Emulatoren, responsive Ansichten und Headless-Browser sind ergänzende Belege, kein Ersatz für echte Smartphones.

## 10. Externe Voraussetzungen und Übergabe

Noch nicht verifiziert sind die konkreten Daten-Downloads, das geeignete Wiener Viertel und erreichbare echte Testgeräte. Diese Punkte werden im jeweiligen Arbeitspaket untersucht. Die Planungsrecherche allein gilt nicht als Daten- oder Geräteabnahme.

Eine fehlende externe Voraussetzung führt zu einem konkreten Status mit Ursache und nächstem Schritt, nicht zu erfundenen Belegen. Verfügbare unabhängige Arbeiten fortsetzen. Technische Probleme nicht allein wegen Aufwands als externe Blockade deklarieren.

Der Abschlussbericht nennt:

- Tatsächlich implementiertes Ergebnis und Startanleitung.
- Erfolgreiche Prüfungen mit den wichtigsten Belegen.
- Offene oder nicht prüfbare Kriterien und den nächsten notwendigen Schritt.
- Keine Behauptung vollständiger Abnahme, solange ein vereinbartes Kriterium offen bleibt.

## 11. Quellen und fachliche Grenzen

Die während der Planung recherchierten Datenquellen stehen im [Spielplan](spielplan.md#9-quellenbasis). Der Solver muss anhand seiner Tests beurteilt werden; die Nennung eines etablierten Verfahrens allein beweist weder Stabilität noch Genauigkeit.

Echte Gelände- und Gebäudedaten machen das Ergebnis nicht automatisch zu einer realistischen Hochwasserprognose. Gewässerbett, Durchlässe, Randbedingungen und Schadensregeln sind im Prototyp gezielt vereinfachte und dokumentierte Bestandteile des Spiels.
