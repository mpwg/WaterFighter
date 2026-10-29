# Steuerungsauftrag für Terra: Spielbarkeit vor weiteren Detailoptimierungen

Stand: 29. Oktober 2026. Reviewbasis: `0c9d680`, anschließend lokaler Stand `4673010`. Vor Umsetzung den aktuellen Stand prüfen und zwischenzeitliche Änderungen erhalten.

## Auftrag und Nutzerentscheidungen

Dieses Dokument ist ein Umsetzungsauftrag an den anderen, extern laufenden Implementierungsagenten. Der Review-Agent soll Anweisungen hinterlassen, nicht selbst den Spielcode ändern.

Der Nutzer hat folgende Prioritäten festgelegt:

- **Spielgefühl zuerst.** Eine verständliche, lohnende Spielrunde ist der nächste Meilenstein.
- **Vorbereitung und Eingriffe während der Flut sind gleich wichtig.** Beide müssen funktionieren und sinnvoll sein.
- **Dokumentierte Szenarioanpassungen sind erlaubt.** Reale Wiener Geografie bleibt die Grundlage; lokale Geländeanpassungen, Zufluss und Kosten dürfen nachvollziehbar abgestimmt werden.
- Architektur, Umfang und Sicherheitsinvarianten aus `spielplan.md` und `umsetzungsplan.md` bleiben erhalten. Keine neuen Produktfunktionen, kein Wechsel auf ein Pegelmodell und keine öffentliche Veröffentlichung.

## Reviewurteil und priorisierte Änderungen

Die technische Richtung stimmt: Babylon.js, konservativer Solver im Worker, getrennte Spielregeln und Darstellung passen zum Plan. Die Dokumentation unterscheidet vorhandene Umsetzung und offene Abnahme weitgehend ehrlich. Der Engpass ist jetzt der Übergang von funktionierenden Werkzeugen zu verständlichen Entscheidungen.

### 1. Zwei Schutzansätze und sinnvollen Werkzeugnutzen belegen

Erarbeite im konkreten Wiener Szenario zwei nachvollziehbare Ansätze: **Abschirmen mit Dämmen** und **gezieltes Ableiten**, gegebenenfalls mit einem bewusst geopferten Gebäude. Nicht jede erfolgreiche Strategie muss alle drei Werkzeuge einsetzen. Für jedes Werkzeug muss jedoch mindestens eine erkennbare, wirtschaftlich sinnvolle Anwendung existieren.

Die bisherigen Vergleiche reichen dafür nicht: Der dokumentierte Graben kostet 1.775 und verbessert den Schaden nur um 112,40 bei einer Ausgangslage von 140.425,48. Der dokumentierte Abriss verbessert ihn um 2.888,16. Die elfteilige Erfolgsstrategie besteht ausschließlich aus Dämmen. Referenzen: `docs/solverbericht.md`, `tests/fixtures/strategy.json`.

Prüfe zuerst, ob die Maßnahmen überhaupt an geeigneten Stellen liegen. Die bisherige Grabenstrecke liegt überwiegend im künstlichen Flussbett. Prüfe ebenso, ob die Randbedingungen einen vorgesehenen Abfluss ermöglichen. Ein geschlossener Kartenrand ist kein Auslass.

Vergleiche pro Kandidat unbehandelte Runde, Dammstrategie und Ableitungsstrategie mit identischem Szenariostand. Erfasse Kosten, Flutschaden, Abrissverlust, Gesamtschaden, Wasserbilanz und den räumlichen Verlauf. Beschreibe, welche Gebäude aus welchem Grund geschützt werden. Ein einzelner lokaler Flusswert ersetzt keinen nachvollziehbaren Umleitungsweg.

Ändere bei unzureichendem Nutzen gezielt das Szenario. Speichere Anpassungen getrennt von Quelldaten in der reproduzierbaren Pipeline; versioniere Szenario, Referenzstrategien und Belege gemeinsam. Senke nicht lediglich das Anspruchsniveau der Abnahme. Erhalte zunächst das Schadensziel von 50.000 als Vergleichsmaßstab.

### 2. Während der Runde verständliches Feedback geben

- Laufenden Gesamtschaden und Zielwert anzeigen, einschließlich unterscheidbarer Flut- und Abrissverluste. Wesentliche Informationen müssen auch bei ausgeblendetem Werkzeugmenü erkennbar bleiben.
- Gefährdete, beschädigte und vollständig verlorene Gebäude sichtbar unterscheiden und durch abrufbare Zahlen beziehungsweise Zustandsbeschreibungen ergänzen; nicht ausschließlich Farbe verwenden.
- Zufluss, mögliche Abflusswege und bestätigte Maßnahmen räumlich verständlich darstellen. Die Einführung soll erklären, wie Spieler diese Informationen zum Planen und Reagieren nutzen.
- In `World.updateState` werden Geometrieänderungen über die Aktionsrevision begrenzt. Schadensdarstellung muss unabhängig davon auf laufende Snapshots reagieren; andernfalls bleibt sie ohne neue Bauaktion stehen.
- Der Worker bleibt maßgeblich. Falls aggregierte Schäden oder aktuelle Exposition für die Anzeige fehlen, das bestehende Snapshot-Protokoll gezielt erweitern. Budget, Vorschau, Bestätigung und Schadensberechnung nicht in die Oberfläche verlagern.
- Neue Anzeigen dürfen auf kleinen Ansichten weder Werkzeugbestätigung noch Kartenbedienung verdecken. Layout und tatsächliche Treffflächen in Hoch- und Querformat prüfen.

### 3. Erkennbare und fehlertolerante Maßnahmen ermöglichen

Die automatisierte Platzierung von elf Dammabschnitten mit projizierten Testkoordinaten ist ein technischer Nachweis, kein menschlicher Spielbarkeitstest. Untersuche, ob Spieler aus der Karte sinnvolle Maßnahmen ableiten und ohne Kenntnis der Gitterkoordinaten setzen können.

Prüfe bei den Referenzmaßnahmen auch kleine Verschiebungen der Start- und Endpunkte um eine Rasterzelle. Wenn dadurch eine Lücke oder ein Hindernis entsteht, muss die Vorschau beziehungsweise Ablehnung den Grund verständlich machen. Gleiche Ergebnisse bei beliebiger Platzierung sind nicht gefordert.

Prüfe Maßnahmen in Vorbereitung, bei laufender Uhr und während einer Pause. Dokumentiere, bis zu welchem Zeitpunkt Eingriffe sinnvoll sind. Eine ausschließlich vorab ausführbare Musterlösung genügt nicht für den gewünschten reaktiven Teil.

## Konkrete Untersuchungshinweise aus dem Review

Die folgenden Zahlen sind **explorative numerische Kandidaten, keine freigegebene Szenariokonfiguration und keine Browserabnahme**. Sie wurden am 29. Oktober 2026 mit Bun 1.4.4 auf macOS arm64 gerechnet. Grundlage ist `1.3-draft`; die Kandidaten wurden nur im Speicher verändert, nicht in das Szenariopaket übernommen.

Rechenablauf: `Game`, vollständige 300 s, vor jedem Schritt höchstens 1 s mit zusätzlicher CFL-Begrenzung; anschließend `addInflow(t, dt)` und `updateDamage(dt)`. Alle Maßnahmen vor dem Start. Gitterkoordinaten sind nullbasiert; Grabenstrecken enthalten beide Endzellen. Dammsegmente stammen in ihrer Reihenfolge aus `tests/fixtures/strategy.json`.

| Konfiguration | Gesamtschaden | Budgetrest |
| --- | ---: | ---: |
| Unverändertes `1.3-draft`, ohne Maßnahmen | 140.425,48 | 10.000 |
| Zusätzlich offener linker Rand, ohne Maßnahmen | 138.852,13 | 10.000 |
| Offener linker Rand, Grabentiefe 3 m, Graben `(0,4)` → `(25,4)` | 113.264,38 | 9.350 |
| Offener linker Rand, nur die ersten drei Referenz-Dammsegmente | 34.792,87 | 8.160 |
| Wie vorige Zeile, zusätzlich 3-m-Graben `(0,4)` → `(25,4)` | 21.600,61 | 7.510 |
| Offener linker Rand, erste zwei Dammsegmente, Abriss `w33581744-0`, 3-m-Graben `(0,10)` → `(23,10)` | 33.646,93 | 6.598 |

Der letzte Fall enthält 16.017 Abrissverlust bereits im Gesamtschaden. Die relativen Wasserbilanzfehler dieser Läufe lagen unter `2 × 10⁻¹³`, bezogen auf Anfangsvolumen plus Zufluss. Die Rechnungen zeigen aussichtsreiche Ansätze und eine möglicherweise unnötig lange bisherige Referenz-Dammstrecke. Sie belegen noch keine vollständigen Abflusswege, Robustheit gegenüber Platzierung, rechtzeitige Eingriffe oder menschliche Bedienbarkeit.

**Nächster sinnvoller Versuch:** Diese kurzen Damm- und Ableitungsvarianten eigenständig reproduzieren und mit passenden Kontrollläufen vergleichen, insbesondere dieselbe Kombination ohne Abriss beziehungsweise ohne Graben. Den offenen linken Rand als Spielannahme fachlich und räumlich einordnen; nicht stillschweigend als reale sichere Ableitung darstellen. Erst anschließend Parameter oder Geodatenpipeline ändern.

## Abnahme des nächsten Arbeitspakets

1. Aktuellen Build, Typprüfung, Solver-, Regel-, Integrations- und Browserprüfungen ausführen. Wassererhaltung, atomare Aktionen, einmalige Kosten, monotone Schäden, korrekte Abrissverluste und Schutz vor alten Nachrichten erhalten.
2. Die drei Vergleichsrunden auf derselben ausgelieferten Szenarioversion belegen. Für jeden Werkzeugnutzen einen Kontrolllauf liefern; erfolgreiche Gesamtstrategien müssen Budget und Schadensziel einhalten.
3. Maßnahmen vor Beginn, bei laufender Uhr und in Pause prüfen. Platzierungsabweichungen und Neustart nach kombinierten Eingriffen einbeziehen.
4. Maus und Touch getrennt in Hoch- und Querformat prüfen. Einen vollständigen Produktionsbuild-Lauf einschließlich Schadensanzeige und Ergebnis durchführen.
5. Eine Person ohne Testkoordinaten spielt eine vollständige Runde und einen zweiten Versuch. Beobachten, ob sie Bedrohung, Wirkung und Ergebnis erklären und ihren zweiten Versuch gezielt verbessern kann. Falls keine Testperson erreichbar ist, dieses Kriterium offen lassen und den spielbaren Stand für den Nutzer bereitstellen.
6. Echte iPhone-/Android-Geräte und tatsächliches Safari bleiben eigene Kriterien. Emulation und Playwright-WebKit ersetzen sie nicht. Die im Status beschriebene Linux-Gerätesuche nicht ungeprüft auf andere Rechner übertragen.
7. `docs/status.md` und README aktualisieren. Ergebnis anhand einer Kriterienmatrix mit **erfüllt**, **offen** oder **nicht prüfbar** berichten. Erst danach weitere Optimierungen priorisieren.

Erwartete Übergabe: spielbarer Zwischenstand, konkrete Startanleitung, Vergleichstabelle, sichtbarer Wasserverlauf, dokumentierte Eingriffszeitpunkte, aktuelle Prüfbelege und klar abgegrenzte Restlücken. Keine Gesamtfreigabe allein anhand bestandener numerischer Tests.

## Abgrenzung der Review-Prüfungen

Auf dem unveränderten Stand `4673010` bestanden hier 44 Vitest-Tests; die unveränderte Referenzrunde wurde aktuell nachgerechnet. Eine versehentlich begonnene Oberflächenimplementierung durch den Review-Agenten wurde auf Nutzerkorrektur vollständig zurückgenommen. Deren Build und Browserlauf sind **keine Nachweise für den ausgelieferten Stand**. Anwendungscode, Tests und Szenariodaten werden durch diesen Steuerungsauftrag nicht verändert.
