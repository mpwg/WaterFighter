# WaterFighter – kopierfertiger Goal-Auftrag

Stand: 29. Oktober 2026.

Der folgende Text ist für einen später gestarteten Implementierungs-Goal vorgesehen. Die Erstellung dieses Dokuments startet selbst kein Goal. Modell und Tokenbudget werden beim Start vom Nutzer gewählt; sie sind hier nicht vorgegeben.

## Auftrag zum Kopieren

```text
Implementiere im Repository /Users/mat/code/WaterFighter den vereinbarten spielbaren WaterFighter-Web-Prototyp vollständig.

Lies zuerst die geltenden Repository-Anweisungen sowie docs/spielplan.md, docs/umsetzungsplan.md und docs/status.md. Diese Dateien enthalten das verbindliche Produktziel, die Arbeitspakete AP 1–7 und die Abnahmekriterien. Die Dokumentation ist bereits angelegt; die Spielimplementierung ist noch offen. Erhalte den historischen Enginevergleich in docs/archiv/enginevergleich-3d.md. Ersetze die aktuelle Web-Architektur nicht durch dessen früheren nativen Ansatz.

Baue mit TypeScript, Vite und Babylon.js eine stilisierte 2,5D-Spielwelt aus einem vorbereiteten realen Wiener Viertel an der Donau mit ungefähr 500–1.000 Metern Seitenlänge. Verwende OpenStreetMap-Geometrien und echte Wiener Geländehöhen. Wähle den konkreten Ausschnitt nach den Kriterien in AP 2. Bereite Geodaten mit Python und GDAL reproduzierbar vor; dokumentiere Quellen, Prüfsummen, Lizenzen, Höhenbezug und spielerische Anpassungen. Große Rohdaten bleiben außerhalb von Git. Zur Laufzeit werden ausschließlich vorbereitete Szenariodaten geladen.

Implementiere eine konservative zweidimensionale Flachwassersimulation in einem Web Worker. Ausgangspunkt sind Rusanov-Flüsse, hydrostatische Rekonstruktion, Positivitätsschutz und CFL-gesteuerte Zeitschritte. Liefere sichtbare Flutwelle, Strömung, Rückstau und Überströmung. WebGL2 ist die Grafikgrundlage; WebGPU, SharedArrayBuffer und ein Laufzeit-Backend dürfen keine Voraussetzung sein.

Implementiere die drei Werkzeuge Dämme bauen, Gräben ausheben und Gebäude abreißen. Ergänze verbindliche Aktionsvalidierung, Vorschau, Bestätigung, begrenztes Budget, Gebäudeschäden, unbegrenzte Vorbereitung, pausierbare Echtzeit, 1×/2× Geschwindigkeit, Einführung, Ergebnis und vollständigen Neustart. Der Worker verwaltet den maßgeblichen Zustand. Aktionen dürfen weder doppelte Kosten noch Wasserverluste erzeugen; verspätete Nachrichten dürfen eine neu gestartete Runde nicht verändern. Abrissverluste werden nicht zusätzlich zu bereits verbuchten Flutschäden desselben Gebäudes gezählt.

Arbeite AP 1 bis AP 7 in der beschriebenen Reihenfolge ab. Prüfe den Solver und seine Leistung früh, bevor du die vollständige Oberfläche ausarbeitest. Triff Routineentscheidungen innerhalb dieses Plans selbstständig. Frage nur bei wesentlichen Änderungen des Produktziels nach, insbesondere bei Entfernung einer Zielplattform, Fantasiegeografie statt realer Daten, einem Pegelmodell statt Flutwellensimulation oder notwendigen kostenpflichtigen Diensten beziehungsweise einem Backend.

Erhalte fremde Änderungen, verwende deutsche Umlaute und halte docs/status.md sowie die README nach jedem Arbeitspaket aktuell. Unterscheide offen, in Arbeit, implementiert, geprüft und blockiert. Dokumentiere tatsächliche Befehle, Ergebnisse und Grenzen. Arbeite bei fehlenden externen Voraussetzungen an unabhängigen Teilen weiter. Erfinde keine Daten, Prüfungen oder Geräteabnahmen und deklariere anspruchsvolle Implementierungsarbeit nicht allein wegen ihres Aufwands als externe Blockade.

Liefere eine statisch auslieferbare Anwendung mit vollständiger Maus- und Touch-Bedienung in Hoch- und Querformat. Führe die definierten Simulations-, Spielregel-, Integrations- und Browserprüfungen durch. Prüfe tatsächliches Safari, Chrome und Firefox auf Desktop sowie mindestens ein echtes iPhone mit Safari und ein echtes Android-Gerät mit Chrome, sofern erreichbar. Playwright-WebKit ist kein Nachweis für tatsächliches Safari; Emulation ersetzt kein echtes Smartphone.

Belege insbesondere: Wasserbilanzfehler unter 0,1 % über zehn simulierte Minuten in den definierten Testfällen; stabile trockene und ruhende Zustände; nachvollziehbare Wirkung aller drei Werkzeuge; eine vollständige Runde; eine bezahlbare Strategie, die das Schadensziel erreicht; korrekten Neustart; drei stabile aufeinanderfolgende Runden. Messe auf beiden mobilen Testgeräten die Framezeiten während einer vollständigen Runde bei 1× (95. Perzentil höchstens 33,3 ms), Echtzeitfähigkeit der Simulation ohne wachsenden Rückstand sowie die Zeit von Aktionsbestätigung bis zur Darstellung (normalerweise höchstens 200 ms). Nenne Gerät, Betriebssystem, Browser, Szenarioversion und Messverfahren.

Nimm keine öffentliche Veröffentlichung ohne autorisiertes Hostingziel vor. Erstelle keine zusätzlichen Produktfunktionen außerhalb des vereinbarten Prototyps. Freie Ortswahl, Multiplayer, Kanalisation, Erosion, automatische Dammbrüche, Gebäudeeinstürze und wissenschaftliche Gefahrenbewertung gehören nicht zum Auftrag.

Das Implementierungsziel ist erreicht, wenn eine vollständige Spielrunde auf dem realen Wiener Szenario funktioniert, alle drei Werkzeuge sinnvoll nutzbar sind, eine bezahlbare Strategie das Schadensziel erreicht, die technischen Prüfungen bestanden sind und die Dokumentation dem tatsächlichen Stand entspricht. Vollständige Abnahme darfst du nur behaupten, wenn alle vereinbarten Abnahmekriterien belegt sind. Falls echte Geräte oder andere externe Voraussetzungen fehlen, benenne die fehlenden Kriterien und den nächsten konkreten Schritt; kennzeichne die Abnahme als unvollständig.

Berichte zum Abschluss über Ergebnis, funktionierende Startanleitung, wichtigste Testnachweise und verbleibende Einschränkungen. Verwende die Kriterienmatrix in docs/status.md als Grundlage.
```
