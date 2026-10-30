# Gebäudevergleich der Referenzstrategien

## Aktueller Vergleich mit direkter Dammführung

**Stand:** Diese Vergleiche gelten für die direkte Dammführung und die erweiterten Referenzaktionen im aktuellen Anwendungscode.

Die Dammvorschau folgt bei schrägen Endpunkten einer direkten, verbundenen Rasterlinie. Das Szenariopaket bleibt `1.4-draft`; die geänderte Pfadregel und die erweiterten Referenzaktionen gehören zum aktuellen Anwendungscode. `bun tools/reference-strategies.ts baseline`, `shield`, `land-divert` und `divert` berechnen die folgenden 300-s-Runden mit demselben Paket; alle Maßnahmen erfolgen vor Flutbeginn.

| Variante | Flutschaden | Abrissverlust | Gesamtschaden | Budgetrest |
| --- | ---: | ---: | ---: | ---: |
| Ohne Eingriff | 138.852,13 | 0 | 138.852,13 | 10.000 |
| Zwei Dämme (`shield`) | 25.821,81 | 0 | 25.821,81 | 8.800 |
| Drei Dämme und Landgraben (`land-divert`) | 863,20 | 0 | 863,20 | 7.510 |
| Zwei Dämme, Abriss und Graben (`divert`) | 11.916,79 | 16.017 | 27.933,79 | 6.598 |

Nach Einführung anschließbarer Gräben wurden `baseline`, `shield` und `land-divert` am 29. Oktober 2026 auf einem isolierten Archiv von `42da208` mit demselben Szenariopaket erneut über 300 s gerechnet. Die drei Werte und Budgets in der Tabelle reproduzierten sich auf die angegebenen Nachkommastellen; die relativen Wasserbilanzfehler dieser Wiederholung lagen unter 2,02 × 10⁻¹³. Die ältere Kombination `divert` wurde in dieser Wiederholung nicht neu berechnet.

Die relativen Wasserbilanzfehler liegen unter 2,1 × 10⁻¹³. Die drei Dämme ohne Graben ergeben 23.574,17 Schaden bei 8.160 Budgetrest; der Landgraben kostet 650 und senkt den Schaden in diesem Kontrollvergleich um 22.710,97. Die Kombination mit Gebäudeabriss erreicht zwar weiterhin das Ziel, schneidet aber gegenüber den zwei Dämmen allein um 2.111,98 schlechter ab und kostet zusätzlich 2.202 Budgeteinheiten. Ihr Graben senkt gegenüber zwei Dämmen und Abriss ohne Graben (41.838,81) den Schaden um 13.905,02. Der separat geprüfte einzelne Abriss ohne Dämme bleibt unabhängig von der Dammführung wirtschaftlich sinnvoll; er ist unten dokumentiert. Die Schutzstrategien sind numerische Referenzen und keine menschliche Bedienprüfung. Der offene Modellrand ist eine Spielannahme, keine sichere reale Ableitung.

Bei vorbereiteten drei Dämmen senkt derselbe Graben nach 150 s den Schaden auf 1.001,29 bei 7.510 Budgetrest; ohne ihn betragen Schaden und Restbudget 23.574,17 und 8.160. Die Aktion wird numerisch zum exakten Zeitpunkt gesetzt, ohne menschliche Auswahlzeit. Einzelne Verschiebungen des ersten Dammstarts, des gemeinsamen Knickpunkts und des zweiten Endpunkts um eine Zelle wurden auf der neuen Pfadregel ebenfalls berechnet: Alle sechs geprüften Varianten waren zulässig, lagen zwischen 8.809,29 und 29.029,15 Schaden und hielten das Ziel ein. Das ist keine Garantie für beliebige Platzierungen.

### Gebäudeschäden bei direkter Dammführung

Am 30. Oktober 2026 wurden auf Anwendungscode `960e190` die vollständigen 300-s-Runden mit `bun tools/reference-strategies.ts baseline`, `shield` und `land-divert` sowie `bun tools/compare-review-strategies.ts dam3` auf demselben ausgelieferten Szenario `1.4-draft` berechnet. Die Maßnahmen wurden vor Flutbeginn gesetzt; `dam3` entspricht den drei Dämmen von `land-divert` ohne den Graben. Die Tabelle zeigt die größten im Vergleich relevanten Schäden als Spielwerte; keines dieser Gebäude wurde abgerissen.

| Gebäude | Ohne Eingriff | Zwei Dämme | Drei Dämme | Drei Dämme und Landgraben |
| --- | ---: | ---: | ---: | ---: |
| `w491428570-0` | 36.801,31 | 0 | 0 | 0 |
| `r9350494-0` | 25.180,70 | 0 | 0 | 0 |
| `r4257449-0` | 22.826,00 | 1.232,57 | 0 | 0 |
| `w33581744-0` | 15.809,35 | 0 | 0 | 0 |
| `w316294474-0` | 11.056,00 | 11.056,00 | 11.056,00 | 0 |
| `w219815193-0` | 10.418,00 | 9.168,46 | 9.171,46 | 0 |
| `w177928758-0` | 3.406,00 | 1.043,80 | 1.032,32 | 0 |
| `w501079921-0` | 1.487,00 | 1.487,00 | 1.487,00 | 0 |
| `w1193005551-0` | 1.556,00 | 826,40 | 827,39 | 863,20 |

Die zwei Dämme auf der Eintrittsseite senken den Schaden an `w491428570-0` und `r9350494-0` in diesem Vergleich auf null; mit dem dritten Damm fällt auch bei `r4257449-0` kein Schaden an. Der zusätzliche Landgraben senkt gegenüber denselben drei Dämmen den Schaden an `w316294474-0`, `w219815193-0`, `w501079921-0` und `w177928758-0` jeweils auf null. An `w1193005551-0` steigt er dagegen um 35,81. Über alle Gebäude ergibt sich durch den Graben ein Rückgang um 22.710,97 bei 650 zusätzlichen Budgetkosten. Die relativen Wasserbilanzfehler aller vier Läufe liegen unter 2,02 × 10⁻¹³.

Die Änderungen sind Ergebnisse des Gegenversuchs im Spielmodell: Der räumlich markierte Wasseranteil ist im folgenden Abschnitt beschrieben, erklärt aber nicht allein die gesamte Schadensänderung. Die Werte sind weder eine reale Schutzprognose noch ein Nachweis, dass eine Person die Maßnahmen ohne Testkoordinaten findet.

### Zeitlicher Vergleich der Gebäudebelastung

`bun tools/compare-reference-exposure.ts` berechnete am 30. Oktober 2026 auf Szenario `1.4-draft` die vier Fälle `north-control`, `land-divert`, `south-control` und `south-divert` bis 300 s. Die Maßnahmen wurden vor Flutbeginn gesetzt. Die Diagnose tastet nach dem jeweils ersten Solver-Schritt zum angegebenen Zeitpunkt ab, ohne zusätzliche Schrittgrenzen einzuführen; die tatsächlichen Zeiten weichen in diesen Stichproben um höchstens 0,08 s ab. Die Randtiefe ist die im Spielmodell für den Gebäudeschaden herangezogene maximale Wassertiefe benachbarter Zellen.

| Vergleich und Gebäude | Etwa 180 s: Randtiefe / Schaden | Etwa 210 s: Randtiefe / Schaden | Etwa 240 s: Randtiefe / Schaden | 300 s: Randtiefe / Schaden |
| --- | ---: | ---: | ---: | ---: |
| Nordkontrolle, `w316294474-0` | 0,98 m / 841,74 | 1,20 m / 3.603,91 | 0,99 m / 6.365,31 | 0,80 m / 11.056,00 |
| Nordgraben, `w316294474-0` | 0 m / 0 | 0 m / 0 | 0 m / 0 | 0 m / 0 |
| Südkontrolle, `r9350494-0` | 0 m / 0 | 0,04 m / 131,70 | 0,12 m / 5.075,53 | 0,11 m / 17.088,41 |
| Südgraben, `r9350494-0` | 0 m / 0 | 0 m / 0 | 0 m / 0 | 0 m / 0 |
| Südkontrolle, `w491428570-0` | 0 m / 0 | 0 m / 0 | 0 m / 0 | 0 m / 0 |
| Südgraben, `w491428570-0` | 0 m / 0 | 0 m / 0 | 0,24 m / 451,76 | 0,15 m / 5.531,00 |

Im Vergleich mit denselben Dämmen zeigt das nördliche Gebäude in den Stichproben der Grabenrunde eine auf 0,00 m gerundete Randtiefe; im südlichen Vergleich zeigt sich die Schadensverlagerung zeitlich zwischen den beiden Gebäuden. Die Stichproben sind keine ununterbrochene Sichtprüfung; auf zwei Dezimalstellen gerundete Tiefen können sehr kleine Werte verbergen. Die vier Endergebnisse reproduzieren die Referenzvergleiche, die relativen Wasserbilanzfehler liegen unter 1,50 × 10⁻¹³. Zwischen den nördlichen und südlichen Fällen unterscheiden sich die Dammführungen; nur Kontrolle und Grabenfall innerhalb derselben Strategie sind direkt vergleichbar. Die Ergebnisse belegen keine reale Schutzwirkung oder alleinige hydraulische Ursache.

### Markierter Landgraben mit direkten Dämmen

Auf Anwendungscode `f291cc9` vergleichen `bun tools/trace-review-diversion.ts dam3 --ordered` und `dam3trench --ordered` die drei direkten Dämme mit und ohne den Landgraben `(0,4) → (25,4)`. Die Diagnose markiert unmarkiertes Wasser beim Eintritt über die Nord- und Südkanten der Grabenzeile. Fünf Stufen zählen anschließend die westwärts in Reihenfolge überquerten Querschnitte bei x = 20, 15, 10 und 5 sowie den Austritt am Westrand. Zwischen den Querschnitten kann sich die Markierung auch außerhalb der Grabenzeile bewegen.

| Größe | Drei Dämme | Drei Dämme und Graben |
| --- | ---: | ---: |
| Markierter Eintritt | 586,81 m³ | 598,89 m³ |
| Nach allen vier Querschnitten am Westrand ausgetreten | 0 m³ | 318,39 m³ |
| Im Modell verblieben | 586,81 m³ | 280,51 m³ |
| Gesamtschaden | 23.574,17 | 863,20 |

Die Markierungsbilanzreste liegen betragsmäßig unter 2,73 × 10⁻¹² m³ und die relativen Wasserbilanzfehler unter 9,90 × 10⁻¹⁴. Damit ist ein geordneter Modellanteil für diesen Graben auch mit der neuen Dammführung nachgewiesen. Zellmischung und numerische Diffusion erlauben keine Interpretation als reale Wasserteilchen; der Vergleich beweist nicht, dass dieser Anteil allein die Schadensdifferenz verursacht. Wasser jenseits des offenen Modellrands und menschliche Bedienung wurden nicht geprüft.

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

### Wiederholung mit direkter Dammführung

Die Kandidaten wurden mit der später übernommenen direkten Dammführung erneut verglichen. Die Rechnung verwendete ein Archiv von `efde9e3` und die anschließend in `2851271` übernommene Datei `src/simulation/path.ts` (SHA-256 `d40c1c29509caee918288f537064c3ed0168534dd2868505ac07f422a127c4b9`); Solver, Spielregeln, Szenario und Dammfixture waren gegenüber `f291cc9` unverändert. Alle Maßnahmen wurden über `Game.apply` geprüft.

| Fall | Gesamtschaden | Budgetrest |
| --- | ---: | ---: |
| Drei Dämme, kein Graben | 23.574,17 | 8.160 |
| Drei Dämme, Graben `(0,4) → (34,5)` vor Beginn | 780,49 | 7.260 |
| Drei Dämme, Graben `(0,3) → (38,11)` vor Beginn | 808,69 | 6.985 |
| Dieselben Dämme, zweiter Graben bei 150 s | 816,02 | 6.985 |
| Dieselben Dämme, zweiter Graben bei 180 s | 21.034,08 | 6.985 |

Die relativen Wasserbilanzfehler liegen unter 3,21 × 10⁻¹³. Auch bei 180 s liegt die rechnerische Schadensminderung von 2.540,09 über den zusätzlichen Grabenkosten von 1.175, sofern beide Spielgrößen addiert werden. Die Eingriffe erfolgen idealisiert zum exakten Zeitpunkt; menschliche Bedienung und Geräteabnahme fehlen. Die Trassen liegen im selben nördlichen Bereich und belegen keine räumlich getrennte zweite Ableitung.

Die ergänzte Option `--dams=3` von `tools/trace-land-retention.ts` erlaubt dieselbe Dammkonfiguration in einer Markierungsrechnung. Mit `--gates=x:2250,y:10867` wurden der Kontrollfall und der zusätzliche Graben `--trench=0,3,38,11` verglichen. An der östlichen Endkante `x:2250` betrug der markierte landwärtige Eintritt ohne Graben 0 und mit Graben 134,21 m³. Der mit Graben markierte Anteil kehrte bis auf 0,00022 m³ in die Gewässermaske zurück; kein markierter Anteil trat vorher am Modellrand aus. Der betreffende Markierungsbilanzrest war −2,27 × 10⁻¹¹ m³. Die Rechnung verfolgt nur diese beiden Eingänge, nicht sämtliche Wasserwege oder reale Wasserteilchen. Sie erklärt die Schadensminderung nicht vollständig und belegt keinen durchgehenden Fluss dieser Markierung zum Rand.

### Seitlicher Eintritt und geordnete Querungen

`bun tools/trace-northern-route.ts control` und `trench` vergleichen dieselben drei direkten Referenzdämme ohne und mit dem Graben `(0,3) → (38,11)`. Die Berechnung markiert bisher unmarkiertes Wasser, das von einer Nicht-Trassenzelle in eine der östlichen Grabenzellen mit `x ≥ 30` eintritt. Eine Markierung wird entfernt und als Rückkehr bilanziert, sobald sie die Gewässermaske betritt. Fünf Stufen erfassen, welcher markierte Anteil anschließend die Trassenkanten bei `x = 30, 20, 10, 5` in dieser Reihenfolge westwärts quert und danach am Westrand austritt. Zwischen diesen Kanten darf sich der Anteil auch außerhalb der Trasse bewegen; der Austritt kann an jeder Zelle des Westrands erfolgen.

| Fall | Insgesamt markierte Eintritte | Rückkehr ins Gewässer | Noch im Modell | Nach allen vier Kanten am Westrand ausgetreten | Gesamtschaden |
| --- | ---: | ---: | ---: | ---: | ---: |
| Drei Dämme, kein Graben | 24.442,14 m³ | 24.360,01 m³ | 82,13 m³ | 0 m³ | 23.574,17 |
| Drei Dämme und Graben | 27.651,49 m³ | 27.578,04 m³ | 73,45 m³ | 0 m³ | 808,69 |

Die Markierungsbilanzreste liegen betragsmäßig unter 4,43 × 10⁻⁹ m³, die relativen Wasserbilanzfehler unter 1,52 × 10⁻¹³. In beiden Fällen enthält die erste erreichte Querschnittsstufe am Rundenende weniger als 0,27 m³; in späteren Stufen ist kein Anteil verblieben. Nach Rückkehr ins Gewässer kann Wasser erneut eintreten und erneut markiert werden; die markierten Eintritte sind deshalb keine Menge eindeutig unterscheidbarer Wasserteilchen. Der Versuch zeigt für diese Eintrittsregion und diese vier Trassenkanten keinen geordneten Modellanteil bis zum Rand. Andere Eintrittsregionen oder Wege sind damit nicht ausgeschlossen; die Modellrechnung erklärt die deutliche Schutzwirkung des Grabens weiterhin nicht vollständig und ist keine reale Flussprognose.

### Gebäudewirkung und gespeicherte Wassermenge

`bun tools/compare-northern-exposure.ts control` und `trench` vergleichen den Graben `(0,3) → (38,11)` nach denselben drei vorbereiteten direkten Dämmen. Beide Läufe verwenden `1.4-draft`, vollständige 300 s und die reguläre Gebäude- und Aktionslogik. Für die Stichproben werden Schritte bei den angegebenen Zeitpunkten begrenzt; dadurch entstehen geringe Rundungs- und Zeitschrittunterschiede zu anderen Läufen. Das Grabenvolumen ist die zum jeweiligen Zeitpunkt in allen 47 Zellen der Trasse enthaltene Wassermenge, keine zu- oder abgeflossene Gesamtmenge.

| Simulationszeit | Gesamtschaden ohne / mit Graben | Wasser in den Trassenzellen ohne / mit Graben |
| --- | ---: | ---: |
| 120 s | 0 / 0 | 326,00 / 821,29 m³ |
| 150 s | 35,00 / 29,87 | 696,82 / 1.420,30 m³ |
| 180 s | 1.610,09 / 415,58 | 644,51 / 1.594,28 m³ |
| 210 s | 7.388,56 / 666,76 | 501,64 / 1.596,63 m³ |
| 240 s | 13.414,32 / 750,52 | 259,03 / 1.190,00 m³ |
| 300 s | 23.574,17 / 808,69 | 77,67 / 474,35 m³ |

Für `w316294474-0` beträgt die modellierte maximale Randtiefe bei 180, 210 und 240 s ohne Graben 0,98, 1,20 und 0,99 m, mit Graben in allen drei Stichproben 0 m. Bei `w219815193-0` sind es 0,19, 1,20 und 0,95 m ohne sowie jeweils 0 m mit Graben. Am Rundenende beträgt der Flutschaden dieser Gebäude ohne Graben 11.056 beziehungsweise 9.171,46, mit Graben jeweils 0. Die relativen Wasserbilanzfehler beider Läufe liegen unter 7,06 × 10⁻¹⁴.

Die [Kontrollansicht](nordgraben-kontrolle-210.png) und die [Ansicht mit Graben](nordgraben-mit-210.png) zeigen dieselben berechneten Zustände bei 210 s mit drei Dämmen. Sie wurden aus gespeicherten Solverzuständen mit dem tatsächlichen Renderer von `cddc66f` in Headless-Chromium 156.0.8078.4 unter Linux erzeugt; Menü und Quellen sind für diesen Bildvergleich ausgeblendet und die Kamera testseitig auf den nördlichen Bereich gerichtet. Im Kontrollbild sind Gebäude mit Schaden farblich hervorgehoben; im Grabenbild bleiben dieselben Gebäude unbeschädigt. Die Bilder sind keine vollständige Browserrunde oder menschliche Bedienprüfung. Wiederholung: je Fall `bun tools/compare-northern-exposure.ts FALL --snapshot=/tmp/wf-north-210-FALL.json`, danach `node tools/render-northern-exposure.mjs` gegen einen Vite-Entwicklungsserver des genannten Rendererstands auf Port 5198.

Der erhöhte Wasserinhalt im Graben ist mit einer Speicherwirkung vereinbar, beweist aber nicht, dass diese allein die Schadensminderung verursacht. Die Stichproben zeigen keine lückenlose Zeitreihe und die Bilder keine geordnete Durchleitung zum offenen Modellrand. Die Modellannahme berechnet keine Folgen jenseits des Ausschnitts und ist keine reale Gefahrenbewertung.

### Eintritt im mittleren Abschnitt des Nordgrabens

Eine zweite Markierung betrachtet seitliche Eintritte in Trassenzellen mit `x = 20…29`. `bun tools/trace-northern-route.ts control --entry=20,29` und `trench --entry=20,29` setzen jeweils drei direkte Referenzdämme; nur der zweite Lauf gräbt `(0,3) → (38,11)`. Die Markierung folgt derselben Bilanzregel wie oben: Wasser wird beim Eintritt aus einer Nicht-Trassenzelle markiert und beim Rückfluss in die Gewässermaske entfernt. Drei Stufen verlangen westwärts gerichtete Querungen der **Trassenkanten** bei `x = 20, 10, 5` in dieser Reihenfolge vor dem Austritt am Westrand.

| Fall | Markierte Eintritte | Rückkehr ins Gewässer | Nach allen drei Kanten am Westrand ausgetreten | Noch im Modell |
| --- | ---: | ---: | ---: | ---: |
| Drei Dämme, kein Graben | 5.006,21 m³ | 4.261,90 m³ | 0 m³ | 744,31 m³ |
| Drei Dämme und Graben | 5.936,30 m³ | 5.208,24 m³ | 198,49 m³ | 529,58 m³ |

Die Markierungsbilanzreste betragen höchstens 2,98 × 10⁻¹⁰ m³, die relativen Wasserbilanzfehler höchstens 1,52 × 10⁻¹³. Der Kontrolllauf endet mit 23.574,17 Schaden, die Grabenrunde mit 808,69. Dieser Versuch belegt einen geordneten **Modellanteil ab dem mittleren Trassenabschnitt**, nicht vom östlichen Eintritt und nicht zwingend entlang jeder dazwischenliegenden Zelle. Zwischen den drei Querschnitten kann sich die Markierung außerhalb der Trasse bewegen. Nach Rückkehr in die Gewässermaske kann dieselbe Modellmenge erneut markiert werden; die Summe der Eintritte zählt daher keine eindeutigen Wasserteilchen. Die Rechnung belegt weder allein die Ursache der Schadensminderung noch reale Folgen jenseits des offenen Modellrands.

### Weiter östlicher Eintritt und Verhältnis der zwei Trassen

Die Markierungsrechnung wurde mit `--entry=25,29 --sections=25,20,10,5` für beide Fälle wiederholt. Seitlich in Trassenzellen `x = 25…29` eintretende Modellmengen müssen dabei die vier genannten Trassenkanten westwärts in dieser Reihenfolge passieren, bevor ihr Austritt am Westrand gezählt wird; bei Rückkehr in die Gewässermaske endet die Markierung.

| Fall | Markierte Eintritte | Rückkehr ins Gewässer | Nach vier Kanten am Westrand ausgetreten | Noch im Modell |
| --- | ---: | ---: | ---: | ---: |
| Drei Dämme, kein Graben | 4.567,40 m³ | 4.261,90 m³ | 0 m³ | 305,50 m³ |
| Drei Dämme und diagonaler Graben | 5.531,12 m³ | 5.208,24 m³ | 22,85 m³ | 299,23 m³ |

Die Markierungsbilanzreste liegen betragsmäßig unter 3,39 × 10⁻¹⁰ m³, die relativen Wasserbilanzfehler unter 1,52 × 10⁻¹³. Die Berechnung belegt diesen geordneten Modellanteil ab dem betrachteten mittleren bis östlichen Teil der Trasse; zwischen den Kanten kann er sich außerhalb des Grabens bewegen. Sie belegt keinen Durchgang vom östlichsten Eingang, keine eindeutig unterscheidbaren Wasserteilchen und keine realen Folgen außerhalb des Modells. Wiederholte Markierung nach Rückkehr ins Gewässer ist möglich.

`bun tools/compare-diversion-paths.ts` vergleicht den früheren Landgraben `(0,4) → (25,4)` mit dem diagonalen Graben `(0,3) → (38,11)`. Die 26 beziehungsweise 47 Zellen umfassenden Trassen teilen die sechs Zellen `(2,4)` bis `(7,4)`. Bei vorbereiteten drei Dämmen ist jede für sich zulässig. Früher lehnte der Worker die zweite Trasse wegen bereits gegrabener Zellen ab. Seit der Anschlussregel kann er sie in beiden Reihenfolgen bestätigen: Die sechs gemeinsamen Zellen werden weder erneut vertieft noch bezahlt. Die Trassen besitzen weiterhin einen gemeinsamen Abschnitt und sind keine vollständig getrennten Wege. Das sagt nichts über andere mögliche Trassen oder eine reale Ableitung aus.

### Verbundene Nordgräben

Der Worker akzeptiert eine Grabenaktion, die bereits ausgehobene Zellen enthält, wenn sie mindestens eine neue zulässige Zelle umfasst. Die Vorschau nennt die Zahl der vorhandenen Zellen; nur neue Zellen kosten Budget und werden vertieft. Ein vollständig vorhandener Verlauf wird weiterhin abgelehnt. Bestehende Gebäudesperren, zusammenhängende Wege und Budgetprüfungen gelten für die gesamte Aktion.

`bun tools/compare-connected-diversions.ts both` und `both-reverse` setzen nach denselben drei Referenzdämmen beide untersuchten Nordgräben in jeweils unterschiedlicher Reihenfolge vor Flutbeginn. Beide Läufe übernehmen dieselben sechs Zellen, erhalten das Wasser unmittelbar beim Bauen und enden nach 300 s mit 845,36 Gesamtschaden und 6.485 Budgetrest; der relative Wasserbilanzfehler beträgt 1,51 × 10⁻¹³. Der diagonale Graben allein ergab 808,69 Schaden bei 6.985 Budgetrest. Der zusätzliche Graben verbessert diese konkrete Runde somit nicht. Der gemeinsame Abschnitt belegt keine räumlich getrennten Wasserwege und die Modellränder keine real sichere Ableitung.

Regeltests prüfen Vorschau ohne Zustandsänderung, die einmalige Belastung und Vertiefung, doppelte Aktionskennungen, Wassererhaltung sowie atomare Ablehnung bei einem Gebäude. Ein Worker-Test prüft den Anschluss bei laufender Flut; eine gezielte Chromium-Prüfung bestätigt Kostenhinweis und Budget über die Oberfläche. Eine vollständige Browser- und Geräteabnahme steht noch aus.


## Getrennter südlicher Graben mit Dammöffnung

Ein weiterer Kandidat verwendet auf `1.4-draft` drei Dammabschnitte `(26,0) → (26,10)`, `(26,10) → (34,20)` und `(36,20) → (42,30)` sowie den Graben `(0,46) → (47,26)`. Die letzten beiden Dammabschnitte lassen zwischen ihren Endpunkten zwei Rasterzellen beziehungsweise 8 m Abstand. Der 68 Zellen lange Graben teilt keine Zelle mit dem nördlichen Referenzgraben `(0,4) → (25,4)`; er senkt fünf modellierte Geländekanten ab. Alle Aktionen wurden über die Spielregeln bestätigt, und die Szenarioparameter blieben unverändert.

| Fall | Gesamtschaden | Budgetrest |
| --- | ---: | ---: |
| Ohne Maßnahmen | 138.852,13 | 10.000 |
| Drei Dämme mit Öffnung, ohne Graben (`south-control`) | 49.972,85 | 8.240 |
| Dieselben Dämme und südlicher Graben (`south-divert`) | 38.070,94 | 6.540 |

Die Dämme kosten zusammen 1.760, der Graben zusätzlich 1.700. Gegenüber derselben Dammkontrolle senkt der Graben den Gesamtschaden um 11.901,91; nach Addition seiner Kosten beträgt der rechnerische Vorteil 10.201,91. Beide Kombinationen halten Budget und Schadensziel von 50.000 ein; die Kontrolle liegt nur 27,15 unter dem Ziel. Ohne Dämme senkt derselbe Graben den Schaden um 3.961,10, verfehlt aber allein das Ziel: [Vergleich](geodaten-voruntersuchung.md#südlicher-westgraben-ohne-und-mit-referenzdämmen). Nachrechnen: `bun tools/reference-strategies.ts south-control` und `south-divert`. Die relativen Wasserbilanzfehler der Kontroll- und Grabenrunde betragen 1,49 × 10⁻¹³ beziehungsweise 1,38 × 10⁻¹³.

#### Gegenversuch mit geschlossenem Westrand

Am 30. Oktober 2026 wurden `south-control` und `south-divert` auf demselben `1.4-draft` nochmals mit offenem sowie ausschließlich im Speicher geschlossenem westlichem Modellrand verglichen. `bun tools/reference-strategies.ts south-control --closed-west` beziehungsweise `south-divert --closed-west` entfernt die linke offene Randbedingung; die beiden Vergleichsläufe ohne diese Option verwenden das ausgelieferte Szenario. Die übrigen Randbedingungen und Maßnahmen bleiben gleich; alle Maßnahmen erfolgen vor Flutbeginn.

| Modellrand | Kontrolle: Schaden / Budgetrest | Südlicher Graben: Schaden / Budgetrest |
| --- | ---: | ---: |
| West offen | 49.972,85 / 8.240 | 38.070,94 / 6.540 |
| West geschlossen | 49.972,85 / 8.240 | 38.083,44 / 6.540 |

Der Kontrollschaden ist in beiden Randvarianten auch vor Rundung identisch; beim Graben erhöht das Schließen des Randes ihn um 12,50. Die Schadensminderung des Grabens gegenüber denselben Dämmen beträgt bei geschlossenem Rand 11.889,41 und übersteigt weiterhin die Kosten von 1.700. Alle vier relativen Wasserbilanzfehler liegen unter `1,50 × 10⁻¹³`; die Typprüfung bestand. Die globalen Abflusswerte umfassen alle offenen Ränder und sind keine gesonderte Messung des Westrandflusses.

In dieser vorbereiteten Kombination ist der modellierte Schadensnutzen somit nicht überwiegend durch das Öffnen des Westrands erklärt. Der Gegenversuch bestimmt nicht allein, ob Speicherung, Verlagerung, abgesenkte Kanten oder andere Effekte den Unterschied verursachen; er belegt auch keine reale Ableitung außerhalb der Karte und gilt nicht automatisch für spätere Eingriffszeitpunkte.

#### Gegenversuch mit erhaltenen Geländekanten

Am 30. Oktober 2026 wurde die vorbereitete südliche Referenzstrategie mit `bun tools/compare-review-strategies.ts dam3trench --tip=-2 --route=0,46,47,26` nachgerechnet. Die reguläre Grabenaktion senkt fünf aus Bruchlinien abgeleitete Modellkanten und ergibt 38.070,94 Gesamtschaden bei 6.540 Budgetrest. Im Gegenversuch stellt die zusätzliche Option `--retain-crests` unmittelbar nach der regulären Aktion die ursprünglichen Höhen dieser geschnittenen Kanten wieder her. Dies ist eine numerische Diagnose, keine im Spiel verfügbare Maßnahme; Kosten und Grabenbett bleiben unverändert.

Mit erhaltenen Kanten beträgt der Schaden 32.571,27 bei demselben Budgetrest, also 5.499,67 weniger als mit regulär abgesenkten Kanten. Der modellierte Schaden von `w491428570-0` sinkt dabei von 5.531,00 auf 0 und jener von `w1184608697-0` von 857,29 auf 0; bei `w1343275154-0` steigt er zugleich von 3.584,97 auf 4.344,36. Der westliche Randabfluss beträgt 14,71 m³ beziehungsweise 0 m³. Die relativen Wasserbilanzfehler liegen unter `1,38 × 10⁻¹³`.

Das gemeinsame Erhalten der fünf Kanten verändert die Verteilung und verbessert diese konkrete Grabenrunde gegenüber der regulären Aktion; die einzelnen Kanten werden dadurch nicht voneinander isoliert. Auch dieser Gegenversuch beweist weder die reale Funktion der aus DGM-Bruchlinien abgeleiteten Kanten noch die vollständige Ursache des Grabennutzens gegenüber der Dammkontrolle.

Der Schaden verteilt sich im Modell um: `r9350494-0` sinkt von 17.088,41 auf 0, während `w491428570-0` von 0 auf 5.531,00 steigt. Die Differenz erklärt nicht allein die hydraulische Ursache und ist keine reale Gebäuderisikobewertung.

Bei vorbereiteten Dämmen und einem idealisierten Grabeneingriff nach 120, 150 beziehungsweise 180 s enden die Runden mit 37.915,18, 37.797,06 beziehungsweise 32.659,38 Schaden und jeweils 6.540 Budgetrest. Die jeweils entstehende Schadensminderung gegenüber der unveränderten Dammkontrolle übersteigt die Grabenkosten. Beispiel: `bun tools/compare-staged-trench.ts 150 --tip=-2 --route=0,46,47,26`. Die Aktion erfolgt dabei exakt zum angegebenen Zeitpunkt; Auswahl und Bestätigung brauchen in einer menschlichen Runde zusätzliche Zeit.

Die Lage ist empfindlich: Wird nur das östliche Grabenende um eine Zeile nach `(47,25)` verschoben, ergeben sich 42.332,33 Schaden und 6.515 Budgetrest; bei `(47,27)` steigen die Schäden auf 222.183,14. Die westlichen Startpunkte `(0,45)` und `(0,47)` werden wegen eines Gebäudes abgelehnt. Eine Verschiebung des zweiten Dammendes von `(34,20)` nach `(35,20)` ergibt mit diesem Graben 28.288,56 Schaden, aber der zusätzliche Graben spart gegenüber seiner Dammkontrolle nur 1.156,56 und damit weniger als seine Kosten. Bei `(33,20)` entstehen 65.487,26 Schaden und das Ziel wird verfehlt. Diese einzelnen Varianten sind keine Garantie für andere Platzierungen.

`bun tools/trace-northern-route.ts control --dams=3 --tip=-2 --route=0,46,47,26 --entry=30,47` und der entsprechende Fall `trench` markieren seitliche Eintritte im östlichen Trassenbereich. Für einen gezählten Austritt muss die Markierung die Trassenkanten bei x = 30, 20, 10 und 5 in dieser Reihenfolge westwärts passieren, bevor sie am Westrand austritt; bei Rückkehr in die Gewässermaske endet die Markierung. Die Kontrolle zeigt 0 m³ solchen Austritt, der Graben 14,55 m³. Die absoluten Markierungsbilanzreste liegen unter 4,84 × 10⁻¹⁰ m³ und die relativen Wasserbilanzfehler unter 1,50 × 10⁻¹³. Die Markierung kann zwischen den Querschnitten die Trasse verlassen und zählt den gesamten Westrand; ein überall getrennter Wasserweg oder eine reale sichere Ableitung ist damit nicht bewiesen. Auch die Ursache der gesamten Schadensdifferenz ist damit nicht isoliert.

Eine vollständige Produktionsrunde des isolierten Anwendungscodes `42da208` wurde mit `bun tools/observe-south-production.mjs` in Chrome 156.0.8078.73 unter Linux bei 1600 × 1000 und Softwaregrafik ausgeführt. Die Worker-Vorschau wurde für jede Maßnahme mit den Referenzkanten beziehungsweise -zellen verglichen; die projizierten Testkoordinaten sind in `tests/fixtures/south-screen-points.json` festgehalten. Nach 151,712 s bei 2× meldete die Oberfläche 38.064 Schaden, 6.540 Budgetrest und „Schadensziel erreicht“, ohne protokollierte Seitenfehler. Der Neustart setzte Zeit, Budget und Schaden zurück. Der Browser- und der numerische Vergleich sind getrennte Läufe; die Ursache ihrer geringfügigen Abweichung wurde nicht eigens untersucht. Dies ist keine menschliche Bedienprüfung. Eine unabhängige Person und echte Mobilgeräte bleiben offen.


### Gebäudeschäden entlang der südlichen Strategie

Am 30. Oktober 2026 wurden auf Anwendungscode `15722aa` die 300-s-Runden mit `bun tools/reference-strategies.ts south-control` und `south-divert` erneut berechnet; die unbehandelte Vergleichsrunde stammt aus dem gleichartigen Lauf auf `960e190`. Beide verwenden dasselbe ausgelieferte Szenario `1.4-draft`, und alle Maßnahmen wurden vor Flutbeginn gesetzt. Die Tabelle zeigt Gebäude mit den größten Veränderungen durch den zusätzlichen Graben; keines wurde abgerissen.

| Gebäude | Ohne Eingriff | Drei Dämme mit Öffnung | Dieselben Dämme und südlicher Graben |
| --- | ---: | ---: | ---: |
| `r9350494-0` | 25.180,70 | 17.088,41 | 0 |
| `w491428570-0` | 36.801,31 | 0 | 5.531,00 |
| `w1343275154-0` | 8.754,22 | 4.613,56 | 3.584,97 |
| `w1184608697-0` | 0 | 0 | 857,29 |
| `w316294475-0` | 1.502,63 | 1.525,15 | 1.349,84 |

Der zusätzliche Graben beseitigt den modellierten Schaden an `r9350494-0` und verringert ihn an `w1343275154-0`; zugleich entstehen an `w491428570-0` und `w1184608697-0` zusätzliche Schäden. Über alle Gebäude zusammen sinkt der Schaden um 11.901,91 bei 1.700 zusätzlichen Budgetkosten. Die relativen Wasserbilanzfehler der beiden südlichen Läufe liegen unter 1,50 × 10⁻¹³.

Die Werte zeigen eine räumliche Verlagerung im Spielmodell. Der oben beschriebene markierte Modellanteil allein erklärt nicht die gesamte Schadensdifferenz; reale Schutzwirkung und menschliches Auffinden der Route sind nicht belegt.

### Südlicher Graben nach Flutbeginn im Produktionsbrowser

Auf dem isolierten Produktionsbuild von `833f4b6` wurden die drei Dämme mit Öffnung in der Vorbereitung gesetzt. `bun tools/observe-south-production.mjs --after-flood` startete die Flut mit 2× und pausierte bei angezeigten 02:34. Die automatisierte Auswahl prüfte die Worker-Vorschau gegen die vollständige Referenztrasse und verwarf unpassende Vorschauen. Der erste Punkt traf mit den vorbereiteten Testkoordinaten, der zweite nach Verschiebung um zwei Bildpunkte nach oben. Die bestätigte Aktion kostete 1.700; die Vorschau wies auf fünf abgesenkte Modellkanten hin. Während der Pause blieb die angezeigte Zeit stehen.

Nach Fortsetzen meldete Chrome 156.0.8078.73 unter Linux bei 1600 × 1000 und Softwaregrafik **37.728 Gesamtschaden**, keinen Abrissverlust und 6.540 Budgetrest. Die vollständige Runde einschließlich der Testsuche dauerte 209,401 s und endete ohne protokollierte Seitenfehler; der anschließende Neustart setzte Zeit, Budget und Schaden zurück. Die separate numerische Kontrolle ohne Graben ergibt 49.972,85 Schaden bei 8.240 Budgetrest. Unterschiedliche Schritt- und Eingriffszeitpunkte begrenzen die Genauigkeit des Vergleichs. Die Testkoordinaten und die automatische Suche ersetzen keine menschliche Platzierung oder Abnahme auf einem echten Gerät.

### Markierung innerhalb zweier getrennter Grabentrassen

Die Diagnose `tools/trace-northern-route.ts` bietet zusätzlich `--stay-on-route`: Eine Markierung endet, sobald sie eine Zelle außerhalb der gewählten Grabentrasse erreicht; die so ausgetretene Menge wird gesondert bilanziert. Eine Rückkehr in die Gewässermaske beendet die Markierung ebenfalls. Dadurch zählt der geordnete Randaustritt nur Anteile, die ab dem markierten seitlichen Eintritt bis zum Modellrand innerhalb der Trassenzellen verbleiben. Die Ergebnisse gelten jeweils für eine eigene 300-s-Runde auf dem Szenario `1.4-draft`; die Wege wurden nicht gleichzeitig gebaut.

| Vergleich | Eintrittsbereich x | Markierter Eintritt | Geordneter Austritt am Westrand | Austrittszeile |
| --- | ---: | ---: | ---: | ---: |
| Nördliche Dammkontrolle, kein Graben | 20–25 | 586,81 m³ | 0 m³ | – |
| Drei Referenzdämme und nördlicher Graben `(0,4) → (25,4)` | 20–25 | 598,89 m³ | 318,39 m³ | 4 |
| Südliche Dammkontrolle mit Öffnung, kein Graben | 30–47 | 15.289,07 m³ | 0 m³ | – |
| Dämme mit Öffnung und südlicher Graben `(0,46) → (47,26)` | 30–47 | 18.440,75 m³ | 7,42 m³ | 46 |

In den Kontrollläufen verlassen 584,97 beziehungsweise 12.035,88 m³ die angenommene Trasse vor dem Abschluss; im südlichen Grabenlauf sind es 10.191,06 m³. Rückkehr in die Gewässermaske wird getrennt erfasst. Die Markierungsbilanzreste liegen betragsmäßig unter 2,22 × 10⁻¹⁰ m³, die relativen Wasserbilanzfehler unter 1,50 × 10⁻¹³. Die Diagnose prüft zusätzlich, dass bei dieser Option keine Markierung außerhalb der Trasse verbleibt; der südliche Grabenlauf wurde damit erneut erfolgreich ausgeführt. Die beiden Grabentrassen teilen keine Zelle; ihre erfassten Austrittszeilen liegen 42 Rasterzeilen beziehungsweise 168 m auseinander.

Wiederholung mit dem jeweils genannten Fall `control` oder `trench`: `bun tools/trace-northern-route.ts FALL --dams=3 --tip=0 --route=0,4,25,4 --entry=20,25 --stay-on-route` für den nördlichen Weg und `bun tools/trace-northern-route.ts FALL --dams=3 --tip=-2 --route=0,46,47,26 --entry=30,47 --stay-on-route` für den südlichen. Die erfolgreiche nördliche und südliche Strategie unterscheiden sich in ihrer Dammkonfiguration; die Kontrollläufe verwenden jeweils dieselben Dämme ohne Graben.

Die Markierung verwendet numerische Zellmischung und Diffusion, keine Verfolgung realer Wasserteilchen. Wasser kann nach Verlust der Markierung erneut eintreten und erneut gezählt werden. Die Rechnung belegt diese Modellanteile ab den angegebenen Eintrittsbereichen bis zu unterschiedlichen Austrittszellen, nicht den gesamten Weg vom Flusszufluss, die alleinige Ursache der Schadensminderung oder Folgen außerhalb des Modellrands. Menschliche Platzierung, durchgehende Sichtbarkeit und echte Geräte bleiben offen.

### Einzelabriss in einer erfolgreichen Strategie

Auf Szenario `1.4-draft` bereitet `bun tools/compare-partial-diversion.ts 7 control --guard-radius=2` drei Dämme vor: `(26,0) → (26,10)`, `(26,10) → (33,17)` und `(41,28) → (46,28)`. Ohne Abriss endet die Runde mit 47.918,99 Flutschaden und 8.840 Budgetrest. Mit `--demolish=w316294474-0` wird dieses Gebäude vor Flutbeginn für 1.106 abgerissen; die Runde endet mit 30.352,37 Flutschaden und 11.056 Abrissverlust, insgesamt 41.408,37 bei 7.734 Budgetrest. Das Ziel wird in beiden Fällen erreicht. Der Abriss senkt den Gesamtschaden um 6.510,61 und damit um mehr als seine Budgetkosten; der Abrissverlust wird einmal gezählt.

`--buildings` zeigt den Vergleich der Einzelgebäude: Das abgerissene Gebäude wäre in der Kontrolle mit seinem vollständigen Wert von 11.056 durch Flut geschädigt worden und zählt nach Abriss ebenfalls mit 11.056. Der Schaden von `r9350494-0` sinkt um 7.974,26 und jener von `w219815193-0` um 3.537,29; bei `w1343275154-0` steigt er um 5.662,43. Die Werte beschreiben die Modellwirkung, isolieren aber keine einzelne Ursache.

Mit `--demolish-at=120`, `150` beziehungsweise `180` wird derselbe Abriss während der Flut idealisiert zum jeweiligen Zeitpunkt ausgeführt. Der Gesamtschaden beträgt 41.408,37, 41.408,36 beziehungsweise 41.970,88 bei jeweils 7.734 Budgetrest. Alle drei Varianten erreichen das Ziel und vermindern den Schaden gegenüber der Kontrolle um mehr als die Abrisskosten. Bei 180 s hat das Gebäude bereits 1.339,31 Flutschaden und 0,97 m maximale Wassertiefe an seinen Nachbarzellen; nach Abriss zählt es ausschließlich mit dem vollen Abrissverlust von 11.056. Das gesamte Wasservolumen unmittelbar vor und nach dem Abriss ist gleich. Die relativen Wasserbilanzfehler der vier Abrissläufe liegen unter 1,76 × 10⁻¹³.

Wird zusätzlich der getrennte Westgraben bei 180 s angelegt, beträgt der Gesamtschaden mit vorab ausgeführtem Abriss 37.702,84 bei 6.034 Budgetrest; ohne Abriss sind es 36.235,49 bei 7.140. In dieser Kombination ist der Abriss nicht wirtschaftlich vorteilhaft. Die Eingriffszeiten und die Gebäudeauswahl sind idealisiert; menschliche Platzierung, reale Geräte und eine reale Schutzwirkung sind nicht nachgewiesen.

### Wasserbilanz am später abgerissenen Gebäude

`bun tools/probe-demolition-flow.ts baseline w316294474-0 --partial=7 --at=180` und der entsprechende Lauf mit `demolish` vergleichen dieselbe erfolgreiche Dammkonfiguration. Die Diagnose bilanziert die 69 Rasterzellen des Gebäudegrundrisses und rekonstruiert den Solver-Massenfluss an deren Rand. In der Kontrolle bleiben sie geschlossen: Es werden über die Runde 0 m³ hinein und 0 m³ hinaus verrechnet. Nach dem Abriss bei 180 s werden 614,46 m³ hinein und 512,73 m³ hinaus verrechnet; am Rundenende liegen 101,73 m³ in diesen Zellen. Der lokale Bilanzrest beträgt 9,10 × 10⁻¹³ m³; die relativen globalen Wasserbilanzfehler beider Läufe liegen unter 1,76 × 10⁻¹³.

Die Summen können Wasser bei wiederholtem Überqueren mehrfach zählen und unterscheiden nicht, an welcher Seite es ein- und austritt. Der Vergleich belegt einen nach dem Abriss geöffneten und durchströmten Modellbereich, aber keinen durchgehend verfolgten Weg einzelner Wasserteilchen und nicht allein die Ursache der Schadensminderung. Der Eingriff erfolgt idealisiert bei 180 s; menschliche Bedienung und reale Schutzwirkung sind nicht nachgewiesen. Der unveränderte Standardaufruf ohne Zusatzparameter wurde ebenfalls auf Szenario `1.4-draft` überprüft und ergab bei geschlossenem Grundriss weiterhin null Ein- und Ausfluss.

### Produktionsrunde mit späterem Einzelabriss

Auf einem isolierten Produktionsbuild von `becf81f` wurde `bun tools/observe-partial-production.mjs --demolition` in Google Chrome 156.0.8078.73 unter Linux bei 1600 × 1000 CSS-Pixeln ausgeführt. Drei vorbereitete Dämme wurden anhand der vom Worker angefragten Kanten bestätigt. Bei 03:03 pausierte der Test, fragte das Gebäude `w316294474-0` ab und bestätigte seinen Abriss. Die Abfrage zeigte zuvor 1.650 Flutschaden von 11.056 Gebäudewert und 1,04 m maximale Randtiefe; die Abrissvorschau zeigte 11.056 Gebäudeverlust und 1.106 Kosten. Die Uhr blieb während der Pause unverändert.

Die vollständige Runde endete ohne protokollierte Seitenfehler mit 31.368 Flutschaden, 11.056 Abrissverlust und 42.424 Gesamtschaden bei 7.734 Budgetrest; das Ziel von 50.000 wurde erreicht. Der Neustart stellte 00:00, 10.000 Budget und null Schaden wieder her. Die gemessenen 161,512 s schließen die Pause ein und sind kein Leistungsnachweis. Anwendungscode, Szenario und Paketlock entsprechen auch `c40fe04`.

Der Test verwendet feste Bildschirmkoordinaten. Der geometrische Mittelpunkt des Gebäudes traf in der Ausgangsansicht zunächst ein anderes Gebäude; ein tatsächlich sichtbarer Treffpunkt wurde anschließend gesucht und im gezielten Fall `tests/browser/partial-demolition-selection.spec.ts` geprüft. Dies belegt weder menschliches Auffinden noch zuverlässige Auswahl auf echten Geräten. Die lokale Modellbilanz zum geöffneten Grundriss und die wirtschaftlichen Kontrollläufe stehen in den vorherigen Abschnitten.

### Vom Zufluss markierter Wasseranteil

Die zusätzliche Option `--trace-inflow` der Diagnose `tools/trace-northern-route.ts` markiert ausschließlich das über die Szenario-Zuflusszellen eingespeiste Wasser. Die Markierung folgt zunächst der numerischen Zellmischung im gesamten Modell. Erst beim Eintritt in den festgelegten Grabenabschnitt beginnt die Zählung der geordneten Trassenquerungen; mit `--stay-on-route` endet diese Markierung beim Verlassen der Trasse. Anfangswasser wird nicht markiert. Die Summe der eingespeisten Markierung wird gegen den Zuflusszähler des Solvers geprüft.

Für drei Referenzdämme und den nördlichen Graben `(0,4) → (25,4)` zeigt `bun tools/trace-northern-route.ts trench --dams=3 --tip=0 --route=0,4,25,4 --entry=20,25 --stay-on-route --trace-inflow` auf `1.4-draft` bei 300 s einen markierten Trasseneintritt von 598,89 m³ und einen geordneten Austritt von 318,39 m³ an der Westgrenze in Zeile 4. Die markierte Gesamtzufuhr beträgt 1.710.000 m³. Der absolute Markierungsbilanzrest beträgt 2,32 × 10⁻⁷ m³, der relative Wasserbilanzfehler 9,90 × 10⁻¹⁴ und die maximale lokale Abweichung der Markierung vom Wasservolumen 8,53 × 10⁻¹⁴ m³. Der Lauf endet mit 863,20 Schaden und 7.510 Budgetrest.

Für die südliche Route `(0,46) → (47,26)` mit drei Dämmen und `--tip=-2 --entry=30,47 --stay-on-route --trace-inflow` wurden 18.168,56 m³ markierter Zufluss im Eintrittsbereich erfasst; davon erreichten 7,42 m³ nach den gewählten Trassenquerungen den Westrand in Zeile 46. Der Markierungsbilanzrest betrug −3,08 × 10⁻⁷ m³ und der relative Wasserbilanzfehler 1,38 × 10⁻¹³. Der nördliche Kontrolllauf ohne Graben erfasste 586,81 m³ am Eintritt und keinen geordneten Austritt. Der südliche Kontrolllauf mit denselben Dämmen ohne Graben erfasste 14.903,89 m³ am Eintritt und ebenfalls keinen geordneten Austritt; sein Markierungsbilanzrest betrug −3,38 × 10⁻⁷ m³. Die beiden Kontrollläufe sind mit denselben Optionen und `control` statt `trench` reproduzierbar. Im bisherigen Diagnosemodus für dieselbe nördliche Grabenrunde werden 598,89130505 m³ beim seitlichen Trasseneintritt und 318,38617055 m³ am Westrand erfasst; die entsprechenden Zuflussanteile sind hier praktisch gleich groß.

Die Markierung verfolgt keine individuellen Wasserteilchen: Numerische Diffusion und vollständige Mischung innerhalb einer Zelle bestimmen den ausgewiesenen Anteil. Der Befund belegt einen Modellanteil von der Einspeisung über die ausgewählte Trasse bis zum offenen Rand, keine reale Ableitung oder deren Folgen außerhalb des Ausschnitts. Die ursprüngliche Diagnose bleibt auch ohne `--trace-inflow` nutzbar.

## Dach-korrigiertes Szenario 1.5: Abrisssuche und laufender Eingriff

Am 30. Oktober 2026 verglich `tools/evaluate-demolition.ts` auf dem ausgelieferten `1.5-draft` (SHA-256 `f27c6082e7dee7444d20439bd94f14203abe04de412dde2ebedb9cfde7cebdd0`) jeden der 92 zu Beginn bezahlbaren Einzelabrisse vor Flutbeginn mit der unbehandelten Kontrolle. Zwei weitere Gebäude waren nicht bezahlbar. Ein zweiter Suchlauf prüfte die 92 nach zwei vorbereiteten Referenzdämmen bezahlbaren Einzelabrisse bei 180 s. Die Steuerung begrenzt den Zeitschritt am Eingriffszeitpunkt; die zugehörige Kontrolle verwendet dieselbe Zeitgrenze. Für die Auswertung zählt der Gesamtschaden einschließlich Abrissverlust und zusätzlich die Werkzeugkosten. Die [vollständigen Einzelwerte](demolition-search-1.5.json) enthalten Budget, Bilanz und Volumenänderung; in allen 184 geprüften Fällen lag der relative Bilanzfehler unter 0,1 % und die gemessene Volumenänderung bei der Aktion war null.

| Ausgangslage | Eingriff | Gesamtschaden | Abrisskosten | Ersparnis nach Kosten gegenüber Kontrolle |
| --- | --- | ---: | ---: | ---: |
| Ohne Dämme | keiner | 94.376,50 | 0 | — |
| Ohne Dämme | `w1207502028-0` vor Start | 94.007,06 | 7 | 362,44 |
| Ohne Dämme | Kontrolle mit Zeitgrenze 180 s | 94.376,49 | 0 | — |
| Ohne Dämme | `w1207502028-0` bei 180 s | 94.007,00 | 7 | 362,49 |
| Zwei Dämme | Kontrolle mit Zeitgrenze 180 s | 7.274,23 | 0 | — |
| Zwei Dämme | `w1207502028-0` bei 180 s | 7.339,41 | 7 | −72,18 |

In der ersten Suche war `w1207502028-0` das einzige Gebäude mit positiver Ersparnis nach Kosten; in der zweiten gab es keines. Der Kandidat ist in [OSM](https://www.openstreetmap.org/way/1207502028) als `building=yes` erfasst, hat im Szenario 6,58 m² Grundfläche und einen Wert von 66. Beim Eingriff bei 180 s betrug sein bereits verbuchter Schaden 1,18; nach Abriss wurden insgesamt 66 als Verlust verbucht und kein Wasser verändert. Auch bei 60 und 120 s war der Einzelabriss gegenüber der unbehandelten Kontrolle wirtschaftlich. Er allein verfehlt jedoch das Ziel von 50.000 und sein Nutzen fällt in der Dammkombination weg. Dies ist ein Modellvergleich, keine Aussage über reale Schutzwirkung.

Der Entwicklungsbrowser Chromium 156.0.8078.4 wählte den Kandidaten bei 1600 × 1000 CSS-Pixeln mit `bun tools/inspect-demolition-target.mjs` anhand einer testseitig aus der Babylon-Szene projizierten Position aus. Die Vorschau zeigte 66 Verlust und 7 Kosten; das [Bild](abriss-kandidat-1.5.png) zeigt die Gesamtansicht. Das Gebäude ist darin sehr klein; Projektion und feste Testkoordinaten belegen weder menschliches Auffinden noch Touch-Bedienung. Die Höhenangabe von 12 m ist ein geschätzter Darstellungswert.

Für die Suche wurden die Kennungen aus dem Szenario auf das verfügbare Budget gefiltert und die Kandidaten mit `bun tools/evaluate-demolition.ts baseline <ID> 0` beziehungsweise `bun tools/evaluate-demolition.ts shield <ID> 180` berechnet. Kontrollen lauten `bun tools/evaluate-demolition.ts baseline control 0` und `bun tools/evaluate-demolition.ts shield control 180`; die Kontrollen zum Zeitpunkt 180 s treffen dieselbe Zeitschrittgrenze wie die Aktionen. Vier unabhängige Prozesse liefen parallel. Die Suche deckt einzelne Gebäude in genau diesen zwei Ausgangslagen und Zeitpunkten ab, keine Kombinationen oder alle denkbaren Strategien.

Eine vollständige Produktionsrunde in Chromium 156 auf macOS 27.2 verwendete `bun tools/observe-south-production.mjs --after-flood`: Drei Dämme wurden vor Beginn gebaut, der südliche Graben in Pause bei 02:30 bestätigt. Der Lauf erreichte bei 05:00 das Ziel mit 13.445 Schaden und 6.540 Budgetrest; nach Neustart standen Zeit und Schaden auf null und das Budget auf 10.000. Die Auswahl nutzte Testkoordinaten und eine instrumentierte Suche nach dem exakten Endpunkt. Menschliche Platzierung und der vollständige reale Wasserweg bleiben offen.

### Südlicher Graben: Eingriffszeit auf 1.5

Auf Szenario `1.5-draft` wurden mit `bun tools/compare-south-timing.ts control ZEIT` und `bun tools/compare-south-timing.ts trench ZEIT` dieselben drei vorbereiteten Dämme und der südliche Referenzgraben verglichen. Beide Läufe halten bei der jeweiligen Zeit für eine identische Zeitschrittgrenze an; nur die Grabenvariante verändert dort das Gelände. Der Graben kostet 1.700, das Restbudget beträgt 6.540. Die Einsparung unten zieht diese zusätzlichen Werkzeugkosten vom Unterschied der Gesamtschäden ab. Die [vollständigen 26 Ergebnisse](south-timing-1.5.json) enthalten auch Wasserbilanz, Budget und Zeitpunkt.

| Grabenbau bei | Schaden Kontrolle | Schaden mit Graben | Einsparung nach Kosten | Bereits benetzte Grabenzellen ≥ 0,05 m |
| ---: | ---: | ---: | ---: | ---: |
| 0 s | 19.287,45 | 13.716,19 | 3.871,26 | 0 |
| 120 s | 19.287,45 | 13.588,60 | 3.998,85 | 5 |
| 150 s | 19.287,45 | 13.460,45 | 4.127,00 | 6 |
| 180 s | 19.287,45 | 10.048,08 | 7.539,38 | 26 |
| 210 s | 19.287,45 | 14.681,32 | 2.906,13 | 28 |
| 225 s | 19.287,45 | 17.045,51 | 541,94 | 28 |
| 230 s | 19.287,45 | 17.472,57 | 114,88 | 28 |
| 235 s | 19.287,45 | 17.798,54 | −211,09 | 27 |
| 240 s | 19.287,45 | 18.056,95 | −469,50 | 27 |
| 270 s | 19.287,45 | 19.091,70 | −1.504,25 | 20 |

Alle gezeigten Runden bleiben unter dem Ziel von 50.000. Bei jedem Grabenbau betrug die gemessene sofortige Volumenänderung null; alle 26 relativen Bilanzfehler lagen unter 0,1 %. Bei 150 s waren bereits 83,55 Gesamtschaden verbucht; im [Produktionsbrowser](#dach-korrigiertes-szenario-15-abrisssuche-und-laufender-eingriff) wurde dieselbe Trasse bei 02:30 in Pause gebaut und das Ziel erreicht. Für die geprüften diskreten Zeitpunkte ist der Eingriff bis 230 s wirtschaftlich, ab 235 s nicht mehr. Das ist keine nachgewiesene kontinuierliche Grenzzeit, keine Aussage über andere Platzierungen und keine reale Hochwasservorhersage. Die Position wurde nicht unabhängig menschlich gefunden; die mobile Prüfung bleibt ausgesetzt.

### Modellierter Wasserweg nach spätem südlichem Grabeneingriff auf 1.5

Für dieselben drei Dämme, die südliche Trasse und einen Bauzeitpunkt von 150 s wurde der Zuflussanteil auf `1.5-draft` mit `bun tools/trace-northern-route.ts trench --dams=3 --tip=-2 --route=0,46,47,26 --entry=30,47 --stay-on-route --trace-inflow --at=150` verfolgt; `control` statt `trench` liefert die gleich getaktete Kontrolle. Die [vollständigen Ergebnisse](south-trace-1.5.json) beziehen sich auf Szenario-SHA-256 `f27c6082e7dee7444d20439bd94f14203abe04de412dde2ebedb9cfde7cebdd0`.

| Fall | Markierter Eintritt in den gewählten Trassenbereich | Geordneter Austritt am Westrand | Gesamtschaden | Budgetrest |
| --- | ---: | ---: | ---: | ---: |
| Kontrolle ohne Graben | 10.953,18 m³ | 0 m³ | 19.287,45 | 8.240 |
| Graben bei 150 s | 13.105,49 m³ | 0,847 m³, Zeile 46 | 13.460,45 | 6.540 |

Die Markierung stammt ausschließlich aus dem Szenariozufluss und wird in jeder Zelle numerisch gemischt. Sie muss nach dem definierten Eintritt die angegebenen Querschnitte in Reihenfolge passieren und auf der Trasse bleiben; die Kontrolle verwendet dieselbe gedachte Trasse ohne Aushub. Markiertes Wasser kann nach Verlassen erneut eintreten, sodass Eintrittssummen keine einmaligen Wasserteilchen zählen. Die Markierungsbilanzreste betrugen `5,15 × 10⁻⁸` beziehungsweise `−4,21 × 10⁻⁷` m³; die Wasserbilanzfehler lagen unter 0,1 %. Der erfasste Austritt ist ein sehr kleiner Modellanteil und erklärt nicht allein die Schadensminderung. Die Rechnung belegt weder einen realen Abfluss noch Folgen außerhalb der Karte.

Eine ergänzende Live-Sichtprobe mit `bun tools/observe-south-live-flow.mjs --after-flood` nutzte den Entwicklungsbrowser Chromium 156.0.8078.4 und projizierte Testkoordinaten. Der Graben wurde in Pause bei 02:30 bestätigt; die Kamera wurde testseitig auf die Trasse eingestellt. Bei 03:00 waren 17 von 34 abgetasteten Graben-Strömungsstellen über der Geschwindigkeitsschwelle, bei 04:00 waren es 27; die jeweils höchste abgetastete Geschwindigkeit lag bei 4,04 beziehungsweise 2,30 m/s. Die Bilder bei [03:00](suedgraben-1.5-spaet-180.png) und [04:00](suedgraben-1.5-spaet-240.png) zeigen die Kartenüberlagerung und Ausschnitte der Strömungsmarker; Gebäude, Wasser und Perspektive erschweren die Verfolgung der gesamten Trasse. Die Runde erreichte 13.446 Schaden und 6.540 Budgetrest. Die Proben und die künstlich fokussierte Kamera belegen keine durchgehende menschliche Erkennbarkeit oder Bedienung.

### Wirtschaftlicher Abriss bei südlicher Dammführung

Ein weiterer Vergleich auf `1.5-draft` verwendet die drei vorbereiteten Dämme der `south-control`-Referenz ohne Graben. `bun tools/evaluate-demolition.ts south-control GEBÄUDE-ID 180` prüfte bei 180 s dieselben 92 zuvor in der unbehandelten Runde bezahlbaren Einzelgebäude; die Kontrolle erhielt dieselbe Schrittgrenze. Die [Einzelwerte und Zeitvergleiche](demolition-south-1.5.json) enthalten die vollständigen Schäden, Kosten und Bilanzen. Zwei Gebäude verbesserten die Kontrolle auch nach Kosten: `w316294475-0` um 1.598,58 und `w1207502028-0` um 184,52. Die Kontrolle ergibt 19.287,45 Gesamtschaden bei 8.240 Budgetrest.

Der größere Kandidat `w316294475-0` hat 153,25 m² Grundfläche und einen Spielwert von 1.533. Der Abriss bei 180 s kostet 154 und ergibt 17.534,87 Gesamtschaden bei 8.086 Budgetrest. Ersetzt man den Eingriffszeitpunkt durch 0, 120 oder 240 s und verwendet jeweils eine entsprechend gestaffelte Kontrolle, beträgt der Vorteil nach Kosten 1.519,09, 1.519,09 beziehungsweise 571,44. Die Kontrolle und alle vier Fälle bleiben unter dem Schadensziel. Bei 180 s war das Gebäude bereits mit 119,23 beschädigt; der Abriss verbucht insgesamt 1.533 Verlust, nicht zusätzlich den bereits gezählten Schaden. Die sofortige Volumenänderung war null; die relativen Wasserbilanzfehler aller 92 Suchläufe und der zusätzlichen Zeitläufe blieben unter 0,1 %. Diese vier Zeitpunkte belegen keine stetige Zeitspanne und die Kombination mit einem Graben wurde nicht untersucht.

Ein erneuter Vergleich mit `bun tools/evaluate-demolition.ts south-control control 180 --buildings` und derselben Anweisung mit `w316294475-0` statt `control` erfasst die [Schäden aller Gebäude](demolition-south-buildings-1.5.json) am Rundenende. Bei `r4257449-0` sinkt der Schaden von 9.704,44 auf 8.045,37, bei `r9350494-0` von 6.864,46 auf 6.281,94. Für das abgerissene Gebäude steigt der verbuchte Verlust gegenüber 1.043,85 Flutschaden in der Kontrolle auf 1.533; die übrigen Unterschiede sind gering. Die Summendifferenz beträgt 1.752,58 vor den 154 Werkzeugkosten. Beide begünstigten Gebäude liegen im Modell räumlich nahe dem Abrissgebiet; der Vergleich einzelner Schäden zeigt keine eindeutige hydraulische Ursache oder reale Schutzwirkung und belegt nicht, dass Spielende diesen Zusammenhang selbst erkennen.

Im Entwicklungsbrowser Chromium 156.0.8078.4 wählte `bun tools/inspect-demolition-target.mjs w316294475-0` das Gebäude anhand einer testseitig projizierten Position; die Vorschau zeigte 1.533 Gebäudeverlust und 154 Kosten. Das [Bild](abriss-sued-kandidat-1.5.png) zeigt den vorbereiteten Ausgangszustand ohne Dämme. Der Test belegt die Auswahl und Vorschau, nicht selbstständiges Auffinden, einen vollständigen Browserlauf mit diesem Abriss oder eine reale Schutzwirkung.

Anschließend prüfte `bun tools/observe-south-demolition.mjs` eine vollständige Runde im lokalen Produktionsbuild mit Chromium 156.0.8078.4 bei 1600 × 1000 CSS-Pixeln. Drei vorbereitete Dämme wurden anhand der Worker-Vorschau mit der Referenz verglichen; bei 03:00 wurde pausiert und `w316294475-0` über eine feste, zuvor projizierte Bildschirmposition ausgewählt und für 154 bestätigt. Die Uhr blieb in der Pause stehen. Nach Fortsetzen erreichte die Runde bei 05:00 das Ziel mit 16.014 Flutschaden, 1.533 Abrissverlust, insgesamt 17.547 Schaden und 8.086 Budgetrest. Es wurden keine Seitenfehler oder Abstürze protokolliert; der Ergebnisneustart setzte Uhr, Budget und Schadensanzeige zurück. Die Simulation lief auf 2×; die beobachtete Zeit von 154,082 Sekunden enthält auch die Pause. Die gegenüber dem numerischen Vergleich abweichende Rundung und Zeitsteuerung ergeben unterschiedliche Werte; der Browserlauf belegt keine eigenständige menschliche Auswahl oder reale Schutzwirkung.

Nach der Änderung der Anzeige kleiner positiver Schäden wurde diese vollständige Produktionsrunde auf Anwendungscode `d05c395` mit demselben Befehl und Browser wiederholt. Der Abriss erfolgte erneut pausiert bei 03:00; Ergebnis und Budget waren gerundet identisch, der Neustart setzte Zeit, Budget und Schaden zurück. Der Lauf dauerte 154,096 s einschließlich Pause und protokollierte keine Seitenfehler oder Abstürze. Die Auswahl erfolgte weiterhin mit Testkoordinaten.

### Einfluss der Geländekanten am südlichen Graben

`bun tools/compare-south-crests.ts control|trench|retain` vergleicht auf dem unveränderten Szenario `1.5-draft` drei vorbereitete südliche Dämme und einen Eingriff bei 150 s. Die Kontrolle erhält dieselbe zeitliche Schrittgrenze. Der Referenzgraben überquert fünf modellierte DGM-Kanten: `x:6266` (7,966 m), `x:6664` (6,380 m), `x:8054` (7,243 m), `y:5643` (8,660 m) und `y:6434` (6,388 m), jeweils bezogen auf Wiener Null. Die reguläre Grabenaktion senkt diese Kanten um 3 m; ihre Vorschau nennt fünf betroffene Kanten. Der Gegenversuch `retain` stellt unmittelbar nach der Aktion die ursprünglichen modellierten Kronen wieder her, belässt Grabenbett und Kosten aber unverändert. Diese Variante wird ausschließlich im Speicher gerechnet und ist keine im Spiel auswählbare Maßnahme.

| Variante | Gesamtschaden | Budgetrest |
| --- | ---: | ---: |
| Dämme ohne Graben | 19.287,45 | 8.240 |
| Dämme und regulärer Graben | 13.460,45 | 6.540 |
| Dämme und Graben mit erhaltenen Kanten | 10.561,41 | 6.540 |

Alle drei relativen Bilanzfehler lagen unter 0,1 %. Der Gegenversuch verbessert den Schaden gegenüber dem regulären Graben um 2.899,04; ein Vorteil des Grabens bleibt gegenüber der Dammkontrolle in beiden Varianten nach 1.700 Kosten bestehen. Die Rechnung identifiziert weder eine einzelne entscheidende Kante noch den Wasserweg und belegt nicht, welche reale Funktion die DGM-Kanten haben oder ob eine Absenkung dort fachlich zulässig wäre. Die Modellvariante zeigt lediglich, dass das vollständige Absenken aller fünf Kanten für den beobachteten numerischen Nutzen nicht erforderlich ist.

`python3 tools/inspect-south-crest-sources.py` wendet die vorhandene Rasterungsfunktion auf jede einzelne im Szenario gespeicherte Bruchlinie an und ordnet so die fünf Rasterkanten ihren Beiträgen zu. Für `x:6266`, `x:6664`, `x:8054`, `y:5643` und `y:6434` fand es jeweils genau eine beitragende Typ-1-Linie; die nullbasierten Indizes im `breaklines`-Feld von `1.5-draft` sind 52, 5, 54, 35 und 5. Die Rasterung aus diesen Linien reproduziert jeweils die gespeicherte Kronenhöhe exakt. Die Zuordnung betrifft die bereits beschnittenen und transformierten Szenariolinien; die Indizes sind keine amtlichen Objektkennungen. Typ 1 bezeichnet eine Bruchlinie, nicht automatisch einen Damm oder eine Mauer. Die Abtastung und die Interpretation als überströmbare Krone bleiben Modellannahmen; eine örtliche Identifikation und Durchlassprüfung sind damit nicht erfolgt.

### Einzelne Endpunktverschiebungen der südlichen Dämme

`bun tools/compare-south-dam-placement.ts DAMM start|end DX DY` verschiebt auf `1.5-draft` einen von sechs Endpunkten der drei vorbereiteten Dämme der `south-control`-Referenz um genau eine 4-m-Rasterzelle. Es wurden alle vier Richtungen je Endpunkt geprüft; die übrigen Endpunkte blieben unverändert und kein Graben oder Abriss wurde gesetzt. Der [vollständige Vergleich](south-dam-offsets-1.5.json) enthält alle 24 Läufe, Vorschauergebnisse, Kosten und Bilanzen. Die unverschobene Kontrolle ergibt 19.287,45 Schaden und 8.240 Budgetrest.

Von 24 Varianten waren 21 zulässig: 20 davon erreichten das Ziel von 50.000; ihr Schaden lag zwischen 8.064,20 und 48.284,11. Eine Verschiebung des Starts von Damm 1 um eine Zelle in positive Raster-y-Richtung ergibt 53.223,47 Schaden bei 8.280 Budgetrest und verfehlt das Ziel. Eine Verschiebung dieses Startpunkts außerhalb der Karte wird abgewiesen; zwei andere Varianten werden wegen Überlappung mit einem bereits gesetzten Damm abgelehnt. Die relativen Bilanzfehler aller zulässigen Läufe lagen unter 0,1 %. Die Prüfung betrachtet keine gemeinsamen Verschiebungen, die späteren Graben- oder Abrisskombinationen und keine menschliche Bedienung. Eine zulässige Vorschau prognostiziert den späteren Schaden nicht; die Verständlichkeit möglicher Lücken für Spielende ist damit nicht nachgewiesen.

Die Worker-Vorschau meldet nun bei einem freien Dammende eine Rasterkante vor dem Kartenrand eine mögliche Öffnung, ohne die Aktion zu sperren. Der Desktop-Produktionstest `tests/browser/shifted-reference.spec.ts` wählt die zielverfehlende Variante über projizierte Mauskoordinaten aus, gleicht die Worker-Aktion mit der Dammgeometrie ab und prüft den Hinweis sowie das unveränderte Budget nach Verwerfen. Ein Regeltest prüft außerdem, dass ein bis zum Rand oder an einen vorhandenen Damm angeschlossener Verlauf diese Warnung nicht erhält. Der Hinweis erfasst nur diese Nähe zum Kartenrand, nicht alle Lücken zwischen Bauwerken oder tatsächliche Fließwege. Die Verständlichkeit für Menschen bleibt offen.

Ergänzend meldet die Worker-Vorschau nun ein freies Dammende, das eine Rasterkante von einem bestehenden Damm entfernt liegt; auch dieser Hinweis lässt die Bestätigung zu. Der Desktoptest setzt den ersten südlichen Damm und wählt den Start des zweiten um eine Zelle versetzt: Die Worker-Geometrie entspricht `[27,10] → [34,20]`, die Vorschau nennt die mögliche Öffnung und Verwerfen erhält das Budget. Ein Regeltest prüft direkte Anschlüsse und wiederholte Aktionskennungen. Der Hinweis erkennt einzelne Rasterkanten Abstand zu bestehenden Dämmen, keine größeren Lücken oder die tatsächliche Wasserwirkung; menschliche Verständlichkeit bleibt offen.

Nach dieser Ergänzung erreichte `bun tools/observe-south-demolition.mjs` auf Anwendungscode `785c709` in Chromium 156.0.8078.4 erneut das Ziel mit drei vorbereiteten südlichen Dämmen und Abriss bei 03:00. Die Runde ergab 17.548 Schaden und 8.086 Budgetrest; der Neustart setzte Zeit, Budget und Schaden zurück. Sie dauerte 154,042 s einschließlich Pause; Seitenfehler und Abstürze wurden nicht protokolliert. Die Referenzmaßnahmen wurden mit festen Testkoordinaten ausgewählt; dieser Lauf bestätigt nicht die menschliche Verständlichkeit des Hinweises.

Auf Anwendungscode `c49b5ad` bestand anschließend `bun tools/observe-south-demolition.mjs` in Chromium 156.0.8078.4 eine vollständige Produktionsrunde mit drei vorbereiteten Referenzdämmen und pausiertem Abriss bei 03:00. Diese Referenzdämme lösten den neuen Hinweis nicht aus. Bei 05:00 wurden 17.550 Gesamtschaden und 8.086 Budgetrest angezeigt; das Ziel wurde erreicht und der Ergebnisneustart stellte Zeit, Budget und Schaden zurück. Die Dauer betrug 154,118 s einschließlich Pause; Seitenfehler und Abstürze wurden nicht protokolliert. Die Auswahl erfolgte mit festen Testkoordinaten. Eine gesonderte Regelprüfung bestätigte, dass ein gewarnter Damm ausführbar bleibt, die erwarteten Kosten einmal belastet und Wasser bei der Aktion erhält.

### Platzierungsabweichungen der beiden Gräben auf 1.5

Mit `bun tools/compare-south-placement.ts start|end DX DY` wurde bei der südlichen Referenztrasse jeweils genau ein Endpunkt um eine 4-m-Rasterzelle in eine der vier Himmelsrichtungen verschoben. `--north` führt denselben Versuch für den nördlichen Graben mit dessen drei Referenzdämmen aus. Alle gültigen Gräben wurden bei 150 s gebaut; die Kontrollen erhielten dieselbe zeitliche Schrittgrenze. Die [Einzelwerte](diversion-offsets-1.5.json) enthalten Verlauf, Kosten und Bilanz. Die Kontrollen ergeben südlich 19.287,45 und nördlich 6.645,27 Schaden; der jeweilige Vorteil nach Kosten berücksichtigt die zusätzlichen Grabenkosten.

| Trasse / geänderter Punkt | Zulässigkeit und Wirkung der vier Einzelverschiebungen |
| --- | --- |
| Süd, Start | Links außerhalb der Karte; oben und unten durch ein Gebäude abgelehnt; eine Zelle nach innen zulässig, aber 199.854,40 Schaden. |
| Süd, Ende | Alle vier zulässig; Schaden 17.570,22 bis 198.478,99. Keine der Varianten ist nach Grabenkosten wirtschaftlich; zwei verfehlen das Ziel deutlich. |
| Nord, Start | Links außerhalb der Karte; drei Varianten zulässig und unter dem Ziel. Zwei sind nach Kosten wirtschaftlich; eine Zeile nach Süden ergibt 11.636,83 Schaden und verschlechtert die Kontrolle. |
| Nord, Ende | Alle vier zulässig, unter dem Ziel und nach Kosten wirtschaftlich; Schaden zwischen 0,34 und 125,39. |

Die südliche Referenz selbst ergibt bei 150 s 13.460,45 Schaden; die nördliche 5,85. Für alle zwölf gültigen Varianten über beide Trassen blieb die sofortige Volumenänderung null und der relative Wasserbilanzfehler unter 0,1 %. Die südliche Trasse ist im korrigierten Szenario damit weiterhin stark platzierungsempfindlich; die nördliche ist in dieser begrenzten Stichprobe fehlertoleranter, aber nicht gegenüber jeder Verschiebung wirtschaftlich. Aus dem Unterschied allein folgt keine eindeutige hydraulische Ursache. Mehrere gleichzeitige Punktabweichungen, andere Zeiten, tatsächliche Touch-Hardware und menschliches Auffinden sind nicht abgedeckt.

Der Chromium-Produktionsbrowsertest `tests/browser/south-trench-blocked.spec.ts` prüfte die Verschiebung des südlichen Startpunkts um eine Zelle nach Norden: Die maßgebliche Worker-Vorschau meldete „Ein Gebäude versperrt den Graben. Verlauf ändern oder Gebäude abreißen.“, die Bestätigung blieb deaktiviert und das Budget nach Verwerfen unverändert. Der außerhalb liegende Startpunkt wird im numerischen Werkzeug ausdrücklich als außerhalb der Karte verworfen; dies ist kein separater Browsertest. Die Rückmeldung sagt bei zulässigen Strecken keine spätere Schadenswirkung voraus.

Die nördliche Referenz wurde anschließend auf dem aktuellen Produktionsbuild in Chromium 156.0.8078.4 mit `bun tools/observe-land-production.mjs --after-flood` als vollständige Runde geprüft. Drei Dämme wurden vor Beginn gesetzt; der Graben wurde bei 02:31 in Pause bestätigt. Der automatisierte Test traf die exakte Trasse mithilfe fester Koordinaten und einer kleinen Endpunktsuche. Die Runde erreichte bei 05:00 das Ziel mit 19 Schaden und 7.510 Budgetrest; der Neustart stellte Zeit, Budget und Schadensanzeige zurück. Die laufende Schadensanzeige zeigte zuvor bei 02:56 bereits einen Schaden von 1. Dieser Browserlauf belegt die getestete Aktionenfolge, aber nicht die selbstständige menschliche Platzierung; die oben numerisch untersuchten Abweichungen wurden dabei nicht einzeln im Browser gespielt.
