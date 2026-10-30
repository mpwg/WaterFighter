# Spielbarer Prototyp: aktueller Zwischenstand

Stand: 30. Oktober 2026. Szenario `1.6-draft`, Wien-Brigittenau, 800 × 800 m. Der Prototyp ist ein Arcade-Spiel und keine Hochwasserprognose. Eine menschliche Spielabnahme steht aus; mobile Tests sind auf Nutzerwunsch ausgesetzt.

## Lokal starten

Im Projektverzeichnis `bun install --frozen-lockfile` und anschließend `bun run dev` ausführen. Die im Terminal angezeigte lokale Adresse im Browser öffnen. Die vollständige Anleitung steht in der [README](../README.md#in-vs-code-selbst-starten). WebGL2 wird benötigt. Keine öffentliche Veröffentlichung ist eingerichtet.

## Arcade-Platzierung

Dämme und Gräben werden als breite Strukturen angelegt: Dämme belegen bis zu drei benachbarte Sperrkanten, Gräben die gezeichneten Zellen und ihre direkten orthogonalen Nachbarn. Diese Geometrie wirkt in der Wasserberechnung und wird für die Vorschau vom Worker geliefert. Nahe Enden können sich innerhalb von zwei Rasterzellen mit bestehenden Maßnahmen oder passenden Kartenrändern verbinden. Die Vorschau nennt automatische Verbindungen und Kosten; überlappende Teile werden nicht erneut bezahlt.

Liegt ein Gebäude auf der Grabenmittellinie, wird die Maßnahme abgelehnt. Gebäudezellen am Rand der Grabenfläche werden ausgespart und in der Vorschau ausdrücklich genannt. Es wird kein Gebäude automatisch abgerissen. Die genaue Fläche, Hindernisse und Kosten vor Bestätigung prüfen.

## Vergleich auf demselben Szenario

Numerische Runden mit `bun tools/reference-strategies.ts STRATEGIE --wide`, jeweils 300 simulierte Sekunden und Maßnahmen vor Beginn. Die alten Vergleiche mit schmalen Werkzeugen und älterer Schadensermittlung sind historisch. Schaden umfasst Flut- und Abrissverluste; Budget und Werkzeugkosten sind getrennt. Die Beispiele sind keine reale Schutzempfehlung.

| Ansatz | Gesamtschaden | Budgetrest |
| --- | ---: | ---: |
| Unbehandelt | 164.817,51 | 10.000 |
| Abschirmen: zwei breite Dämme | 3.567,78 | 8.800 |
| Südliche Dammkontrolle | 7.406,84 | 8.240 |
| Südliche Dämme und breiter Graben | 4.366,75 | 6.890 |
| Nördliche Dammkontrolle | 3.302,13 | 8.160 |
| Nördliche Dämme und breiter Graben | 2.598,50 | 7.501 |

Alle relativen Wasserbilanzfehler lagen unter 0,1 %. Der südliche Graben kostet 1.350 und reduziert den Schaden gegenüber seiner Dammkontrolle um rund 3.040; der nördliche kostet 659 und reduziert ihn um rund 704. Diese Rechenläufe verwenden feste Referenzkoordinaten und belegen keine menschliche Auffindbarkeit.

## Kurze Kriterienmatrix

| Kriterium | Stand |
| --- | --- |
| Breite, Anschlüsse, Überlappung und Kosten | Implementiert; Worker-Regeltests sowie Desktop-Mausprüfungen mit überlappenden und leicht verschobenen Maßnahmen bestanden. Menschliche Verständlichkeit offen. |
| Hindernisse und Wasserbilanz | Gebäude auf der Mittellinie blockieren; ausgesparte Randzellen werden angezeigt. Regeltests prüfen atomare Aktionen und Wassererhaltung. |
| Eingriffe bei Flut und Pause | Alle Werkzeuge sowie angeschlossene Dämme in Desktopbrowsern geprüft; mobile Geräte ausgesetzt. |
| Vollständige Runde und Neustart | Ein Chromium-Produktionslauf mit breitem Graben während der Flut erreichte das Ergebnis und bestand den Neustart; die Testmaßnahme verfehlte das Schadensziel. |
| Schutzansätze | Zwei bezahlbare Ansätze auf demselben Szenario numerisch unter dem Schadensziel; menschliches Auffinden offen. |
| Menschlicher Spieltest | Offen; der Nutzer möchte selbst spielen. |
| Safari | Der letzte automatisierte Ergebnisneustart vor den breiten Werkzeugen schlug fehl; Ursache offen. |
| Mobile Geräte und Leistung | Auf Nutzerwunsch ausgesetzt. |

Eine unabhängige Person kann den [Spieltestablauf](spieltest.md) für zwei Versuche verwenden. Die ausführliche Chronologie und Kriterienmatrix stehen in [status.md](status.md).
