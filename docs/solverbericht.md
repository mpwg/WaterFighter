# Solver: Zwischenstand und Messung

Stand: 29. Oktober 2026. Dies ist keine vollständige Solver- oder Geräteabnahme.

**Geltung älterer Dammvergleiche:** Seit der direkten Rasterführung für schräge Dämme ändert `damPath` die Aktionsgeometrie. Die folgenden dammbasierten Referenzzahlen, Zeitvergleiche und Ansichten stammen, soweit nicht ausdrücklich anders bezeichnet, aus dem früheren Code `b526c29` oder davor und sind mit dem aktuellen Pfad nicht unverändert reproduzierbar. Die aktuellen Strategien und Kontrollläufe stehen im [Gebäudevergleich](review-gebaeudevergleich.md#aktueller-vergleich-mit-direkter-dammführung). Solverfälle ohne Dämme sind dadurch nicht geändert.

`src/simulation/solver.ts` implementiert einen zweidimensionalen Finite-Volumen-Ansatz mit Rusanov-Flüssen, hydrostatischer Rekonstruktion, reflektierenden Rändern, optionalem ausströmendem Rand und bilanziertem Zufluss. Der CFL-Schritt ist auf 0,24 Zellweiten pro maximaler Wellengeschwindigkeit begrenzt. Die Höhen und Impulse werden in Float64 gehalten. Negative Tiefen unterhalb einer Rundungstoleranz lösen einen Fehler aus; eine kleinere Korrektur wird separat als Volumen erfasst. Semilimplizite Manning-Reibung und überströmbare Kronenhöhen an Zellgrenzen sind implementiert; Werkzeugänderungen und eine vorläufige Zuflusskurve sind integriert; eine vollständige hydraulische und spielerische Kalibrierung fehlt. Ein außen zugeführtes Wasservolumen wird aktuell explizit in eine Randzelle eingetragen und getrennt bilanziert; eine kalibrierte Zuflusskurve fehlt.

`npm test` prüft über zehn simulierte Minuten einen ruhenden See über unebenem Boden, einen trockenen Zustand, einen Dammbruch in einem geschlossenen synthetischen Becken und einen Kanal mit Zufluss und offenem Abfluss. Bilanzfehler: Betrag von aktuellem Volumen minus Anfangsvolumen minus kumuliertem Zufluss plus kumuliertem Abfluss minus registrierter Rundungskorrektur; Nenner ist Anfangsvolumen plus kumulierter Zufluss. Das trockene Becken wird absolut auf Null geprüft. Weitere Tests prüfen Determinismus und radiale Symmetrie sowie Impulsrichtung einer Welle. Die Schranke für die relativen Bilanztests ist 0,1 %. Ein synthetischer Barrierentest belegt Rückstau unterhalb und Fluss oberhalb einer Krone. Ein Dammöffnungsversuch prüft Symmetrie und Ausbreitung numerisch; die synthetische Darstellung wurde visuell kontrolliert.

Frühe Messung: `node tools/benchmark-solver.mjs 600`, Node.js 24.22.0 auf diesem Linux-Rechner, Szenario `1-draft`, Raster 200 × 200, 4 m Zellen, geschlossene Ränder und ohne Gebäude-/Bauwerksmodell. 600 simulierte Sekunden benötigten 6,564 s, 2.788 Subschritte, entsprechend 91,4 simulierten Sekunden pro realer Sekunde; relativer Volumenfehler 2,33 × 10⁻¹⁶. Dies misst nur den Solver im Node-Prozess, nicht Browserrendering, Worker-Kommunikation oder Smartphoneleistung. Es ist keine mobile Echtzeitabnahme.

## Zehn Minuten mit mehreren Eingriffen

`bun tools/check-intervention-balance.ts` wurde am 29. Oktober 2026 auf einem isolierten Archiv von `42da208` mit Szenario `1.4-draft` ausgeführt. Drei Referenzdämme wurden vor Beginn gesetzt; bei exakt 150 simulierten Sekunden folgten ein Landgraben, ein daran angeschlossener diagonaler Graben und der Abriss von `w316294474-0`. Sechs Zellen der zweiten Grabenaktion waren bereits ausgehoben; sie wurden nicht erneut berechnet. Jede Aktionskennung wurde unmittelbar wiederholt und veränderte weder Budget noch Wasservolumen ein zweites Mal. Nach Abriss wurde geprüft, dass der volle Gebäudewert den zuvor angesammelten Gebäudeschaden ersetzt, statt ihn zusätzlich zu zählen.

Alle sechs bestätigten Aktionen erhielten das Wasservolumen unmittelbar; bei den drei Eingriffen nach Flutbeginn betrug es vor und nach jeder Aktion 1.277.734,14 m³. Nach 600 simulierten Sekunden und 6.508 Schritten ergab sich ein relativer Bilanzfehler von 1,67 × 10⁻¹³, bezogen auf Anfangsvolumen plus Zufluss; die Tiefe blieb endlich und nicht negativ, das Maximum betrug 13,20 m. Der Restbetrag nach den Aktionen war 5.379. Das Skript bricht bei Bilanzfehler ab 0,1 %, negativer oder nicht endlicher Tiefe, abweichender Vorschau, doppelter Belastung oder Volumenänderung durch eine Aktion ab.

Die reguläre Spielrunde endet nach 300 s; die Verlängerung auf 600 s dient hier ausschließlich der numerischen Stabilitätsprüfung. Die Eingriffe erfolgen idealisiert unmittelbar zum Zeitpunkt 150 s. Der Test beweist weder reale hydraulische Plausibilität noch menschliche Bedienbarkeit oder Leistung auf Mobilgeräten.

## Überströmung und Rückstau mit direkter Dammführung

Auf Szenario `1.4-draft` wurden die zwei Referenzdämme nach der Umstellung auf direkte Rasterführung mit `bun tools/inspect-dam-overtopping.ts` und `bun tools/compare-dam-backwater.ts` erneut über 300 s untersucht. Von 30 Dammkanten werden zwei überströmt; die erste Überschreitung beginnt bei etwa 120,0 s. An Kante `x:26` beträgt die größte berechnete Überstauhöhe 1,03 m bei etwa 150,9 s. Der aufsummierte gerichtete Modellfluss über alle Dammkanten beträgt in einer Richtung 723,06 m³; dies ist eine numerische Flussbilanz und keine Verfolgung einzelner Wasserteilchen. Der relative Bilanzfehler beträgt 2,02 × 10⁻¹³.

Bei 120 s beträgt der Unterschied von Gelände plus Wassertiefe an derselben Kante mit Damm 4,18 m; auf der niedrigeren Seite ist die Zelle trocken. Ohne Damm sind beide Seiten nass und die Wasserstände unterscheiden sich um 0,08 m in Gegenrichtung. Bei 150 s sind beide Seiten auch mit Damm nass: Ihre Wasserstände unterscheiden sich um 1,89 m, ohne Damm um 0,12 m in Gegenrichtung. An der bei 150 s größten beidseitig nassen Kontrastkante `x:428` beträgt die Differenz mit Damm 2,19 m und ohne Damm 0,10 m. Das Diagnoseprogramm gibt Wassertiefen und `bothWet` aus und führt `wetPeak` getrennt vom allgemeinen Maximum auf. Die Größen zeigen die lokale Barrierewirkung im Modell. Der Vergleich tastet feste Zeitpunkte ab und verwendet dafür angepasste letzte Zeitschritte; seine Endschadenswerte weichen deshalb geringfügig von der Referenzberechnung ab. Er belegt keine reale Wirksamkeit oder durchgehend erkennbare Darstellung auf Geräten.

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

`npx tsx tools/probe-waterways.ts baseline`, `trench` und `demolish` ergänzen diesen Vergleich um lokale Strömungsindikatoren. Am Mittelpunkt des Grabens, Zelle (80,45), steigt die zeitintegrierte Größe aus dem Betrag des zentrierten y-Impulses mal Zellbreite von 36.959 auf 41.219 m³. Auf den 71 Zellen des abgerissenen Gebäudes beträgt die entsprechende aufsummierte Bewegungsgröße vorher 0 und nachher 2.320; dort erreicht die Geschwindigkeit höchstens 2,53 m/s. Das zeigt Bewegung an den untersuchten Stellen, ist aber kein Fluss über numerische Zellkanten und kein Nachweis zweier vollständig bilanzierter alternativer Abflusswege. Die relativen Bilanzfehler der drei Läufe liegen unter 7,1 × 10⁻¹⁴.

## Schrittweitenvergleich der Spielrunde

Vor dem Vergleich wurden folgende Prüfschranken festgelegt: Der Schaden der unbehandelten Runde und das Endvolumen dürfen sich zwischen maximal 1 s und maximal 0,05 s Schrittweite jeweils um höchstens 1 % bezogen auf den 1-s-Lauf unterscheiden. Bei der Dammstrategie muss in beiden Läufen das Schadensziel erreicht und das Budget eingehalten werden. Der relative Bilanzfehler muss in jedem Lauf unter 0,1 % liegen. Dies ist ein Empfindlichkeitstest für diese zwei Schrittweiten, kein allgemeiner Konvergenz- oder Genauigkeitsbeweis.

Am 29. Oktober 2026 wurden mit `npx tsx tools/compare-timesteps.ts 1 baseline`, `0.05 baseline`, `1 bank` und `0.05 bank` vier Runden des Szenarios `1.2-draft` unter Node.js 24.22.0 gerechnet. Der unbehandelte Schaden betrug 322.771,10 beziehungsweise 322.741,41 (Abweichung 0,0092 %), das Endvolumen 1.150.269,58 beziehungsweise 1.150.344,90 m³ (0,0066 %). Beide Strategieläufe endeten bei 0 Schaden und 2.600 Budgetrest. Die relativen Bilanzfehler lagen zwischen 5,95 × 10⁻¹⁵ und 9,84 × 10⁻¹⁴. Die festgelegten Schranken wurden eingehalten. Der Solver begrenzt die tatsächliche Schrittweite zusätzlich durch CFL; die vier Läufe verwendeten 4.512, 6.000, 4.507 und 6.000 Subschritte. Der Test ersetzt keine Prüfung auf Geräten und trifft keine Aussage über die räumliche Konvergenz.

Nach der Worker-Fehlerkorrektur wurde die vollständige Browserstrategie auf dem Anwendungscode von Commit `4dcd6f6` mit `tools/observe-strategy-browser.mjs` in Google Chrome 156.0.8078.73 wiederholt. Im Vite-Entwicklungsserver wurden alle elf Abschnitte per Kartenklick, Vorschau und Bestätigung gesetzt; Budgetrest 2.600. Die anschließende vollständige 2×-Runde dauerte 151,058 s und endete mit 0 Flut- und Abrissschaden sowie erreichtem Ziel; Seitenfehler wurden nicht protokolliert. Das Skript prüft nun Zielerreichung und Seitenfehler ausdrücklich und erlaubt die Browserwahl über `WATERFIGHTER_CHROME`. Die Koordinatenprojektion ist testseitig und ersetzt weder menschliche Bedienung noch echte Geräteabnahme; es handelt sich nicht um einen Produktionsbuild-Lauf.

Am 29. Oktober 2026 wurde `tools/observe-strategy-browser.mjs` nach der Optimierung der Wassergeometrie erneut auf Anwendungscode `d72a25e` ausgeführt: Chrome 156.0.8078.73, Vite-Entwicklungsserver unter Linux mit Softwaregrafik, Szenario `1.2-draft`. Elf über die Oberfläche bestätigte Dammabschnitte ließen 2.600 Budget übrig; die vollständige 2×-Runde dauerte 150,833 s und endete mit erreichtem Ziel und 0 Schaden. Seitenfehler wurden nicht protokolliert. Die Testprojektion liefert präzise Bildschirmkoordinaten; dies ist kein menschlicher Touch- oder Produktionsbuildtest.

Ein zusätzlicher Controller-Integrationstest wendet Damm, Graben und Abriss bei laufender Uhr und bereits vorhandenem Wasser an. Für jede Maßnahme prüft er Vorschau, genau eine Budgetbelastung trotz doppelter Bestätigung, unverändertes Wasservolumen und den weiterhin laufenden Rundenzustand. Die Aktionen erfolgen in diesem Test zum selben Worker-Zeitpunkt, damit der Volumenvergleich nicht durch zwischenzeitliche Zuflüsse oder Abflüsse verfälscht wird. Zusammen mit den hydraulischen Werkzeugtests bestanden 33 Vitest-Tests; dieser künstliche Test ersetzt keine reale Gerätebedienung.

## Empfindlichkeit gegenüber der Zuflussstärke

`npx tsx tools/compare-flood-intensity.ts <Faktor>` skaliert ausschließlich für den jeweiligen Diagnoselauf die gesamte Zuflusskurve von `1.2-draft`; das ausgelieferte Szenario wird nicht verändert. Vier ungeschützte 300-s-Läufe auf Node.js 24.22.0 ergaben:

| Faktor | Zugeführtes Volumen | Höchste Tiefe an Zuflusszellen | Höchste Tiefe außerhalb der Zuflusszellen | Höchste Tiefe an Gebäuderändern | Schaden |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0,25 | 570.000 m³ | 7,52 m | 5,72 m | 0 m | 0 |
| 0,50 | 1.140.000 m³ | 11,79 m | 8,88 m | 0 m | 0 |
| 0,75 | 1.710.000 m³ | 15,41 m | 11,59 m | 0,037 m | 0,46 |
| 1,00 | 2.280.000 m³ | 18,65 m | 14,01 m | 2,09 m | 322.771,10 |

Alle relativen Bilanzfehler lagen unter 1,2 × 10⁻¹³. Die Spitzen treten zu unterschiedlichen Zeiten und Orten auf; „außerhalb der Zuflusszellen“ schließt andere Randzellen ein. Der Vergleich zeigt eine ausgeprägte spielerische Schwelle zwischen den getesteten Zuflüssen: Eine einfache Absenkung würde hier den zu schützenden Schaden nahezu beseitigen. Er belegt weder eine realistische Hochwasserkalibrierung noch, dass zwischen 0,75 und 1 keine besser geeigneten Parameter existieren. Die hohen Tiefen und die künstliche Randbedingung bleiben vor Szenarioabnahme zu beurteilen.

Eine feinere Untersuchung ergab bei Zuflussfaktoren 0,85 / 0,90 / 0,95 ungeschützt 57.283,61 / 146.134,85 / 253.548,50 Schaden und Spitzentiefen an Zuflusszellen von 16,74 / 17,39 / 18,02 m. Mit Faktor 0,90 wurden die drei früher dokumentierten Maßnahmen numerisch verglichen (`npx tsx tools/compare-flood-intensity.ts 0.9 bank`, `trench` beziehungsweise `demolish`): Die Dammstrategie erreicht 0 Schaden bei 2.600 Budgetrest; der Graben ergibt 144.159,25 Schaden bei 8.225 Restbudget. Der Abriss ergibt 136.441,89 Flutschaden plus 11.106 Abrissverlust, insgesamt 147.547,89 und damit mehr als die ungeschützten 146.134,85. Die relativen Bilanzfehler aller sechs zusätzlichen Läufe liegen unter 1,1 × 10⁻¹³.

Faktor 0,90 bietet in diesem Vergleich ein Schutzproblem und eine erfolgreiche Dammstrategie, reduziert die höchste Zuflusstiefe aber nur auf 17,39 m und kehrt den zuvor geringen Nutzen des untersuchten Abrisses um. Die experimentelle Kurve wurde deshalb nicht übernommen; andere Abrissorte oder Kurvenformen wurden hier nicht ausgeschlossen. Diese Zahlen sind Spielmodellwerte, keine Hochwasserprognose.

## Kandidat mit breiterem, schwächerem Zufluss

`npx tsx tools/compare-flood-intensity.ts 0.75 baseline --wide` verteilt 75 % der bestehenden Zuflusskurve testweise auf 90 statt 40 Gewässerzellen am oberen Rand. Ohne Maßnahmen ergeben sich 140.425,48 Schaden und 13,03 m maximale Tiefe an einer Zuflusszelle; die maximale Tiefe außerhalb der Zuflusszellen beträgt 11,51 m. Die bestehende Dammstrategie erreicht mit `0.75 bank --wide` 35.146,35 Schaden bei 2.600 Budgetrest und damit das Ziel. Der bisherige Graben ergibt 140.313,08; der bisherige Abriss ergibt 151.531,48 Gesamtschaden und ist hier nachteilig.

Weitere einzeln getestete, bezahlbare Abrisse bei demselben Kandidaten (`0.75 demolish:<ID> --wide`) ergaben für `w491428570-0` 140.425,48, `r4257449-0` 142.560,79, `w33581744-0` 138.830,13, `w316294474-0` 137.537,32, `w219815193-0` 138.143,24 und `w177928758-0` 149.404,19 Gesamtschaden. Drei dieser Abrisse senken den Schaden leicht; der beste getestete kostet 1.106 Budgeteinheiten. Alle relativen Bilanzfehler dieser Vergleichsläufe lagen unter 2,7 × 10⁻¹³.

Der Kandidat hat im ungeschützten Lauf eine niedrigere lokale Spitze als der ursprüngliche Entwurf und behält in diesen numerischen Beispielen Nutzen für alle drei Werkzeuge. Er ist noch nicht übernommen: Zehn-Minuten-Bilanz, vollständige Browserstrategie, sichtbarer Verlauf, Auswirkungen auf Wasserwege und reale Geräte müssen dafür geprüft werden. Auch 13 m sind kein Beleg für eine realistische Kalibrierung; die Werte sind keine Hochwasserprognose.

Für den Kandidaten bestand `npx tsx tools/check-scenario-balance.ts --candidate` einen 600-s-Lauf einschließlich 300 s nach dem regulären Rundenende: Anfangsvolumen 499.584 m³, Zufluss 1.710.000 m³, Abfluss 1.815.115,06 m³, Endvolumen 394.468,94 m³, relativer Bilanzfehler 1,79 × 10⁻¹³, Rundungskorrektur 0, minimale Tiefe 0 und maximale Tiefe 13,03 m. Alle Tiefen und Impulse waren endlich; 6.492 Schritte benötigten 21,57 s auf dem Linux-Rechner.

`tools/observe-strategy-browser.mjs --candidate` ersetzte die Szenarioantwort ausschließlich im Test durch dieselbe Variante. In Chrome 156.0.8078.73 auf dem Vite-Entwicklungsserver mit Anwendungscode `6b51d62` wurden elf Dammabschnitte über die Oberfläche bestätigt; die vollständige 2×-Runde endete nach 151,100 s mit 35.144 Schaden, erreichtem Ziel und 2.600 Budgetrest, ohne protokollierte Seitenfehler. Der numerische Vergleich ergab 35.146,35; der Unterschied ist mit der unterschiedlichen zeitlichen Schrittfolge vereinbar. Testseitig projizierte Klickkoordinaten und eine abgefangene Szenarioantwort ersetzen keine menschliche Gerätebedienung. Die Variante bleibt experimentell; die Sichtprüfung des Flutverlaufs, die Wasserwege und eine Geräteprüfung stehen weiterhin aus.

### Sichtprüfung des Kandidaten

`tools/observe-candidate-flood.mjs` lieferte am 29. Oktober 2026 den Kandidaten ausschließlich per abgefangener Szenarioantwort an den statisch ausgelieferten Produktionsbuild mit Anwendungscode `d1caa1b`. Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik spielte eine ungeschützte 2×-Runde in 151,066 s; sie endete ohne protokollierte Seitenfehler bei 140.415 Schaden und 10.000 Budgetrest. Die [Bildfolge](zuflusskandidat-browser.jpg) zeigt die Ansicht zu den angezeigten Simulationszeiten 0, 60, 120, 180, 240 und 300 s. Die Ergebnisse zeigen das Spielmodell, kein reales Hochwasser.

In der Standardansicht sind Wasserfläche und Strömungsmarker sichtbar, die Überflutung im bebauten Bereich und der Verlauf der Welle sind in diesen Ansichten jedoch nicht eindeutig genug zu erkennen; das Bedienfeld verdeckt einen Teil der Karte. Diese Sichtprüfung belegt die geforderte gut sichtbare Flutwelle im Kandidaten deshalb nicht. Eine gezielte Prüfung mit verschobener Kamera und gegebenenfalls eine Verbesserung der Darstellung sind vor einer Übernahme nötig. Die Zeitpunkte zeigen Einzelbilder, keine vollständige Animation; die Zielplattformen bleiben ungeprüft.

Für eine ergänzende Sichtprüfung erzeugte `npx tsx tools/candidate-snapshots.ts` die unbehandelten numerischen Kandidatenzustände bei 0, 60, 120, 180, 240 und 300 s. `tools/render-candidate-snapshots.mjs` übergab diese Daten testseitig direkt an die Darstellung des Vite-Entwicklungsbuilds und blendete Bedienelemente aus; die [Bildfolge](zuflusskandidat-kartenansicht.jpg) zeigt 0, 120, 180 und 240 s. Bei 180 s ist am linken bebauten Kartenrand Wasser auf zuvor trockenem Gelände zu sehen; die Strömungsmarker erscheinen auf dem Gewässer. Ein zweiter Lauf mit `--pan` verschob die Kamera über dieselbe Methode wie die Kartenbedienung, sodass der Bereich teilweise neben dem Bedienfeld sichtbar wurde. Die Zustände wurden direkt gerendert, nicht über eine laufende Browserrunde erzeugt; UI-Zeit und Gebäudezustände sind daher in diesem Versuch keine Messwerte.

Die Einzelbilder helfen, die verdeckte Stelle zu lokalisieren, belegen aber weder eine vollständige sichtbare Wellenbewegung noch die Bedienbarkeit auf kleinen echten Bildschirmen. Die Überflutung ist bei Standardansicht teilweise durch das Bedienfeld verdeckt; die mobile Sichtprüfung bleibt offen.

Das Status- und Werkzeugmenü kann nun über „Menü ausblenden“ beziehungsweise „Menü anzeigen“ ein- und ausgeblendet werden. Eine erneute testseitige Darstellung des 180-s-Kandidatenzustands mit ausgeblendetem Menü zeigte den zuvor verdeckten linken Kartenbereich. Die Anzeige der Probe wird direkt mit gespeicherten Solverfeldern befüllt; sie ist kein Live-Gerätetest. Browserprüfungen decken die Schaltfläche bei 320 × 568, 390 × 844 und 844 × 390 CSS-Pixeln ab. Build, 33 Vitest-Tests und 19 Chrome-Browserprüfungen bestanden; echte Touchgeräte und die komplette Flutdarstellung bleiben zu prüfen.

## Übernommenes Szenario 1.3

Die oben untersuchte Kandidatenkonfiguration ist nun das ausgelieferte `1.3-draft`. `npx tsx tools/check-scenario-balance.ts` bestätigt für die tatsächlich erzeugte Datei über 600 s denselben relativen Bilanzfehler von 1,79 × 10⁻¹³ und maximal 13,03 m Tiefe; alle Werte blieben endlich und nichtnegativ. Die tatsächlich ausgelieferte Version wurde mit `tools/observe-strategy-browser.mjs` in Chrome 156.0.8078.73 im Vite-Entwicklungsserver vollständig bei 2× gespielt: elf bestätigte Dammabschnitte, 35.144 Schaden, 2.600 Budgetrest, 150,846 s und keine protokollierten Seitenfehler. Die Projektion der Klickkoordinaten bleibt testseitig. Build, 33 Vitest-Tests, zwei Python-Tests und 19 Chrome-Browserprüfungen bestanden. Die vorherigen Einträge und die `--candidate`-Aufrufe beziehen sich auf den historischen Entwurf `1.2-draft`; die neue Version darf nicht nochmals mit 0,75 skaliert werden.


## Szenariolauf mit Bun

Am 29. Oktober 2026 wurde `bun tools/check-scenario-balance.ts` mit Bun 1.4.4 und Szenario `1.3-draft` über 600 simulierte Sekunden ausgeführt. Anfangsvolumen 499.584 m³, Zufluss 1.710.000 m³, Abfluss 1.815.115,06 m³, Endvolumen 394.468,94 m³; der relative Bilanzfehler betrug 1,79 × 10⁻¹³. Die minimale Tiefe war 0 m und die maximale 13,03 m. Der Lauf bestätigt die numerische Prüfung unter Bun, keine reale Hochwasservorhersage und keine mobile Geräteabnahme.

## Werkzeugwirkung im ausgelieferten Szenario

Am 29. Oktober 2026 wurden mit Bun 1.4.4 und dem ausgelieferten Szenario `1.3-draft` vollständige 300-s-Vergleiche mit `bun tools/reference-round.ts`, `bun tools/compare-intervention.ts trench 80 10 80` und `bun tools/compare-intervention.ts demolish w316294474-0` berechnet. Ohne Eingriff betrug der Gesamtschaden 140.425,48. Der vor Flutbeginn angelegte Graben von Zelle (80,10) bis (80,80) kostete 1.775 und ergab 140.313,08 Schaden; der Nutzen beträgt hier 112,40. Der Abriss kostete 1.106 und ergab 126.481,32 Flutschaden plus 11.056 Abrissverlust, insgesamt 137.537,32: eine Verbesserung um 2.888,16 trotz des vollständigen Gebäudeverlusts. Alle drei globalen relativen Bilanzfehler lagen unter 2,7 × 10⁻¹³. Keiner der einzelnen Eingriffe erreicht das Schadensziel; die dokumentierte Dammstrategie tut dies.

`bun tools/probe-waterways.ts baseline` und `trench` berechnen zusätzlich den Rusanov-Massenfluss an der Zellkante von (80,45) nach (80,46) vor jedem Schritt getrennt nach Richtungen und integrieren mit der tatsächlichen Schrittweite. Ohne Graben wurden dort 22.719,37 m³ vorwärts und 0 rückwärts verrechnet; mit Graben 25.735,29 m³ vorwärts und 0,025 m³ rückwärts. Die separat nachgerechnete Größe belegt eine Änderung an dieser Kante, nicht die Verfolgung einer bestimmten Wassermenge oder eines vollständigen Umleitungswegs; Wasser kann mehrfach gezählt werden.

`bun tools/probe-demolition-flow.ts baseline` und `demolish` bilanzieren die 69 Rasterzellen des Gebäudegrundrisses über dieselbe Runde. Ohne Abriss sind die modellierten Zellgrenzen geschlossen, und über sie fließt kein Wasser. Nach dem Abriss werden 2.753,27 m³ hinein und 2.476,36 m³ hinaus verrechnet; das Endvolumen im Grundriss beträgt 276,91 m³, der lokale Bilanzrest −1,55 × 10⁻¹¹ m³. Das Werkzeug berechnet die Flüsse separat aus dem jeweiligen Solverzustand; getrennte Ein- und Ausflusssummen können mehrfach bewegtes Wasser enthalten. Der Vergleich zeigt einen geöffneten und durchströmten Modellbereich, weist aber keinen bestimmten durchgehenden Teilchenweg nach. Die Resultate sind Spielmodellwerte, keine reale Schutzempfehlung.

## Bilanz bei abgewiesenen Schritten

Eine gezielte Fehlerfallprüfung zeigte, dass ein wegen ungültiger Bodenreibung verworfener Schritt bei offenem Rand bereits 0,4 m³ Abfluss eingetragen hatte, obwohl Raster und Simulationszeit unverändert blieben. Der Solver prüft die Reibung nun vor der Flussrechnung und übernimmt den während eines Schritts gesammelten Abfluss erst nach erfolgreicher Zustandsprüfung und Aktualisierung. Zwei Tests prüfen ungültige Reibung und einen nicht endlichen Zustand bei offenem Rand; in beiden Fällen bleiben Abfluss und Zeit unverändert. Dies ist keine allgemeine Aussage über Wiederaufnahme nach allen denkbaren Rechenfehlern; die Oberfläche behandelt Solverfehler weiterhin als fatal.

Nach der Änderung bestanden Build, 37 Vitest-Tests und 22 Chrome-Browserprüfungen. Der erneute 600-s-Lauf von Szenario `1.3-draft` mit `bun tools/check-scenario-balance.ts` ergab einen relativen Bilanzfehler von 1,25 × 10⁻¹³, minimale Tiefe 0 und maximale Tiefe 13,03 m. Die Änderung der letzten Nachkommastellen beim summierten Abfluss ergibt sich aus der geänderten Summationsreihenfolge. Echte Geräte bleiben ungeprüft.

## Sichtprüfung im laufenden Produktionsbuild

Am 29. Oktober 2026 zeichnete `bun tools/observe-live-flood.mjs` Szenario `1.3-draft` auf dem Produktionsbuild `2a4f212` während einer vollständigen unbehandelten 2×-Runde auf: Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik, 1.200 × 800 CSS-Pixel, Statusmenü nach dem Start ausgeblendet. Das Skript speichert etwa alle 15 simulierten Sekunden eine Canvas-Aufnahme und die tatsächlich angezeigte Uhrzeit. Die Runde dauerte nach dem Ausblenden 150,228 s und endete mit 140.415 Schaden und 10.000 Budgetrest; Seitenfehler wurden nicht protokolliert. Der Test nutzt das ausgelieferte Szenario und den regulären Worker, keine injizierten Wasserfelder.

Die Aufnahmen bei [00:02](flutverlauf/002.png), [03:00](flutverlauf/180.png) und [04:45](flutverlauf/285.png) zeigen am linken Kartenrand Wasser auf zuvor trockenem Gelände und Strömungsmarker. Die Momentaufnahmen zeigen eine Veränderung des Wassers im bebauten Bereich, aber keine durchgehend beurteilte Animation oder ausreichende Erkennbarkeit auf kleinen echten Geräten. Die übrigen Aufnahmen und ihr Zeitprotokoll lagen lokal unter `/tmp/waterfighter-live-flood-rrRogM` und sind nicht eingecheckt.

Zwei frühere Versuche wurden vorzeitig abgebrochen: beim ersten endeten Browser und Testserver nach Aufnahmen bis 02:45, beim zweiten wurde die Browserverbindung nach Aufnahmen bis 00:30 geschlossen, während der Server weiterlief. Die Ursache wurde nicht festgestellt. Vor dem dritten Versuch wurden nicht mehr benötigte lokale Testserver beendet; ein ursächlicher Zusammenhang ist damit nicht belegt. Der erfolgreiche Einzellauf schließt sporadische Probleme nicht aus und ersetzt keine Geräteabnahme.

## Review-Kandidaten mit zusätzlichem westlichem Modellabfluss

Am 29. Oktober 2026 wurden die in [review-steuerung-terra.md](review-steuerung-terra.md) vorgeschlagenen Varianten mit `bun tools/compare-review-strategies.ts FALL` unabhängig auf Linux mit Bun 1.4.4 über jeweils 300 simulierte Sekunden berechnet. Das Skript liest `1.3-draft` und die bestehende Dammreferenz, öffnet für alle Varianten außer `original` zusätzlich den linken Modellrand und setzt die Grabentiefe für die Versuche auf 3 m. Änderungen gelten nur im Speicher; das ausgelieferte Szenario und die Pipeline sind unverändert. Alle Maßnahmen werden vor Rundenbeginn ausgeführt. Das Schadensziel bleibt 50.000.

| Fall | Flutschaden | Abrissverlust | Gesamtschaden | Budgetrest | Westlicher Modellabfluss |
| --- | ---: | ---: | ---: | ---: | ---: |
| `original` – Originalrand, ohne Eingriff | 140.425,48 | 0 | 140.425,48 | 10.000 | 0 m³ |
| `open` – zusätzlicher Westrand, ohne Eingriff | 138.852,13 | 0 | 138.852,13 | 10.000 | 1.547,47 m³ |
| `trench` – Westrand, Graben (0,4)–(25,4) | 113.264,38 | 0 | 113.264,38 | 9.350 | 4.581,80 m³ |
| `dam3` – Westrand, erste drei Dammabschnitte | 34.792,87 | 0 | 34.792,87 | 8.160 | 0,01 m³ |
| `dam3trench` – dieselben Dämme und Graben (0,4)–(25,4) | 21.600,61 | 0 | 21.600,61 | 7.510 | 618,65 m³ |
| `dam2` – Westrand, erste zwei Dammabschnitte | 34.768,16 | 0 | 34.768,16 | 8.800 | 0,01 m³ |
| `dam2demolish` – dieselben Dämme und Abriss | 34.768,16 | 16.017 | 50.785,16 | 7.198 | 0,01 m³ |
| `combined` – dieselben Dämme, Abriss und Graben (0,10)–(23,10) | 17.629,93 | 16.017 | 33.646,93 | 6.598 | 460,59 m³ |

Der zusätzliche Kontrollfall `dam2trench` ohne Abriss wird bei der verbindlichen Aktionsprüfung abgelehnt: Die ersten fünf Grabenzellen (0,10)–(4,10) sind vom Gebäude `w33581744-0` belegt. Dessen Abriss kostet 1.602 und zählt mit 16.017 vollständig zum Schaden; er ermöglicht den vorgeschlagenen Verlauf, verschlechtert aber allein gegenüber `dam2` die Wertung um 16.017. Der nachfolgende Graben kostet 600 und reduziert gegenüber `dam2demolish` den Gesamtschaden um 17.138,23; gegenüber `dam2` ergibt die vollständige Kombination 1.121,23 weniger Gesamtschaden bei 2.202 zusätzlichen Budgeteinheiten. Diese Kosten und Schäden sind unterschiedliche Spielgrößen. Ohne Abriss ist der vorgeschlagene Grabenverlauf nicht durchführbar; dies ist kein isolierter Abriss-Wirkungsnachweis.

Beispielhaft sinkt im Vergleich `dam2` zu `combined` der modellierte Flutschaden an `w316294474-0` von 11.056 auf 1.297,98 und an `w219815193-0` von 10.418 auf 4.524,79. Das belegt eine veränderte Schadensverteilung, aber nicht für sich den vollständigen Wasserweg oder seine Ursache. Der separat nachgerechnete westliche Abfluss integriert vor jedem Schritt die nach außen gerichtete Randimpulsdichte; die globalen relativen Wasserbilanzfehler aller berechneten Runden liegen unter 1,6 × 10⁻¹³.

Der linke Rand ist die westliche Ausschnittgrenze bei 3.900 m im Szenariokoordinatensystem; ein offener numerischer Rand entfernt Wasser aus dem Modell, ohne das Gebiet dahinter zu berechnen. Er ist eine experimentelle Spielannahme, kein belegter sicherer Abfluss oder reale Schutzempfehlung. Ein sichtbarer, zusammenhängender Ableitungsweg, die Empfindlichkeit gegenüber Platzierung und die Wirkung später Eingriffe sind noch zu prüfen. Die Kandidatenwerte sind kein Browser- oder Gerätetest und keine Freigabe einer Szenarioänderung.

### Eingriffszeit und Abweichungen der Platzierung

Auf demselben experimentellen Szenario mit offenem Westrand und 3 m Grabentiefe wurden die Varianten `dam2` und `combined` mit `bun tools/compare-review-strategies.ts FALL --at=SEKUNDEN` erneut berechnet. Das Skript führt bis zum angegebenen Zeitpunkt eine ungeschützte Flut aus und wendet dann alle Aktionen der jeweiligen Strategie unmittelbar hintereinander an. Das ist eine numerische Idealisierung; sie berücksichtigt weder menschliche Auswahl- und Bestätigungszeiten noch eine Pause zwischen einzelnen Aktionen.

| Zeitpunkt | Bereits eingetretener Schaden | `dam2` Gesamtschaden | `combined` Gesamtschaden |
| ---: | ---: | ---: | ---: |
| Vorbereitung | 0 | 34.768,16 | 33.646,93 |
| 30 s | 0 | 34.768,16 | 33.646,94 |
| 60 s | 0 | 34.768,39 | 33.647,25 |
| 90 s | 0 | 35.537,60 | 34.885,00 |
| 120 s | 187,19 | 44.770,23 | 45.784,94 |
| 130 s | 1.732,87 | 58.486,88 | nicht berechnet |
| 140 s | 5.963,14 | 72.421,27 | nicht berechnet |
| 150 s | 10.869,33 | 88.597,96 | 82.215,51 |
| 180 s | 32.732,38 | 129.415,10 | nicht berechnet |

Für `dam2` ist 120 s der späteste erfolgreich getestete Zeitpunkt; 130 s verfehlt das Ziel. Daraus folgt keine exakte universelle Zeitgrenze. Bei `combined` ist 120 s ebenfalls der späteste erfolgreich getestete Zeitpunkt, 150 s verfehlt das Ziel. Die Zahlen belegen eine spätere Eingriffswirkung im Modell, keine praktische Platzierbarkeit durch eine Person.

Für `dam2` verschieben `--tip=-1` und `--tip=1` nur den Endpunkt des zweiten Dammabschnitts um eine Rasterzelle nach links beziehungsweise rechts. Beide Verläufe werden akzeptiert und ergeben bei Maßnahmen vor Flutbeginn 30.632,37 beziehungsweise 37.663,52 Schaden bei 8.840 beziehungsweise 8.760 Budgetrest. Verschiebt man dagegen den Anfangspunkt des ersten Abschnitts mit `--entry=-1` oder `--entry=1` beziehungsweise den gemeinsamen Eckpunkt mit `--junction=-1` oder `--junction=1`, erzeugt die aktuelle Pfadregel zuerst eine horizontale Kante auf dem oberen Kartenrand; diese vier Maßnahmen werden abgelehnt. Die Vorschau benennt diesen Grund jetzt ausdrücklich und empfiehlt innere Endpunkte.

Für `combined` verschieben `--trench-row=-1` und `--trench-row=1` den ganzen Graben bei unveränderten Dämmen und Abriss um eine Rasterzeile. Beide werden akzeptiert, kosten weiterhin 600 und ergeben 48.078,44 beziehungsweise 44.897,16 Gesamtschaden statt 33.646,93. Alle berechneten relativen Wasserbilanzfehler liegen unter 1,5 × 10⁻¹³. Die Ergebnisse zeigen lokale Empfindlichkeit, prüfen aber nicht alle Verschiebungen und belegen keine natürliche Bedienung ohne Gitterkenntnis.

### Markierter Verlauf im experimentellen Ableitungsgraben

Am 29. Oktober 2026 berechnete `bun tools/trace-review-diversion.ts combined --ordered` und `bun tools/trace-review-diversion.ts dam2demolish --ordered` die beiden 300-s-Kandidaten mit offenem westlichem Modellrand und 3 m Grabentiefe. Beide beginnen mit denselben zwei Dammabschnitten und dem Abriss; nur `combined` enthält zusätzlich den Graben (0,10)–(23,10). Wasser, das die Kante zwischen (24,10) und (23,10) westwärts passiert, erhält eine passive Modellmarkierung, soweit es noch nicht markiert ist. Das Diagnoseprogramm rechnet die Massenflüsse vor jedem Zeitschritt separat aus dem Solverzustand nach; es verändert die eigentliche Simulation nicht.

Die geordnete Auswertung teilt die Markierung in fünf Fortschrittsstufen: Sie steigt jeweils eine Stufe auf, wenn sie die Kanten bei x = 20, 15, 10 und 5 in Zeile 10 in genau dieser Reihenfolge westwärts passiert. An anderen Kanten und bei Rückströmung bleibt die Stufe erhalten. So wird erfasst, welcher markierte Modellanteil alle vier Querschnitte passiert hat, bevor er den westlichen Modellrand verlässt. Zwischen den Querschnitten ist der Verlauf nicht auf die Grabenzeile beschränkt. Die normale Markierungsbilanz und die Summe der Fortschrittsstufen wurden zusätzlich miteinander verglichen.

| Größe | Mit Graben | Ohne Graben |
| --- | ---: | ---: |
| Am Eingang markiert | 302,4437 m³ | 302,4437 m³ |
| Markierung am Westrand insgesamt | 81,5478 m³ | 0,000095 m³ |
| Davon nach allen vier Querschnitten in Reihenfolge | 81,5478 m³ | 0 m³ |
| Markierung am Rundenende im Modell | 220,8959 m³ | 302,4436 m³ |
| Gesamtschaden | 33.646,93 | 50.785,16 |

Im Grabenversuch wurden an den vier Querschnitten 257,47, 175,15, 134,22 und 103,89 m³ markierter westwärtiger Fluss integriert. Diese separaten Flusssummen können wiederholt bewegte Anteile enthalten und sind nicht mit dem geordneten Randabfluss gleichzusetzen. Der Bilanzrest der geordneten Markierung liegt in beiden Läufen unter 1,1 × 10⁻¹² m³; die größte lokale Abweichung zwischen Summe der Stufen und einfacher Markierung unter 9 × 10⁻¹⁵ m³. Die globalen relativen Wasserbilanzfehler liegen unter 2,3 × 10⁻¹⁴. Ein zusätzlicher `dam2`-Lauf ohne Abriss und Graben ergab bei dieser Markierung dieselben Werte wie der Kontrolllauf mit Abriss ohne Graben.

Das ist ein nachverfolgter, geordneter **numerischer Modellanteil** und ein stärkerer Hinweis auf den vorgesehenen Ableitungsweg als einzelne Kantenflüsse. Rusanov-Diffusion und Zellmischung verhindern die Interpretation als reale Wasserteilchen. Der offene Rand entfernt Wasser aus dem Ausschnitt, sagt nichts über die Folgen außerhalb aus und ist weiterhin keine geprüfte reale Ableitung. Der Versuch beweist nicht, dass der gesamte schadensmindernde Effekt durch diesen markierten Anteil verursacht wird; ein Browserlauf und eine menschliche Spielprüfung der Kandidaten fehlen.

## Referenzstrategien auf dem ausgelieferten Entwurf 1.4

Die zuvor verglichenen Spielannahmen sind in `1.4-draft` übernommen. `tests/fixtures/review-strategies.json` enthält die Aktionsfolgen; `bun tools/reference-strategies.ts baseline`, `shield` und `divert` berechnen jeweils 300 s direkt mit dem ausgelieferten Paket, ohne es im Speicher zu verändern. Alle Aktionen erfolgen in der Vorbereitung.

| Strategie | Flutschaden | Abrissverlust | Gesamtschaden | Budgetrest |
| --- | ---: | ---: | ---: | ---: |
| Ohne Eingriff | 138.852,13 | 0 | 138.852,13 | 10.000 |
| Zwei Dammabschnitte | 34.768,16 | 0 | 34.768,16 | 8.800 |
| Zwei Dämme, Gebäudeabriss und Graben | 17.629,93 | 16.017 | 33.646,93 | 6.598 |

Die relativen Wasserbilanzfehler der drei Läufe liegen unter 8,4 × 10⁻¹⁴. Beide Strategien erreichen das unveränderte Ziel 50.000. Der Graben und der Modellrand sind Spielannahmen; der Randabfluss wird außerhalb des Ausschnitts nicht weiter berechnet. Die obigen Kontrollversuche, Markierungen und Zeitpunktvergleiche stammen aus dem numerisch gleich parametrierten Kandidaten auf Basis `1.3-draft`; sie sind keine neue Geräte- oder Humanprüfung.

Der Zehn-Minuten-Lauf `bun tools/check-scenario-balance.ts` auf dem gelieferten `1.4-draft` berechnete 6.492 Schritte in 37,18 s auf diesem Linux-Rechner. Die Wassertiefen lagen zwischen 0 und 13,0305 m; alle geprüften Tiefen und Impulse blieben endlich. Der relative Bilanzfehler betrug 8,42 × 10⁻¹⁴. Die maximale Tiefe bleibt eine nicht real kalibrierte Modellgröße; der Test ist kein Leistungsnachweis für mobile Geräte.

### Einordnung der Spitzentiefen auf Version 1.4

`bun tools/inspect-scenario-depth.ts` berechnete am 29. Oktober 2026 die unbehandelte 300-s-Runde mit dem gelieferten `1.4-draft`. Die größte Tiefe von 13,030 m trat nach 142,99 s in der Zufluss-Gewässerzelle (29,0) auf; die künstliche Sohle liegt dort bei 0 m Wiener Null. Außerhalb der Zuflusszellen betrug die Spitze 11,515 m in Gewässerzelle (30,1) nach 145,56 s. Die höchste Tiefe auf einer als Land maskierten Zelle lag bei 5,195 m in (30,2) nach 148,67 s; dort betrug die Modellsohle 5,651 m und der Wasserspiegel 10,846 m Wiener Null. Alle drei Spitzen liegen am oberen Zuflussrand oder unmittelbar daneben. Die maximale Landtiefe ist somit nicht allein eine Anzeige der künstlichen Gewässersohle; auch Land wird in diesem Spielereignis dort stark überflutet.

Der Gesamtschaden betrug 138.852,13, der relative Wasserbilanzfehler 8,40 × 10⁻¹⁴. Die Werte sind Zellmaxima zu unterschiedlichen Zeitpunkten und keine Messungen oder Kalibrierung eines realen Hochwassers. Die 90 Zuflusszellen erhalten eine vorgegebene künstliche Zuflusskurve; ihr Rand und die fehlende gemessene Bathymetrie begrenzen die physikalische Aussage. Der Versuch lokalisiert die Spitzen, belegt aber nicht ihre reale Plausibilität und ersetzt keine Sensitivitäts- oder Geräteprüfung.

### Schrittweitenvergleich auf Version 1.4

Am 29. Oktober 2026 wurden `bun tools/compare-timesteps.ts SCHRITT baseline` und `bun tools/compare-timesteps.ts SCHRITT bank` mit den maximalen Schrittweiten 1 und 0,05 s auf dem ausgelieferten `1.4-draft` über jeweils 300 simulierte Sekunden ausgeführt. Der Solver begrenzt beide Vorgaben zusätzlich durch CFL. `bank` setzt die elf Dammabschnitte aus `tests/fixtures/strategy.json` vor Beginn; dies ist die ältere, längere Dammstrategie, nicht die kürzere Reviewreferenz.

| Fall | Max. Schritt | Schritte | Endvolumen | Gesamtschaden | Budgetrest | Relativer Bilanzfehler |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Ohne Eingriff | 1 s | 3.578 | 1.082.177,91 m³ | 138.852,13 | 10.000 | 8,40 × 10⁻¹⁴ |
| Ohne Eingriff | 0,05 s | 6.000 | 1.082.201,61 m³ | 138.813,12 | 10.000 | 8,96 × 10⁻¹⁵ |
| Elf Dämme | 1 s | 3.597 | 1.076.509,09 m³ | 35.146,35 | 2.600 | 2,68 × 10⁻¹³ |
| Elf Dämme | 0,05 s | 6.000 | 1.076.535,10 m³ | 35.139,83 | 2.600 | 9,06 × 10⁻¹⁵ |

Im unbehandelten Fall unterscheiden sich Schaden und Endvolumen um etwa 0,0281 % beziehungsweise 0,0022 % bezogen auf den 1-s-Lauf und erfüllen damit die zuvor festgelegten 1-%-Schranken. Beide Dammläufe bleiben innerhalb des Budgets und unter dem Schadensziel von 50.000; alle Bilanzfehler liegen unter 0,1 %. Dies ist ein Vergleich zweier Schrittweiten für zwei konkrete Fälle, kein allgemeiner Konvergenzbeweis, keine reale Kalibrierung und keine mobile Leistungsmessung.

### Überströmung an den Referenzdämmen auf Version 1.4

`bun tools/inspect-dam-overtopping.ts` berechnete am 29. Oktober 2026 die vollständige 300-s-Runde mit den beiden vorbereiteten Dämmen aus `tests/fixtures/review-strategies.json` auf dem gelieferten `1.4-draft`. Das Diagnoseprogramm tastet vor jedem Solver-Schritt dieselben rekonstruierten Rusanov-Massenflüsse an den bestätigten Dammkanten ab; es verändert den Solverzustand nicht. Als Überschreitung zählt ein rekonstruierter Wasserstand mehr als 0,000001 m über der effektiven Kantenhöhe.

An vier der 30 Dammkanten wurde die Krone überschritten, erstmals nach 119,32 s. Der größte Höhenüberschuss betrug 1,329 m nach 151,41 s an Kante `x:26` mit Dammkrone 10,212 m Wiener Null. Über alle Dammkanten wurden richtungsgetrennt 627,58 m³ in positiver und 1.064,85 m³ in negativer Achsenrichtung integriert; allein an der Kante mit dem höchsten Überschuss waren es 709,06 m³ in negativer Richtung. Diese Flusssummen können mehrfach hin- und herbewegtes Wasser enthalten und sind keine eindeutigen Wassermengen oder ein nachverfolgter Weg. Gesamtschaden 34.768,16, Budgetrest 8.800 und relativer Bilanzfehler 2,28 × 10⁻¹⁴ stimmen mit der numerischen Referenzrunde überein.

Die Untersuchung belegt überströmte Kanten und rekonstruierte Modellflüsse für diesen einen Dammverlauf; sie belegt keine reale Hochwasserhöhe und keine durchgehend verständliche Darstellung der Überströmung im Browser. Der Vergleich zu einer Runde ohne Damm ist im [Gebäudevergleich](review-gebaeudevergleich.md) dokumentiert; die getrennte [synthetische Barrierenprüfung](#sichtkontrolle-der-dammöffnung) bleibt der kontrollierte Nachweis von Rückstau und Öffnung.

### Rückstauvergleich an Referenzdammkanten

`bun tools/compare-dam-backwater.ts` verglich am 29. Oktober 2026 zwei vollständige 300-s-Runden auf `1.4-draft`: unbehandelt und mit den zwei vorbereiteten Referenzdämmen. Zu neun Zeitpunkten von 60 bis 300 s wurden die Wasserspiegel beider benachbarter Zellen an allen 30 Dammkanten verglichen. Je Zeitpunkt wird die Kante ausgewählt, an der sich der Betrag des Spiegelunterschieds durch die Dämme am stärksten gegenüber der unbehandelten Runde erhöht. Diese nachträgliche Auswahl beschreibt einen lokalen Extremwert, keinen mittleren Effekt über den gesamten Damm.

Bei 120 s lag diese Kante bei `x:26`: Mit Damm betrugen die benachbarten Modellspiegel 6,037 und 10,251 m Wiener Null, ohne Damm 9,963 und 9,882 m. Der Betrag des lokalen Spiegelunterschieds erhöhte sich somit von 0,081 auf 4,214 m. Bei 150 s lag das entsprechende Maximum an `y:2027`: mit Damm 11,608 und 8,656 m, ohne Damm 9,895 und 9,977 m. Diese Gegenüberstellung zeigt in den beiden berechneten Spielrunden einen lokalen Aufstau an den ausgewählten Dammkanten. Sie beschreibt keine reale Schutzwirkung und beweist nicht, dass der Verlauf auf dem Bildschirm ohne Hilfsmittel verständlich erkennbar ist.

Beide Runden verwendeten dieselbe Zuflusskurve und dasselbe Szenariopaket; die relativen Wasserbilanzfehler lagen unter 1,4 × 10⁻¹³. Das zusätzliche Anfahren der neun Auswertezeitpunkte beeinflusst die zeitliche Schrittaufteilung geringfügig: Die Gesamtschäden betrugen 34.768,15 mit Dämmen und 138.852,06 ohne Dämme. Die Werte sind keine unabhängige Kalibrierung und kein Ersatz für den menschlichen Spieltest.

Die Option `bun tools/compare-dam-backwater.ts --capture` speichert zusätzlich die Zustände beider numerischer Runden bei 120 und 150 s. `bun tools/render-dam-backwater.mjs` überträgt diese gespeicherten Zustände in eine instrumentierte Entwicklungsansicht; Worker und Bedienelemente werden dabei für die Diagnose deaktiviert beziehungsweise ausgeblendet. Auf Anwendungscode `7af01fd`, Chrome 156.0.8078.4 und identischer, programmatisch fokussierter Kamera entstanden bei 150 s die Ansichten [ohne Damm](rueckstau-ohne-damm.png) und [mit zwei Dämmen](rueckstau-mit-damm.png). Die Bilder zeigen unterschiedliche Überflutung und Gebäudezustände. Der oben berechnete Höhenunterschied an einzelnen Kanten ist in der gewählten Ansicht jedoch nicht eindeutig ablesbar; die Bilder belegen daher keine durchgehend verständliche Sichtbarkeit von Rückstau oder Überströmung. Es handelt sich um gespeicherte Solverzustände, nicht um eine laufende Browserrunde oder eine menschliche Prüfung.

### Erneute Sichtkontrolle des Rückstaus

Auf Anwendungscode `577fe8f` wurde `bun tools/compare-dam-backwater.ts --capture` erneut ausgeführt und die vier gespeicherten Zustände bei 120 und 150 s mit `bun tools/render-dam-backwater.mjs` in Chrome 156.0.8078.73 unter Linux dargestellt. Bei 120 s beträgt die berechnete Differenz von Gelände plus Wassertiefe an der Kante `x:26` mit Damm 4,18 m, wobei die niedrigere Seite trocken ist; ohne Damm beträgt die Wasserstandsdifferenz 0,08 m. Bei 150 s sind beide Seiten nass und die Differenz beträgt mit Damm 1,89 m gegenüber 0,12 m ohne Damm; die relativen Wasserbilanzfehler der beiden 300-s-Läufe betragen höchstens 2,49 × 10⁻¹³. Die Ansichten bei 120 s zeigen unterschiedliche Überflutung und Gebäudeschäden. Der Höhenunterschied selbst ist in der gewählten Perspektive weiterhin nicht zuverlässig ablesbar; daraus folgt kein Nachweis einer für Menschen verständlichen Darstellung oder einer echten Geräteprüfung. Der Browserlauf verwendete eingesetzte Solverzustände, keinen laufenden Worker.
