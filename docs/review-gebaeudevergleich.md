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
