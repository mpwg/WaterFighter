# Solver: Zwischenstand und Messung

Stand: 29. Oktober 2026. Dies ist keine vollständige Solver- oder Geräteabnahme.

`src/simulation/solver.ts` implementiert einen zweidimensionalen Finite-Volumen-Ansatz mit Rusanov-Flüssen, hydrostatischer Rekonstruktion, reflektierenden Rändern, optionalem ausströmendem Rand und bilanziertem Zufluss. Der CFL-Schritt ist auf 0,24 Zellweiten pro maximaler Wellengeschwindigkeit begrenzt. Die Höhen und Impulse werden in Float64 gehalten. Negative Tiefen unterhalb einer Rundungstoleranz lösen einen Fehler aus; eine kleinere Korrektur wird separat als Volumen erfasst. Semilimplizite Manning-Reibung und überströmbare Kronenhöhen an Zellgrenzen sind implementiert; Werkzeugänderungen und eine vorläufige Zuflusskurve sind integriert; eine vollständige hydraulische und spielerische Kalibrierung fehlt. Ein außen zugeführtes Wasservolumen wird aktuell explizit in eine Randzelle eingetragen und getrennt bilanziert; eine kalibrierte Zuflusskurve fehlt.

`npm test` prüft über zehn simulierte Minuten einen ruhenden See über unebenem Boden, einen trockenen Zustand, einen Dammbruch in einem geschlossenen synthetischen Becken und einen Kanal mit Zufluss und offenem Abfluss. Bilanzfehler: Betrag von aktuellem Volumen minus Anfangsvolumen minus kumuliertem Zufluss plus kumuliertem Abfluss minus registrierter Rundungskorrektur; Nenner ist Anfangsvolumen plus kumulierter Zufluss. Das trockene Becken wird absolut auf Null geprüft. Weitere Tests prüfen Determinismus und radiale Symmetrie sowie Impulsrichtung einer Welle. Die Schranke für die relativen Bilanztests ist 0,1 %. Die Welle wurde noch nicht visuell kontrolliert; ein synthetischer Barrierentest belegt Rückstau unterhalb und Fluss oberhalb einer Krone. Ein Dammöffnungsversuch mit Engstelle fehlt.

Frühe Messung: `node tools/benchmark-solver.mjs 600`, Node.js 24.22.0 auf diesem Linux-Rechner, Szenario `1-draft`, Raster 200 × 200, 4 m Zellen, geschlossene Ränder und ohne Gebäude-/Bauwerksmodell. 600 simulierte Sekunden benötigten 6,564 s, 2.788 Subschritte, entsprechend 91,4 simulierten Sekunden pro realer Sekunde; relativer Volumenfehler 2,33 × 10⁻¹⁶. Dies misst nur den Solver im Node-Prozess, nicht Browserrendering, Worker-Kommunikation oder Smartphoneleistung. Es ist keine mobile Echtzeitabnahme.

## Worker und Ansicht

Der Worker besitzt eine pausierbare Uhr und begrenzt die Arbeit pro Tick; nicht berechnete Zeit bleibt als Rückstand erhalten. Zwei übertragbare Snapshot-Puffer begrenzen ausstehende Rasterdaten, und nach einer Pufferrückgabe wird der neueste Zustand nachgeliefert. Alte Rundenkennungen werden ignoriert. Controller-Tests prüfen Pause, Geschwindigkeitswechsel, Rückstand, Puffer und Neustart. Der Worker validiert Vorschau und Aktionen, führt sie auch in Pause aus und verwendet eine vorläufige Zuflusskurve.

Die Vorschau zeigt Terrain, Gebäude und Wasser auf Grundlage des Szenarioentwurfs. Eine emulierte Playwright-Chromium-Querformatansicht prüft, dass die vorhandenen Bedienelemente mindestens 44 CSS-Pixel groß und nicht überdeckt sind; sie ersetzt keine Prüfung auf einem echten Smartphone. Eine Oberflächenanimation, Gebäudeschäden und Bauwerkzeuge fehlen.

## Vorläufige Referenzrunde

`npx tsx tools/reference-round.ts` auf Node.js 24.22.0, Szenario `1-draft`, ohne Maßnahmen: 300 simulierte Sekunden, 4.512 Subschritte, 14,05 s Rechenzeit; Anfangsvolumen 499.584 m³, Zufluss 2.280.000 m³, Abfluss 1.630.644,79 m³, Endvolumen 1.148.939,21 m³, relativer Bilanzfehler 3,37 × 10⁻¹⁴. Spielschaden 324.070,77; Budgetrest 10.000. Maximale beobachtete Höhe 18,65 m Wiener Null und Gebäuderandtiefe 1,92 m. Dies sind Spielparameter und keine realen Hochwasserwerte. Die Runde belegt noch keine erfolgreiche Strategie oder die Eignung dieser Zuflusskurve.

## Vergleichsstrategie

`npx tsx tools/reference-round.ts 1 bank` verwendet die elf vorbereitbaren Dammabschnitte in `tests/fixtures/strategy.json` auf Szenario `1-draft`. Dieselbe Wegerzeugung wird von der Oberfläche verwendet. Die Abschnitte ergeben 185 Zellkanten und kosten 7.400 von 10.000 Budgeteinheiten; Dammhöhe 4 m über der jeweils höheren angrenzenden Sohle. Im Rechenlauf über 300 Sekunden lag der Flut- und Gesamtschaden bei 0, Budgetrest 2.600, Bilanzfehler 1,19 × 10⁻¹³. Ohne Maßnahmen betrug der Schaden 324.070,77. Das vorläufige Ziel liegt bei höchstens 50.000.

Die Aktionsliste ist eine reproduzierbare numerische Referenz, noch kein Nachweis, dass ein Mensch sie in der Oberfläche vollständig und präzise platzieren kann. Die sinnvolle Wirkung von Graben und Abriss, vollständige Runden im Browser, eine Validierung des Schadensmodells und die mobile Leistung bleiben offen.
