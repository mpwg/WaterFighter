# Spielbarer Prototyp: aktueller Zwischenstand

Stand: 30. Oktober 2026. Szenario `1.6-draft`, Wien-Brigittenau, 800 × 800 m. Dieser Stand ist ein Spielprototyp und keine Hochwasserprognose. Die menschliche Spielabnahme ist offen; mobile Tests sind auf Nutzerwunsch ausgesetzt.

## Lokal starten

Im Projektverzeichnis `bun install --frozen-lockfile` und anschließend `bun run dev` ausführen. Die im Terminal angegebene lokale Adresse im Browser öffnen. Alternativ erstellt `bun run build` den Produktionsbuild und `bun run preview` liefert ihn lokal aus. WebGL2 wird benötigt. Keine öffentliche Veröffentlichung ist eingerichtet.

## Referenzen auf demselben Szenario

Die folgenden numerischen Runden verwenden `1.6-draft`, 300 simulierte Sekunden und Maßnahmen vor Beginn. Schaden umfasst Flut- und gegebenenfalls Abrissverluste; Budget und Werkzeugkosten sind getrennt. Die Beispiele sind keine vorgegebenen Lösungen und keine reale Schutzempfehlung.

| Ansatz | Maßnahmen | Gesamtschaden | Budgetrest |
| --- | --- | ---: | ---: |
| Unbehandelt | keine | 164.817,51 | 10.000 |
| Abschirmen | zwei Dämme | 1.299,32 | 8.800 |
| Ableiten | drei Dämme, südlicher Graben | 2.636,82 | 6.540 |

Die Werte wurden mit `bun tools/reference-strategies.ts` auf dem aktuellen Schadensmodell neu berechnet; ältere [Vergleiche und Kontrollen](review-gebaeudevergleich.md#korrektur-der-dachrelation-auf-16) mit Gräben verwenden die frühere Schadensermittlung; [Wasserbilanzläufe](solverbericht.md#zehn-minuten-auf-16) erfüllen die 0,1-%-Schranke. Ein späterer südlicher Graben erreichte vor der Schadenskorrektur im Produktionsbrowser das Ziel; die aktuelle Produktionsrunde wird erneut geprüft. Ein größeres Gebäude ist ohne vorbereitete Dämme bis zu den getesteten 180 Sekunden [wirtschaftlich abzureißen](review-gebaeudevergleich.md#größerer-abriss-ohne-vorbereitete-dämme), allein aber keine erfolgreiche Strategie. In diesem Modellvergleich sinken insbesondere die Schäden an Millennium City und dem Bahnhofsgebäude. Der erste Referenzdamm hält das Abrissgebäude dagegen unbeschädigt; der Abriss verursacht dann zusätzlichen Verlust. Ein kleiner anderer Abriss ist nach südlichen Dämmen numerisch wirtschaftlich. Diese Beobachtungen beweisen keinen bestimmten Wasserweg oder eine reale Schutzwirkung.

## Kurze Kriterienmatrix

| Kriterium | Stand |
| --- | --- |
| Vorbereitung, Damm, Graben und Abriss | Implementiert; Vorschau, Bestätigung, Budget und Hindernisse automatisiert geprüft. |
| Eingriffe während der Flut und Pause | Implementiert; späte Eingriffe und pausierte Bestätigung im Desktopbrowser geprüft. |
| Schaden, Gebäudezustand und Orientierung | Implementiert; laufende Werte und Gebäudezustände geprüft. Die bestätigte Grabentrasse ist breiter und bis zu offenen Modellrändern verlängert; eine violette Markierung zeigt den Anschluss an einen offenen Modellrand. Die normale Kamera wurde anhand von [Aufnahmen bei 03:00](suedgraben-1.6-uebersicht-180.png) und [04:00](suedgraben-1.6-uebersicht-240.png) geprüft; Richtungspfeile bleiben in der Übersicht klein. Verständlichkeit durch eine unabhängige Person offen. |
| Runde und Neustart | Vollständige Desktoprunden und Neustarts auf 1.6 vor der aktuellen Darstellungsänderung in Safari, Chrome und Firefox automatisiert geprüft; Firefox meldete weiterhin Zugriffsfehler. Eine Chromium-Produktionsrunde mit spätem Graben erreichte vor der Schadenskorrektur das Ziel; die aktuelle Produktionsrunde wird erneut geprüft. Ein [Safari-Kurztest vor der Schadenskorrektur](browser-pruefung.md#safari-kurzprüfung-nach-der-grabendarstellung) prüfte Laden, Start, Pause, Neustart und alle drei Werkzeuge, aber keine vollständige Runde. |
| Drei aufeinanderfolgende Runden | In Chromium auf 1.6 mit allen Werkzeugen und zwei Neustarts automatisiert geprüft. Längerfristige Speicherentwicklung offen. |
| Platzierung | Nach Korrektur einer fehlerhaften Schadensermittlung ergeben drei zuvor auffällige Einzelverschiebungen auf 1.6 rund 2.636 bis 2.655 Schaden gegenüber 2.626 bei der Referenz, jeweils mit Eingriff bei 150 s. Die Vorschau weist nun auf ein Grabenende knapp vor einem offenen Modellrand hin. Fehlertoleranz und Verständlichkeit bleiben begrenzt. |
| Menschlicher Spieltest | Offen: Der Nutzer meldete, dass derzeit keine unabhängige Testperson verfügbar ist. |
| Mobile Geräte | Vorläufig ausgesetzt. |

## Späteres Feintuning und offene Abnahme

- Schadens- und Kostenbalance, weitere robuste Trassen und die Wirkung unterschiedlicher Eingriffszeiten nach dem Prototyp-Meilenstein optimieren.
- Bruchkanten, Durchlässe, reale Wasserwege und die Kombination der Datenlizenzen fachlich einordnen; historische OSM-Rohbytes fehlen.
- Eine unabhängige Person zwei Runden ohne Testkoordinaten spielen lassen und die Verständlichkeit beobachten; siehe [Spieltestablauf](spieltest.md).
- Bei späterer Freigabe echte iPhone- und Android-Geräte sowie deren Leistung prüfen. Emulatoren ersetzen diese Abnahme nicht.

Die ausführliche historische Dokumentation und die vollständige Kriterienmatrix stehen in [status.md](status.md).
