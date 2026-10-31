# WaterFighter · Wien geht unter

Ein 90-Sekunden-Spiel auf einer amtlichen Karte rund um Vorgartenstraße/Ennsgasse in der Leopoldstadt. Setze Straßenbarrieren oder öffne durch bestätigten Gebäudeabriss einen Weg für das Wasser. Bewahre möglichst viele der 100.000 Punkte. Dammbruch, Wasserverlauf, Gebäudewerte und Viertelrollen sind Spielfiktion; das Spiel ist keine Hochwasserprognose.

Voraussetzung: Bun 1.4.4 und ein aktueller Browser mit Canvas2D und Web Workers. Alle Karten- und Schriftdateien werden lokal geladen; WebGPU ist nicht erforderlich.

```sh
bun install --frozen-lockfile
bun run dev
bun run test
bun run typecheck
bun run build
bun run test:browser
bun tools/v4-compare.ts
```

`dev` gibt die lokale URL aus. Die Browserprüfung baut das Spiel und startet den Produktionsserver exklusiv auf Port 4187. `WATERFIGHTER_CHROME` kann eine installierte Chrome-Datei auswählen. Der Test enthält eine vollständige echte 90-Sekunden-Runde und dauert insgesamt etwa zwei Minuten. Das Spiel benötigt eine Bereitstellung im URL-Wurzelpfad, da Karte und Schriften über `/v4/…` geladen werden.

Die Karte bleibt vollständig sichtbar. **Runde starten** beginnt die Uhr. **Barriere** (1): über eine Straßenquerung fahren, exakte Linie prüfen und klicken; ein weiterer Klick entfernt sie ohne Erstattung. Drei Ladungen, alle 15 Spielsekunden eine neue, maximal drei. Barrieren haben endliche Höhe und können überströmt werden. **Abriss** (2): Gebäude anklicken, den angezeigten Punktverlust prüfen und separat bestätigen. Zwei Ladungen, eine neue bei 45 Sekunden, maximal zwei. Jeder Abriss kostet den verbleibenden Gebäudewert plus 250 Punkte; derselbe Abriss kann nicht wiederholt werden. Escape verwirft die Auswahl.

**Pause** hält Uhr, Nachschub und Aktionen an; **Fortsetzen** setzt manuell fort. Leertaste auf dem Seitenhintergrund schaltet Pause um. Ein versteckter Tab pausiert; sichtbar werden startet die Runde nicht automatisch. **Neu starten** setzt Zeit, Schaden, Eingriffe und Vorrat zurück und wartet auf einen neuen Start. Nach 90 Sekunden zeigt die Bilanz Flut- und Abrissschaden getrennt; auch negative Punkte sind möglich. **Ton an/aus** schaltet die kurzen Eingriffssignale.

Der frische V4-Code liegt ausschließlich unter `src/v4/`: Canvas2D-Oberfläche, isolierter Simulationsworker und deterministischer Kern. `?test=1` bietet eine explizite Testbrücke und friert die autonome Uhr ein; die normale URL besitzt diese Brücke nicht. Die frühere Tulln-/WebGPU-Laufzeit wurde entfernt; ältere Dokumente, Bilder und Messdaten sind historische Artefakte.

[Datengrundlage, Quellen und Spielfiktion](docs/v4-data.md), [aktueller Prüfstand und offene Abnahme](docs/status.md), [V4-Strategievergleich](docs/v4-strategy-evidence.json), [echte 90-Sekunden-Browsermessung](docs/v4-browser-evidence.json). Automatisierte Prüfungen ersetzen keine menschliche Spielspaßbewertung, echten Geräte oder fachliche Hochwasservalidierung.
