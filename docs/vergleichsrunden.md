# Vergleichsrunden · HQ100

Die reproduzierbare Runde lässt sich mit `bun --bun tools/compare-rounds.ts` ausführen. Alle Läufe verwenden dasselbe HQ100-Szenario, dieselben drei Vorbereitungen (Speichererweiterung für b1, b2 und b3) und die volle Simulationsdauer von 180 Sekunden. Die Tabelle zeigt die Ausgabe am 30. Oktober 2026.

| Strategie | Sicher | Gerettet | In Not | Sachschaden | Bilanzfehler |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ohne Eingriff | 225 | 0 | 385 | 468,473 | 7,049e-12 |
| Alle Wehre offen | 225 | 0 | 385 | 408,400 | 1,705e-11 |
| Alle Wehre geschlossen | 225 | 0 | 385 | 468,473 | 7,049e-12 |
| Alle Wehre erst bei 90 s offen | 225 | 0 | 385 | 360,877 | 1,342e-11 |
| Notdamm d3 bei 0 s | 365 | 0 | 245 | 320,000 | 1,592e-12 |
| Rettung Tulln + Korneuburg ab Beginn | 390 | 165 | 220 | 468,473 | 7,049e-12 |
| Dammöffnung d3 (Wien Nord) bei 52 s | 225 | 0 | 385 | 500,000 | 5,912e-12 |
| Rettung Wien Nord + Zentrum ab Beginn, Öffnung d4 bei 88 s | 365 | 300 | 245 | 594,095 | 6,821e-13 |

„Ohne Eingriff“ lässt die standardmäßig geschlossenen Wehre unangetastet. „Alle Wehre geschlossen“ sendet zu Beginn Schließbefehle; sie sind redundant, weil alle Wehre bereits geschlossen starten. Beide Zeilen sind deshalb absichtlich ein identischer Wasserlauf und bilden keine zwei unterschiedlichen Strategien. „Alle Wehre offen“ gibt allen vier Wehren bei Sekunde 0 einen Öffnungsbefehl. Die Stellzeit beträgt 1,2 Sekunden.

Die verzögerte Wehrstrategie sendet dieselben vier Öffnungsbefehle erst bei Sekunde 90. Der Notdamm d3 wird bei Sekunde 0 mit drei Sekunden Bauzeit beauftragt; er war in diesem Lauf erfolgreich. Beides nutzt dieselben drei Speicher-Vorbereitungen und dieselbe Flut wie die übrigen Zeilen. Der Notdamm ist eine zusätzliche Schutzmaßnahme, kein bloßer Zeitpunktvergleich der Wehrstellung.

Die Rettungsstrategien setzen je ein Team zu Beginn auf die genannten Gemeinden. Die erste Dammöffnung führt Wasser in Wien Nord, die zweite in Wien Zentrum; ein Notdamm wird dabei nicht gebaut. „Sicher“ umfasst die anfangs nicht exponierten Einwohner und gerettete Einwohner exponierter Gemeinden. „In Not“ ist die verbleibende Bevölkerung. Sachschaden ist der mit den Sachwerten gewichtete Schadenswert. Der Bilanzfehler ist `abs(Speichervolumen − Anfangsvolumen − Zufluss + Abfluss)` am Rundenende.

Diese Messung belegt für genau diese Konfiguration, dass Öffnen der Wehre den Sachschaden senkt, ohne in diesem Lauf mehr Menschen zu retten. Spätes Öffnen bei 90 s ergibt hier 360,877 statt 408,400 Schadenspunkte bei sofortigem Öffnen. Der gebaute Notdamm d3 ergibt 365 sichere Menschen und 320,000 Schadenspunkte; sein Nutzen hängt vom Pegel und erfolgreichen Bauabschluss ab. Die gezielte Rettung verbessert die Zahl sicherer Einwohner; eine Dammöffnung kann den Sachschaden erhöhen. Daraus folgt keine allgemeine Rangfolge für andere Vorbereitungen oder Eingriffszeitpunkte. Die Ausgabe der Vergleichsrunde ist deterministisch und dient als reproduzierbarer Modellvergleich, nicht als Nachweis realistischer Hochwasserwirkung.
