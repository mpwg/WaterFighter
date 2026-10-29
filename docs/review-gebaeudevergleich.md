# Gebäudevergleich der Referenzstrategien

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

Die getrennte Verschiebung eines Grabenendpunkts um eine Rasterzeile wurde mit `--trench-start-row=-1`, `--trench-start-row=1`, `--trench-end-row=-1` und `--trench-end-row=1` vor Beginn untersucht. Start −1 wird abgelehnt: „Ein Gebäude versperrt den Graben. Verlauf ändern oder Gebäude abreißen.“ Die übrigen drei Verläufe sind zulässig, kosten wegen einer zusätzlichen Zelle jeweils 675 und ergeben der Reihe nach 37.474,82, 21.552,70 und 21.622,17 Gesamtschaden. Ihre relativen Bilanzfehler liegen unter 1,44 × 10⁻¹⁴. Die getestete Ablehnung stammt aus der maßgeblichen Spielregel; diese numerische Prüfung belegt nicht, dass die Stelle und der Hinweis auf jedem Gerät leicht zu bedienen sind.
