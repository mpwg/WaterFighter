# Solver: Zwischenstand und Messung

Stand: 29. Oktober 2026. Dies ist keine vollständige Solver- oder Geräteabnahme.

`src/simulation/solver.ts` implementiert einen zweidimensionalen Finite-Volumen-Ansatz mit Rusanov-Flüssen, hydrostatischer Rekonstruktion, reflektierenden Rändern, optionalem ausströmendem Rand und bilanziertem Zufluss. Der CFL-Schritt ist auf 0,24 Zellweiten pro maximaler Wellengeschwindigkeit begrenzt. Die Höhen und Impulse werden in Float64 gehalten. Negative Tiefen unterhalb einer Rundungstoleranz lösen einen Fehler aus; eine kleinere Korrektur wird separat als Volumen erfasst. Semilimplizite Manning-Reibung und überströmbare Kronenhöhen an Zellgrenzen sind implementiert; Werkzeugänderungen und eine vorläufige Zuflusskurve sind integriert; eine vollständige hydraulische und spielerische Kalibrierung fehlt. Ein außen zugeführtes Wasservolumen wird aktuell explizit in eine Randzelle eingetragen und getrennt bilanziert; eine kalibrierte Zuflusskurve fehlt.

`npm test` prüft über zehn simulierte Minuten einen ruhenden See über unebenem Boden, einen trockenen Zustand, einen Dammbruch in einem geschlossenen synthetischen Becken und einen Kanal mit Zufluss und offenem Abfluss. Bilanzfehler: Betrag von aktuellem Volumen minus Anfangsvolumen minus kumuliertem Zufluss plus kumuliertem Abfluss minus registrierter Rundungskorrektur; Nenner ist Anfangsvolumen plus kumulierter Zufluss. Das trockene Becken wird absolut auf Null geprüft. Weitere Tests prüfen Determinismus und radiale Symmetrie sowie Impulsrichtung einer Welle. Die Schranke für die relativen Bilanztests ist 0,1 %. Ein synthetischer Barrierentest belegt Rückstau unterhalb und Fluss oberhalb einer Krone. Ein Dammöffnungsversuch prüft Symmetrie und Ausbreitung numerisch; die synthetische Darstellung wurde visuell kontrolliert.

Frühe Messung: `node tools/benchmark-solver.mjs 600`, Node.js 24.22.0 auf diesem Linux-Rechner, Szenario `1-draft`, Raster 200 × 200, 4 m Zellen, geschlossene Ränder und ohne Gebäude-/Bauwerksmodell. 600 simulierte Sekunden benötigten 6,564 s, 2.788 Subschritte, entsprechend 91,4 simulierten Sekunden pro realer Sekunde; relativer Volumenfehler 2,33 × 10⁻¹⁶. Dies misst nur den Solver im Node-Prozess, nicht Browserrendering, Worker-Kommunikation oder Smartphoneleistung. Es ist keine mobile Echtzeitabnahme.

## Worker und Ansicht

Der Worker besitzt eine pausierbare Uhr und begrenzt die Arbeit pro Tick; nicht berechnete Zeit bleibt als Rückstand erhalten. Zwei übertragbare Snapshot-Puffer begrenzen ausstehende Rasterdaten, und nach einer Pufferrückgabe wird der neueste Zustand nachgeliefert. Alte Rundenkennungen werden ignoriert. Controller-Tests prüfen Pause, Geschwindigkeitswechsel, Rückstand, Puffer und Neustart. Der Worker validiert Vorschau und Aktionen, führt sie auch in Pause aus und verwendet eine vorläufige Zuflusskurve.

Die Vorschau zeigt Terrain, Gebäude und Wasser auf Grundlage des Szenarioentwurfs. Eine emulierte Playwright-Chromium-Querformatansicht prüft, dass die vorhandenen Bedienelemente mindestens 44 CSS-Pixel groß und nicht überdeckt sind; sie ersetzt keine Prüfung auf einem echten Smartphone. Strömungsmarker werden aus den Impulsen animiert; Wassertiefe und Gebäudeschäden lassen sich im Kartenmodus abfragen. Die Darstellung und ihre Leistung auf echten Geräten bleiben zu prüfen.

## Vorläufige Referenzrunde

`npx tsx tools/reference-round.ts` auf Node.js 24.22.0, Szenario `1-draft`, ohne Maßnahmen: 300 simulierte Sekunden, 4.512 Subschritte, 14,05 s Rechenzeit; Anfangsvolumen 499.584 m³, Zufluss 2.280.000 m³, Abfluss 1.630.644,79 m³, Endvolumen 1.148.939,21 m³, relativer Bilanzfehler 3,37 × 10⁻¹⁴. Spielschaden 324.070,77; Budgetrest 10.000. Maximale beobachtete Höhe 18,65 m Wiener Null und Gebäuderandtiefe 1,92 m. Dies sind Spielparameter und keine realen Hochwasserwerte. Die Runde belegt noch keine erfolgreiche Strategie oder die Eignung dieser Zuflusskurve.

## Vergleichsstrategie

`npx tsx tools/reference-round.ts 1 bank` verwendet die elf vorbereitbaren Dammabschnitte in `tests/fixtures/strategy.json` auf Szenario `1.1-draft`. Dieselbe Wegerzeugung wird von der Oberfläche verwendet. Die Abschnitte ergeben 185 Zellkanten und kosten 7.400 von 10.000 Budgeteinheiten; Dammhöhe 4 m über der jeweils höheren angrenzenden Sohle. Im Rechenlauf über 300 Sekunden lag der Flut- und Gesamtschaden bei 0, Budgetrest 2.600, Bilanzfehler 1,19 × 10⁻¹³. Ohne Maßnahmen betrug der Schaden 324.070,77. Das vorläufige Ziel liegt bei höchstens 50.000.

Die Aktionsliste ist eine reproduzierbare numerische Referenz, noch kein Nachweis, dass ein Mensch sie in der Oberfläche vollständig und präzise platzieren kann. Synthetische Tests zeigen, dass ein Graben eine Bodenschwelle umleitet und ein Gebäudeabriss einen versperrten Wasserweg öffnet; beides erhält die Wasserbilanz. Der Nutzen beider Werkzeuge im konkreten Wiener Szenario, die Validierung des Schadensmodells und die mobile Leistung bleiben offen.

## Vollständige Browserrunde, vorheriger Build

Am 29. Oktober 2026 wurde der Produktionsbuild von Commit `24c11cd` lokal ausgeliefert und mit `tools/observe-browser-round.mjs` in Playwright-Chromium (Headless, Software-WebGL) ohne Maßnahmen bei 2× ausgeführt. Ergebnis nach 150,992 realen Sekunden: Simulationszeit 05:00, Flutschaden 324.051, Ziel verfehlt, Budget 10.000; keine `pageerror`-Ereignisse. Das Werkzeug erfasste 1.359 Frameabstände und ein 95. Perzentil von 183,3 ms. Während des Laufs wurden weitere Browser- und Testprozesse ausgeführt; die Zahl ist daher ein belasteter Headless-Messwert, keine Hardware- oder Smartphoneabnahme. Die etwas andere Rundung als im Node-Lauf ergibt sich aus unterschiedlichen zeitlichen Schritten. Seit diesem Build wurden Quellcodeänderungen vorgenommen; der vollständige Lauf muss auf dem endgültigen Stand wiederholt werden.

Bei lokaler Prüfung waren weder `adb` noch `idevice_id`, Chrome, Firefox oder `xcrun` im Pfad; die sichtbaren USB-Geräte umfassen ein QEMU-Tablet und USB-Controller. Damit wurden hier keine echten iPhone- oder Android-Geräte und kein tatsächliches Safari festgestellt. Ein entfernter Gerätezugang wurde damit nicht ausgeschlossen.

Die Referenzrunden wurden nach Aufnahme der Bruchkantengeometrien mit Szenario `1.1-draft` wiederholt; da diese noch nicht hydraulisch angewandt werden, blieben die Schadenswerte und die Strategiewirkung unverändert.

## Szenario 1.2 und Browserstrategie

`tools/observe-strategy-browser.mjs` platzierte die elf Referenzabschnitte im Vite-Entwicklungsbuild von Commit `32a839c` über Kartenklicks, Vorschauen und Bestätigungen. Eine testseitige Modul-Erweiterung projizierte die bekannten Gitterkoordinaten auf Bildschirmkoordinaten; das ist ein automatisierter Präzisionstest und kein Nachweis menschlicher Bedienung auf einem Smartphone. Die vollständige anschließende 2×-Runde endete nach 151,06 s mit 0 Schaden und 2.600 Budgetrest, ohne Seitenfehler.

Nach Aufnahme der aus Bruchlinien abgeleiteten 291 Zellkanten wurden die Referenzrunden mit Version `1.2-draft` erneut numerisch berechnet: ohne Maßnahmen Schaden 322.771,10; mit der Strategie 0 und 2.600 Budgetrest. Die relativen Bilanzfehler lagen bei 5,95 × 10⁻¹⁵ beziehungsweise 9,84 × 10⁻¹⁴. Die Browserstrategie wurde auf Version 1.2 im Vite-Entwicklungsbuild von Commit `73b41e8` wiederholt: elf bestätigte Abschnitte, 2.600 Budgetrest, vollständige 2×-Runde in 151,113 s, 0 Gesamtschaden und keine Seitenfehler. Der Test nutzt testseitig projizierte Koordinaten; ein Mensch- oder Gerätetest bleibt offen. Die Bruchlinien-Rasterung ist eine dokumentierte Näherung, keine geprüfte Information über Durchlässe.

## Weitere Desktop-Browser

Der von Google bezogene Linux-Chrome 156.0.8078.73 wurde temporär unter `/tmp` entpackt. Die sechs Playwright-Abläufe bestanden gegen den lokalen Produktionsbuild von `73b41e8`, darunter Werkzeugvorschau und eine verkürzte Runde. Dies ist ein Headless-Linux-Test mit Softwaregrafik und keine vollständige manuelle Desktop-Abnahme.

Der offizielle Mozilla Firefox 159.0 wurde temporär unter `/tmp` mit geckodriver 0.37.1 gestartet. Der Produktionsbuild zeigte kontrolliert „WebGL not supported“ und hielt den Startknopf deaktiviert, weil Firefox in dieser headless Linux-Umgebung keinen WebGL-Kontext erzeugen konnte. Die eigentlichen Spielabläufe sind damit in Firefox **nicht geprüft**. Der nächste Schritt ist ein Firefox-Lauf auf einem Desktop mit funktionierendem WebGL2. Die lokale Chrome-Testauswahl ist über `WATERFIGHTER_CHROME` in `playwright.config.ts` möglich; `tools/observe-firefox.mjs` dokumentiert den Firefox-Testversuch.

## Werkzeugvergleiche im Wiener Szenario

`npx tsx tools/compare-intervention.ts trench 80 10 80` legt vor Flutbeginn einen zusammenhängenden Graben von Zelle (80,10) bis (80,80) an. Im numerischen Lauf mit Version `1.2-draft` kostet das 1.775 Budgeteinheiten; der Gesamtschaden beträgt 321.793,34 gegenüber 322.771,10 ohne Maßnahme. `npx tsx tools/compare-intervention.ts demolish w105310525-0` entfernt ein Gebäude vor Flutbeginn, kostet 1.111 und ergibt 308.366,77 Flutschaden plus 11.106 Abrissverlust, insgesamt 319.472,77. Die relativen Wasserbilanzfehler betragen 7,08 × 10⁻¹⁴ beziehungsweise 5,53 × 10⁻¹⁵. Die Verbesserung ist in beiden Fällen klein und erreicht das Ziel allein nicht. Andere geprüfte Platzierungen verschlechterten das Ergebnis; dies ist eine Spielmodell- und keine reale Schutzempfehlung.

Der offizielle Firefox 159.0 wurde anschließend auf einem temporären virtuellen X-Desktop mit Mesa-Softwaregrafik und geckodriver 0.37.1 geprüft. Laden, Start, Pause, Neustart und Vorschau/Bestätigung aller drei Werkzeuge funktionierten. Eine vollständige ungeschützte 2×-Runde des Produktionsbuilds endete nach 151,06 s mit 322.753 Schaden. Es handelt sich um automatisierte Tests auf einem virtuellen Linux-Desktop, nicht um eine manuelle Abnahme oder einen Gerätetest.

Ein erster Versuch mit drei aufeinanderfolgenden Chrome-Runden erreichte zwei Ergebnisse; während parallel weitere Tests und Simulationen liefen, wurde die Browserseite in der dritten Runde geschlossen. Die Ursache ist nicht festgestellt. Dieser Versuch belegt die Stabilitätsanforderung nicht und wird isoliert wiederholt.

Für hochauflösende Darstellungen korrigiert `World.pick` die Zeigerkoordinaten so, dass Babylon seine Hardware-Skalierung nur einmal anwendet. Ein Vitest und `node tools/verify-highdpi-picking.mjs` (Vite-Entwicklungsserver, Playwright-Chromium, auf 0,5 gesetzte Hardware-Skalierung) prüfen eine Dammvorschau mit erwarteten 20 Zellkanten. Dies ist keine Abnahme eines realen Smartphones.

Für `1.2-draft` betragen die Gebäudewerte insgesamt 1.058.683 und die Summe der einzelnen Abrisskosten 105.914. Damit überschreitet der vollständige Abriss sowohl das Schadensziel von 50.000 als auch das Budget von 10.000. Die Werte werden im Vitest anhand des ausgelieferten Szenarios geprüft.

## Sichtkontrolle der Dammöffnung

Die [Diagnosegrafik](dam-opening-test.png) zeigt ein synthetisches 30 × 21-Zellen-Becken mit 4 m Zellweite, geschlossenen Rändern und einer ein Zelle breiten Öffnung. Links stehen anfangs 2 m Wasser, rechts ist das Becken trocken. Die vier Momentaufnahmen nach 0, 2, 4 und 6 Sekunden zeigen eine nach rechts gerichtete, annähernd symmetrische Welle; Pfeile zeigen die lokale Fließrichtung. Das ist ein Solver-Testfeld, kein Wiener Szenario. Die relative Volumenabweichung betrug höchstens 3,61 × 10⁻¹⁶, bei 32 Subschritten bis 6 s.

Reproduktion mit Node und Python mit `tools/requirements-plot.txt`: `npx tsx tools/dam-opening-field.ts` schreibt die numerischen Felder nach `/tmp/waterfighter-dam-opening.json`; `python tools/plot-dam-opening.py` erzeugt die Grafik. Die Bildprüfung allein belegt keine wissenschaftliche Genauigkeit und ersetzt die numerischen Stabilitäts- und Bilanztests nicht.

## Zehn Minuten auf dem Szenarioentwurf

`npx tsx tools/check-scenario-balance.ts` berechnete mit Version `1.2-draft` das vorbereitete Wiener Raster einschließlich Gebäuden, approximierten Geländekanten und bilanziertem Zu- und Abfluss 600 simulierte Sekunden. Nach dem regulären Rundenende bei 300 s wird in diesem ausschließlich numerischen Test weitergerechnet; die Zuflusskurve bleibt bei null. Ergebnis: Anfangsvolumen 499.584 m³, Zufluss 2.280.000 m³, Abfluss 2.378.001,21 m³, Endvolumen 401.582,79 m³; relativer Fehler bezogen auf Anfangsvolumen plus Zufluss 1,74 × 10⁻¹⁴. Die Rundungskorrektur betrug 0, die minimale Tiefe 0 und die maximale 18,65 m. Alle Tiefen und Impulse blieben endlich; 7.484 Subschritte benötigten 25,98 s auf dem Linux-Rechner bei gleichzeitiger Browserlast.

Die hohe maximale Tiefe tritt im vorläufigen, spielerisch verstärkten Ereignis auf und ist keine reale Hochwasseraussage. `npx tsx tools/inspect-inflow.ts` lokalisiert den Höchstwert 18,65 m bei t ≈ 140,7 s in einer Zuflusszelle am oberen Rand; der höchste Wert mit mindestens fünf Zellen Randabstand beträgt 10,72 m. Die experimentelle Variante `npx tsx tools/inspect-inflow.ts --wide` verteilt denselben Zufluss auf 90 statt 40 Randzellen. Sie ergibt 14,80 m am Rand, 11,66 m im Inneren und 347.150 Schaden statt 322.771. Beide Varianten bleiben endlich und bilanzieren das Wasser; der Vergleich zeigt eine deutliche Abhängigkeit von der künstlichen Randbedingung. Die experimentelle Variante wurde nicht ins Spiel übernommen. Eine realistische Kalibrierung ist nicht behauptet; die Interpretation der hohen Werte bleibt vor vollständiger Szenarioabnahme offen.
