# Gebäudevergleich der Referenzstrategien

## Aktueller Vergleich mit direkter Dammführung

Die Dammvorschau folgt bei schrägen Endpunkten nun einer direkten, verbundenen Rasterlinie. Das Szenariopaket bleibt `1.4-draft`; die geänderte Pfadregel und die erweiterten Referenzaktionen gehören zum aktuellen Anwendungscode. `bun tools/reference-strategies.ts baseline`, `shield`, `land-divert` und `divert` berechnen die folgenden 300-s-Runden mit demselben Paket; alle Maßnahmen erfolgen vor Flutbeginn.

| Variante | Flutschaden | Abrissverlust | Gesamtschaden | Budgetrest |
| --- | ---: | ---: | ---: | ---: |
| Ohne Eingriff | 138.852,13 | 0 | 138.852,13 | 10.000 |
| Zwei Dämme (`shield`) | 25.821,81 | 0 | 25.821,81 | 8.800 |
| Drei Dämme und Landgraben (`land-divert`) | 863,20 | 0 | 863,20 | 7.510 |
| Zwei Dämme, Abriss und Graben (`divert`) | 11.916,79 | 16.017 | 27.933,79 | 6.598 |

Die relativen Wasserbilanzfehler liegen unter 2,1 × 10⁻¹³. Die drei Dämme ohne Graben ergeben 23.574,17 Schaden bei 8.160 Budgetrest; der Landgraben kostet 650 und senkt den Schaden in diesem Kontrollvergleich um 22.710,97. Die Kombination mit Gebäudeabriss erreicht zwar weiterhin das Ziel, schneidet aber gegenüber den zwei Dämmen allein um 2.111,98 schlechter ab und kostet zusätzlich 2.202 Budgeteinheiten. Ihr Graben senkt gegenüber zwei Dämmen und Abriss ohne Graben (41.838,81) den Schaden um 13.905,02. Der separat geprüfte einzelne Abriss ohne Dämme bleibt unabhängig von der Dammführung wirtschaftlich sinnvoll; er ist unten dokumentiert. Die Schutzstrategien sind numerische Referenzen und keine menschliche Bedienprüfung. Der offene Modellrand ist eine Spielannahme, keine sichere reale Ableitung.

Bei vorbereiteten drei Dämmen senkt derselbe Graben nach 150 s den Schaden auf 1.001,29 bei 7.510 Budgetrest; ohne ihn betragen Schaden und Restbudget 23.574,17 und 8.160. Die Aktion wird numerisch zum exakten Zeitpunkt gesetzt, ohne menschliche Auswahlzeit. Einzelne Verschiebungen des ersten Dammstarts, des gemeinsamen Knickpunkts und des zweiten Endpunkts um eine Zelle wurden auf der neuen Pfadregel ebenfalls berechnet: Alle sechs geprüften Varianten waren zulässig, lagen zwischen 8.809,29 und 29.029,15 Schaden und hielten das Ziel ein. Das ist keine Garantie für beliebige Platzierungen.

## Historische Vergleiche mit rechtwinkliger Dammführung

Die folgenden dammbasierten Tabellen und Bilder stammen aus dem früheren Anwendungscode `b526c29` beziehungsweise dessen Vorgängern. Ihr Szenariopaket ist ebenfalls `1.4-draft`, aber die damalige Dammroute verlief zuerst horizontal und dann vertikal. Sie sind nicht die aktuellen Referenzwerte; zur Reproduktion des damaligen Dammverlaufs muss der entsprechende ältere Anwendungscode verwendet werden. Abschnitte ohne Dämme, etwa der einzelne Abriss, sind von der Dammführung unabhängig.

Stand: 29. Oktober 2026, ausgeliefertes Szenario `1.4-draft`. Drei vollständige numerische 300-s-Runden wurden mit `bun tools/reference-strategies.ts baseline`, `shield` und `divert` berechnet. Alle Eingriffe erfolgen vor Flutbeginn. Die IDs bezeichnen OSM-abgeleitete Grundrisse; die Zahlen sind Spielwerte, keine reale Gefahrenbewertung.

| Gebäude | Ohne Eingriff: Flutschaden | Zwei Dämme: Flutschaden | Dämme, Abriss und Graben: Flutschaden |
| --- | ---: | ---: | ---: |
| `w491428570-0` | 36.801,31 | 0 | 0 |
| `r9350494-0` | 25.180,70 | 0 | 0 |
| `r4257449-0` | 22.826,00 | 7.514,12 | 7.514,12 |
| `w33581744-0` | 15.809,35 | 0 | 0, abgerissen |
| `w219815193-0` | 10.418,00 | 10.418,00 | 4.524,79 |
| `w316294474-0` | 11.056,00 | 11.056,00 | 1.297,98 |
| `w501079921-0` | 1.487,00 | 1.487,00 | 0 |

Die zwei Dämme liegen an der Eintrittsseite des bebauten Bereichs und schirmen insbesondere die ersten beiden Gebäude im Modell ab. Der zusätzliche Graben verläuft nach Westen zum offenen Modellrand; für seinen Verlauf wird `w33581744-0` geopfert. Dessen vollständiger Wert von 16.017 wird als Abrissverlust gezählt und steht nicht in der Flutschadensspalte. Im Vergleich zur Dammvariante sinken die Flutschäden der letzten drei Tabellengebäude um zusammen 17.138,23. Das entspricht dem Rückgang des gesamten Flutschadens; nach Einrechnung des Abrissverlusts verbessert die Kombination den Gesamtschaden um 1.121,23, bei zusätzlichen Maßnahmenkosten von 2.202. Die Größen Budgetkosten und Gebäudeschaden sind getrennt; der Vergleich belegt daher keinen positiven Gesamtsaldo, wenn man beide Größen addiert.

Die Dammvariante kostet 1.200 und endet bei 34.768,16 Gesamtschaden, die Kombination kostet 3.402 und endet bei 33.646,93; ohne Eingriff entstehen 138.852,13 Schaden. Die relativen Wasserbilanzfehler betrugen höchstens 8,40 × 10⁻¹⁴. Die dokumentierte [Markierungsuntersuchung](solverbericht.md#markierter-verlauf-im-experimentellen-ableitungsgraben) zeigt einen geordneten Modellanteil entlang des Ableitungswegs, beweist aber nicht, dass dieser Anteil allein die Schadensdifferenz verursacht. Der offene Modellrand ist eine Spielannahme; Folgen außerhalb des Ausschnitts werden nicht berechnet. Die Ergebnisse ersetzen weder einen menschlichen Spieltest noch eine reale Schutzempfehlung.

Der Kontrolllauf `bun tools/compare-review-strategies.ts dam2demolish` wurde ebenfalls direkt mit `1.4-draft` nachgerechnet: zwei Dämme und Abriss ohne Graben ergeben 34.768,16 Flutschaden plus 16.017 Abrissverlust, insgesamt 50.785,16 bei 7.198 Budgetrest. Der relative Bilanzfehler beträgt 2,28 × 10⁻¹⁴. Der vorgeschlagene Graben ist ohne diesen Abriss durch den Gebäudegrundriss versperrt; der Vergleich mit und ohne Graben bei gleichem Abriss zeigt die zusätzliche Wirkung, nicht eine isolierte wirtschaftliche Wirkung des Abrisses.

## Einzelner Abriss als Kontrolllauf

`bun tools/compare-intervention.ts demolish w316294474-0` auf demselben Szenario und vor Flutbeginn ergibt 123.845,15 Flutschaden und 11.056 Abrissverlust, zusammen 134.901,15. Gegenüber der unbehandelten Runde sinkt der Gesamtschaden um 3.950,98; die Abrisskosten betragen 1.106. Auch bei Addition von Kosten und Schaden bleibt hier eine Verbesserung um 2.844,98. Der relative Wasserbilanzfehler beträgt 6,52 × 10⁻¹⁴. Dieser Einzelabriss verfehlt weiterhin das Ziel von 50.000 und ist keine erfolgreiche Gesamtstrategie; er zeigt einen wirtschaftlich sinnvollen Einsatz des Werkzeugs im Spielmodell. Die frühere lokale [Abrissbilanz](solverbericht.md#werkzeugwirkung-im-ausgelieferten-szenario) zeigt den geöffneten Grundriss für den vorherigen Szenarioentwurf, nicht diesen aktuellen Lauf.

## Graben mit drei Dammabschnitten

Ein weiterer Kontrollvergleich auf dem ausgelieferten `1.4-draft` mit `bun tools/compare-review-strategies.ts dam3` und `dam3trench` verwendet dieselben drei Dammabschnitte; nur der zweite Lauf ergänzt den Graben von Zelle (0,4) bis (25,4). Alle 26 Zellen sind in der Szenario-Wassermaske Land; ihre Geländehöhen vor dem Aushub liegen zwischen 5,95 und 8,77 m Wiener Null. Beide Maßnahmenfolgen wurden vor Flutbeginn ausgeführt.

| Variante | Maßnahmenkosten | Flut- und Gesamtschaden | Westlicher Modellabfluss | Relativer Bilanzfehler |
| --- | ---: | ---: | ---: | ---: |
| Drei Dämme | 1.840 | 34.792,87 | 0,01 m³ | 1,58 × 10⁻¹³ |
| Drei Dämme und Graben | 2.490 | 21.600,61 | 618,65 m³ | 1,33 × 10⁻¹⁴ |

Der Graben kostet zusätzlich 650 und vermindert den Schaden um 13.192,26; auch einschließlich der zusätzlichen Kosten bleibt eine Verbesserung um 12.542,26. Beispielsweise sinkt der Flutschaden an `w219815193-0` von 10.418 auf 4.226,32 und an `w316294474-0` von 11.056 auf 5.569,34. Beide Varianten bleiben unter dem Schadensziel und Budget; kein Abriss ist beteiligt. Die Randflusszahl ist ein integrierter Modellfluss, keine Verfolgung eines zusammenhängenden Wasseranteils. Sie belegt weder den vollständigen Weg noch die Folgen außerhalb der Karte. Die menschliche Platzierbarkeit dieser Variante ist noch nicht geprüft.

Für eine numerische Zeitprüfung führt `bun tools/compare-review-strategies.ts dam3trench --at=SEKUNDEN` alle vier Aktionen unmittelbar nacheinander zum angegebenen Zeitpunkt aus. Bei 60 s entstehen am Ende 21.600,69 Schaden; bei 120 s sind beim Eingriff bereits 187,19 eingetreten und am Ende 39.986,33. Bei 150 s stehen beim Eingriff 10.869,33 und am Ende 86.347,49 zu Buche: Das Ziel wird verfehlt. Der Budgetrest beträgt jeweils 7.510 und der relative Bilanzfehler höchstens 4,99 × 10⁻¹⁴. Dies sind idealisierte gleichzeitige Eingriffe; Auswahl, Vorschau und Bestätigung brauchen in einer menschlichen Runde Zeit. Die Zahlen legen keine allgemeine exakte Frist fest und ersetzen keine Bedienprüfung während der Flut.

Die getrennte Verschiebung eines Grabenendpunkts um eine Rasterzeile wurde nach Einführung der direkten Rasterführung mit `--trench-start-row=-1`, `--trench-start-row=1`, `--trench-end-row=-1` und `--trench-end-row=1` erneut vor Beginn untersucht. Die ersten beiden und die letzte Variante sind zulässig, kosten wegen einer zusätzlichen Zelle jeweils 675 und ergeben der Reihe nach 21.600,64, 37.617,61 und 21.537,89 Gesamtschaden. Endpunkt −1 wird abgelehnt: „Ein Gebäude versperrt den Graben. Verlauf ändern oder Gebäude abreißen.“ Die relativen Bilanzfehler der gültigen Läufe liegen unter 3,32 × 10⁻¹⁴. Die frühere rechtwinklige Rasterführung ergab andere Verläufe und Werte; die Ablehnung stammt auch jetzt aus der maßgeblichen Spielregel. Diese numerische Prüfung belegt nicht, dass die Stelle und der Hinweis auf jedem Gerät leicht zu bedienen sind.

Auch drei gerade Nachbarstrecken wurden mit denselben drei Dämmen vor der Flut geprüft. `bun tools/compare-review-strategies.ts dam3trench --route=X0,Y0,X1,Y1` setzt den jeweiligen Graben; alle Maßnahmen wurden angenommen. Zum Vergleich: Drei Dämme ohne Graben ergeben 34.792,87 Schaden und 0,01 m³ westlichen Modellabfluss; der Referenzgraben in Zeile 4 ergibt 21.600,61 Schaden und 618,65 m³.

| Graben | Grabenkosten | Budgetrest | Gesamtschaden | Westlicher Modellabfluss |
| --- | ---: | ---: | ---: | ---: |
| (0,2) → (20,2) | 525 | 7.635 | 34.792,87 | 357,26 m³ |
| (0,3) → (21,3) | 550 | 7.610 | 34.792,80 | 388,76 m³ |
| (0,5) → (25,5) | 650 | 7.510 | 37.554,89 | 549,10 m³ |

Die relativen Wasserbilanzfehler liegen unter 1,74 × 10⁻¹³. Der höhere Randabfluss dieser Gräben führt in diesen Vergleichen nicht zu einer nennenswerten Schadensreduktion; Zeile 5 erhöht den Schaden sogar um 2.762,02 gegenüber der reinen Dammvariante. Die Referenzwirkung ist damit empfindlich gegenüber der Lage. Die integrierten Randflüsse verfolgen keine Wasserteilchen und belegen keinen durchgehenden Weg; Platzierbarkeit ohne Testkoordinaten bleibt offen.

Für eine räumlich getrennte zweite Ableitung wurden drei kurze, durch Gebäude nicht versperrte Westgräben weiter südlich geprüft. `bun tools/compare-review-strategies.ts dam3trench --route=X0,Y0,X1,Y1` setzt jeweils dieselben drei Dämme und anschließend den angegebenen Graben vor Flutbeginn. Alle Aktionen wurden angenommen:

| Graben | Zusätzliche Kosten | Budgetrest | Gesamtschaden | Westlicher Modellabfluss |
| --- | ---: | ---: | ---: | ---: |
| (0,41) → (8,41) | 225 | 7.935 | 34.792,87 | 0,0071 m³ |
| (0,42) → (17,42) | 450 | 7.710 | 34.792,87 | 0,0071 m³ |
| (0,44) → (14,44) | 375 | 7.785 | 34.792,87 | 0,0071 m³ |

Die weitere Nachbarstrecke `(0,43) → (15,43)` kostet 400 und ergibt ebenfalls 34.792,87 Schaden und 0,0071 m³ Westabfluss bei 7.760 Budgetrest; ihr relativer Bilanzfehler beträgt 1,58 × 10⁻¹³.

Diese vier Werte für Schaden und Randabfluss stimmen in der Berechnung mit der Kontrolle aus drei Dämmen ohne Graben überein; die relativen Bilanzfehler liegen jeweils bei 1,58 × 10⁻¹³. Anders als der oben untersuchte Graben in Zeile 4 zeigen sie damit keine zusätzliche Schutzwirkung. Die gezielte Auswahl umfasst nur vier kurze gerade Strecken und schließt andere Platzierungen, Abrisse oder Kombinationen nicht aus. Ein zweiter wirksamer Wasserweg ist damit weiterhin nicht belegt.

### Markierter Verlauf des Landgrabens

`bun tools/trace-review-diversion.ts dam3trench --ordered` und `dam3 --ordered` vergleichen dieselben Dämme mit und ohne Graben über 300 s. Das Diagnoseprogramm markiert bisher unmarkiertes Wasser beim Eintritt in Zeile 4 über deren Nord- und Südkanten von x = 0 bis 25. Fünf Markierungsstufen erfassen, welcher Anteil danach die Kanten bei x = 20, 15, 10 und 5 in dieser Reihenfolge westwärts passiert und anschließend den Westrand verlässt. Zwischen diesen Querschnitten darf sich die Markierung auch außerhalb der Grabenzeile bewegen. Der Solver selbst wird nicht verändert.

| Größe | Mit Graben | Ohne Graben |
| --- | ---: | ---: |
| Markiert | 969,97 m³ | 932,85 m³ |
| Nach allen vier Querschnitten am Westrand ausgetreten | 618,65 m³ | 0 m³ |
| Noch im Modell markiert | 351,32 m³ | 932,84 m³ |
| Rest der geordneten Markierungsbilanz | −4,44 × 10⁻¹² m³ | −3,42 × 10⁻¹³ m³ |

Die Summe der Stufen wich lokal um höchstens 5,69 × 10⁻¹⁴ m³ von der einfachen Markierung ab. Ein erster Versuch markierte nur den westwärts gerichteten Eintritt über die östliche Kante bei (26,4): Dort trat kein markiertes Wasser ein. Er ist mit `dam3trench --ordered --east-gate` reproduzierbar; der Damm liegt auf dieser Kante. Der seitliche Eintrag ist daher für diesen Lauf die passende untersuchte Eintrittsfläche. Rusanov-Diffusion und Zellmischung erlauben keine Interpretation als reale Wasserteilchen; der offene Modellrand berechnet keine Folgen außerhalb des Ausschnitts. Auch diese Bilanz belegt nicht, dass der markierte Anteil allein die gesamte Schadensänderung verursacht.

### Sichtprobe gespeicherter Zustände

`bun tools/land-trench-snapshots.ts` berechnete die drei Dämme und den Landgraben auf `1.4-draft` bis 300 s und speicherte Zustände bei 120, 180, 240 und 300 s. Mit `bun run dev` und anschließend `bun tools/render-land-trench.mjs` wurden diese Zustände im instrumentierten Entwicklungsbrowser gerendert; der Test beendete den Worker, setzte die Solverfelder direkt in die Ansicht und blendete Bedienelemente aus. Die Kamera war auf den Landgraben vergrößert, die Dämme wurden in dieser Diagnose nicht gezeichnet. Die [Ansicht bei 240 s](landgraben-sichtprobe.png) entstand unter Linux in Chrome 156.0.8078.73 mit Softwaregrafik. Durch die eingefügten Ausgabezeitpunkte ergibt dieser Lauf 21.600,61 Gesamtschaden und 7.510 Budgetrest.

Bei 180 und 240 s ist Wasser am Graben sichtbar; die schmalen Strömungsmarker lassen sich im Einzelbild nicht zuverlässig verfolgen. Ihre Höhe wurde an die interpolierte Wasserfläche angepasst; ein durchgängig verständlicher Flutweg ist damit nicht nachgewiesen. Dies sind gerenderte numerische Einzelzustände, keine laufende Browserrunde und keine menschliche oder mobile Abnahme.

Eine anschließende Untersuchung zeigte zwei Darstellungsursachen: Grabensamples bewegten sich bis zu zehn Meter von ihrer Zelle weg; außerdem behielt das dynamische Linienmesh seine ursprüngliche Begrenzung am Ursprung und konnte beim Verschieben der Kamera ausgeblendet werden. Die Animation bleibt nun näher an der Grabenzelle, und das begrenzte Linienmesh wird unabhängig von dieser veralteten Begrenzung gerendert. Die [erneute Ansicht bei 240 s](landgraben-stroemung.png) zeigt weiße Strömungsstriche am Graben und auf dem Wasser. Sie basiert auf demselben gespeicherten numerischen Zustand und derselben instrumentierten Kamera, nicht auf einer laufenden Runde. Ein Einzelbild beweist weder die Verständlichkeit der Bewegung noch die Sichtbarkeit auf echten Geräten; das Review-Kriterium bleibt offen.

## Zeitpunkt der kombinierten Strategie

Auf dem ausgelieferten Szenario `1.4-draft` berechnet `bun tools/compare-review-strategies.ts combined --at=SEKUNDEN` die zwei Dämme, den Abriss und den Graben unmittelbar nacheinander zum angegebenen Simulationszeitpunkt. Alle vier Aktionen wurden in den folgenden Läufen angenommen; der Budgetrest betrug jeweils 6.598.

| Zeitpunkt | Gesamtschaden unmittelbar vor den Aktionen | Flutschaden am Ende | Abrissverlust | Gesamtschaden am Ende |
| --- | ---: | ---: | ---: | ---: |
| 60 s | 0 | 17.630,25 | 16.017 | 33.647,25 |
| 120 s | 187,19 | 29.767,94 | 16.017 | 45.784,94 |
| 150 s | 10.869,33 | 66.198,51 | 16.017 | 82.215,51 |

Die relativen Wasserbilanzfehler lagen unter 1,41 × 10⁻¹³. Die ersten beiden Zeitpunkte bleiben unter dem Ziel von 50.000, der dritte nicht. Der vor den Aktionen bereits verbuchte Schaden wird durch den späteren Abriss eines betroffenen Gebäudes nicht zusätzlich zum Abrissverlust gezählt. Die Eingriffe erfolgen in diesem Vergleich idealisiert ohne Bedienzeit; die Werte belegen keine genaue Frist für menschliches Spielen und keine Gerätebedienung.

## Gestaffelte Eingriffe nach vorbereiteten Dämmen

`bun tools/compare-staged-strategy.ts shield 60` und `bun tools/compare-staged-strategy.ts divert ZEIT` vergleichen die ausgelieferte Version `1.4-draft` über je 300 s. Beide Referenzdämme werden in der Vorbereitung gesetzt. Im Ableitungsfall wird das Gebäude bei `ZEIT` abgerissen und der Graben fünf simulierte Sekunden später bestätigt; der Kontrollfall enthält nur die vorbereiteten Dämme. Die Anwendung der Aktionen erfolgt mit `Game.apply`, einschließlich regulärer Validierung, Kosten und Schadenswertung.

| Abriss / Graben | Bereits eingetretener Gesamtschaden vor Abriss | Flutschaden am Ende | Abrissverlust | Gesamtschaden | Budgetrest |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kein weiterer Eingriff | – | 34.768,16 | 0 | 34.768,16 | 8.800 |
| 60 / 65 s | 0 | 17.629,93 | 16.017 | 33.646,93 | 6.598 |
| 120 / 125 s | 0 | 17.629,92 | 16.017 | 33.646,92 | 6.598 |
| 150 / 155 s | 88,83 | 17.661,02 | 16.017 | 33.678,02 | 6.598 |
| 180 / 185 s | 4.068,43 | 33.334,56 | 16.017 | 49.351,56 | 6.598 |
| 210 / 215 s | 13.408,82 | 34.159,38 | 16.017 | 50.176,38 | 6.598 |
| 240 / 245 s | 21.753,08 | 34.734,23 | 16.017 | 50.751,23 | 6.598 |
| 270 / 275 s | 29.605,28 | 34.768,16 | 16.017 | 50.785,16 | 6.598 |

Die relativen Wasserbilanzfehler liegen unter 8,6 × 10⁻¹⁴. Bei 150 / 155 s bleibt das Ziel erreicht und der Gesamtschaden um 1.090,14 unter dem Kontrolllauf; gegenüber diesem werden 2.202 zusätzliche Budgeteinheiten verbraucht. Bei 180 / 185 s ist das Ziel zwar noch erreicht, der Schaden liegt aber bereits deutlich über dem Kontrolllauf; ab 210 / 215 s wird das Ziel in diesen Versuchen verfehlt. Schäden und Budget sind getrennte Spielgrößen; ein positiver Saldo bei Addition beider Größen ist hier nicht belegt.

Das sind numerisch exakt geplante Einzelaktionen mit fünf simulierten Sekunden Abstand, keine beobachteten Bedienzeiten. Pausen, menschliche Platzierung und Unsicherheit über den tatsächlichen Verlauf wurden nicht simuliert. Die Tabelle zeigt mögliche reaktive Wirkung und ihre Grenze für diese konkrete Kombination; sie beweist weder eine allgemeine Zeitgrenze noch menschliche Spielbarkeit.

## Graben nach vorbereiteten drei Dammabschnitten

`bun tools/compare-staged-trench.ts control` und `bun tools/compare-staged-trench.ts SEKUNDEN` vergleichen auf `1.4-draft` jeweils eine vollständige unbehandelte Flut nach drei vorbereiteten Referenzdämmen. Der zweite Fall bestätigt zusätzlich den Graben (0,4)–(25,4) zum angegebenen Simulationszeitpunkt über die reguläre Aktionsprüfung. Der Kontrollfall behält die drei Dämme ohne Graben.

| Grabenzeitpunkt | Schaden vor dem Graben | Gesamtschaden am Ende | Budgetrest | Verbesserung gegenüber Kontrolle |
| --- | ---: | ---: | ---: | ---: |
| Kein Graben | – | 34.792,87 | 8.160 | – |
| Vorbereitung | 0 | 21.600,61 | 7.510 | 13.192,26 |
| 60 s | 0 | 21.600,62 | 7.510 | 13.192,25 |
| 120 s | 0 | 21.600,62 | 7.510 | 13.192,25 |
| 150 s | 88,84 | 22.515,01 | 7.510 | 12.277,86 |
| 180 s | 4.077,56 | 34.648,03 | 7.510 | 144,84 |
| 210 s | 13.423,01 | 34.821,65 | 7.510 | −28,78 |
| 240 s | 21.771,43 | 34.814,44 | 7.510 | −21,57 |

Die relativen Wasserbilanzfehler betragen höchstens 1,8 × 10⁻¹³. Der Graben kostet 650; bis zum getesteten Zeitpunkt 150 s übersteigt die Schadensminderung diese Kosten auch bei Addition der beiden getrennten Spielgrößen deutlich. Bei 180 s ist der Nutzen kleiner als die Kosten, ab 210 s verschlechtert sich das Ergebnis leicht. Alle Fälle bleiben wegen der vorbereiteten Dämme unter dem Ziel von 50.000. Die Werte zeigen einen möglichen wirtschaftlichen Eingriff während der Flut und eine zeitliche Grenze für diesen konkreten Verlauf; sie sind keine allgemeine Frist.

Der Verlauf nutzt die in der [vorherigen Untersuchung](#graben-mit-drei-dammabschnitten) beschriebenen Land- und Gewässerzellen und den offenen Modellrand als Spielannahme. Die Aktion wird numerisch zum exakten Zeitpunkt vollständig ausgeführt; Platzierung, Bestätigung, Pause und menschliche Bedienzeit sind damit nicht nachgewiesen. Folgen außerhalb des Ausschnitts werden nicht berechnet.

## Zwei direkte nördliche Gräben

Eine geometrische Suche mit `bun tools/find-northern-trenches.ts` findet auf Szenario `1.4-draft` 73 jeweils einzeln gültige direkte Landgräben mit höchstens 100 Zellen zwischen dem offenen Westrand und einer landseitigen Nachbarzelle der Gewässermaske. Die Suche untersucht nur Endpunkte in den Spalten 1–109 und Zeilen 5–109 sowie westliche Startzeilen 0–99; sie bewertet weder Wirkung noch Durchfluss. Zwei Kandidaten wurden auf Anwendungscode `b5f2a8f` vor Beginn der 300-s-Runde mit `bun tools/compare-review-strategies.ts trench --route=X0,Y0,X1,Y1` und `dam3trench --route=X0,Y0,X1,Y1` verglichen. Im zweiten Fall werden die drei damaligen Referenzdämme vorbereitet. Die unveränderte Kontrolle ohne Maßnahmen ergibt 138.852,13 Schaden und 10.000 Budgetrest; die damalige Kontrolle mit drei Dämmen 34.792,87 und 8.160.

| Graben | Kosten | Ohne Dämme: Schaden / Budgetrest | Mit drei Dämmen: Schaden / Budgetrest | Westabfluss mit Dämmen |
| --- | ---: | ---: | ---: | ---: |
| `(0,4) → (34,5)` | 900 | 120.062,95 / 9.100 | 20.609,27 / 7.260 | 520,85 m³ |
| `(0,3) → (38,11)` | 1.175 | 92.075,76 / 8.825 | 10.630,52 / 6.985 | 521,71 m³ |

Die relativen Wasserbilanzfehler liegen unter 3,20 × 10⁻¹³. Beim ersten Graben wird eine aus den Bruchlinien abgeleitete Kante abgesenkt, beim zweiten keine. Der zweite senkt gegenüber der Drei-Damm-Kontrolle den Gesamtschaden um 24.162,35 bei 1.175 zusätzlichen Budgetkosten. Im Vergleich zum ersten Kandidaten sinken unter anderem die Schäden von `r4257449-0` um 3.375,92 und von `w316294474-0` um 3.018,24. Diese Vergleiche zeigen Schutzwirkung im Spielmodell, nicht deren alleinige hydraulische Ursache; beide Trassen liegen im selben nördlichen Gebiet und sind kein Nachweis räumlich getrennter zweiter Ableitung.

Für den zweiten Graben berechnet `bun tools/trace-land-retention.ts baseline --gates=x:2250,y:10867 --trench=0,3,38,11` ohne Dämme am östlichen Endpunkt 134,56 m³ markierten landwärtigen Eintritt. Davon treten vor der ersten Rückkehr in die Gewässermaske praktisch keine markierten Mengen unmittelbar am Modellrand aus; der relative Wasserbilanzfehler beträgt 1,04 × 10⁻¹³ und der Markierungsbilanzrest −1,44 × 10⁻¹¹ m³. Die Markierung verfolgt weder andere Eintritte noch reale Wasserteilchen. Insbesondere belegt der integrierte Westabfluss keinen zusammenhängenden Weg dieser markierten Menge und der Modellrand keine sicheren Folgen außerhalb der Karte.

Ein weiterer Vergleich auf dem isolierten Stand `b5f2a8f` setzt denselben Graben erst nach drei vorbereiteten Dämmen: Bei 120, 150 beziehungsweise 180 s betragen die Gesamtschäden 10.666,06, 10.747,43 und 32.375,00; der Budgetrest ist jeweils 6.985. Die Kontrolle ohne Graben ergibt 34.792,87. Der relative Wasserbilanzfehler liegt unter 1,03 × 10⁻¹³. Die Aktion wird numerisch zum exakten Zeitpunkt gesetzt; Bedienzeit und menschliche Platzierung sind nicht geprüft. Für eine Wiederholung auf diesem historischen Stand ist die aktuelle `tools/compare-staged-trench.ts` mit `--route=0,3,38,11` in ein Archiv von `b5f2a8f` zu kopieren. Spätere Änderungen der Dammführung erfordern neue Kontrollläufe.
