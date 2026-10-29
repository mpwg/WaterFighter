# Browser- und Stabilitätsprüfung

Stand: 29. Oktober 2026. Diese Nachweise ersetzen nicht die geforderte Abnahme auf echten Mobilgeräten und in tatsächlichem Safari.

## Drei aufeinanderfolgende Runden

Der lokale Produktionsbuild des Arbeitsstands `01bacb5`, Szenario `1.2-draft`, wurde mit `WATERFIGHTER_CHROME=/tmp/wf-browsers/chrome/opt/google/chrome/chrome node tools/observe-three-rounds.mjs` in Google Chrome 156.0.8078.73 unter Linux/Playwright ausgeführt. Drei ungeschützte Runden mit 2× Geschwindigkeit liefen nacheinander ohne Seitenfehler bis zum Ergebnis; die gemessenen Zeiten waren 151,034, 151,048 und 150,973 s. Jede Runde meldete gerundet 322.752 Flutschaden und 10.000 Budgetrest.

Die erfassten JavaScript-Heaps vor/nach den Runden betrugen 60,4/42,9 MB, 43,6/45,9 MB und 46,6/33,3 MB. Es zeigte sich darin kein fortlaufender Anstieg. Der gesamte Browser-, GPU- und Worker-Prozessspeicher wurde nicht separat erfasst; damit ist ein fortschreitendes Speicherproblem nicht umfassend ausgeschlossen. Ein kurzer separater Browserlauf zur HiDPI-Auswahl und kurze Unit-Tests liefen während der ersten Runde parallel. Der frühere Fehlversuch, bei dem der Browser in Runde drei während mehrerer gleichzeitiger Tests geschlossen wurde, bleibt ungeklärt. Der spätere Arbeitsstand änderte die Karten-Auswahlkoordinaten und Tests, nicht die Simulation dieser ungeschützten Runden. Eine Wiederholung auf dem endgültigen Build und auf den Zielgeräten bleibt erforderlich.

## Desktop-Browser

- Google Chrome 156.0.8078.73: elf automatisierte Playwright-Abläufe des späteren Produktionsbuilds, einschließlich Werkzeugen, Touch-Emulation und Fehlerszenarien. Headless-Linux mit Softwaregrafik.
- Mozilla Firefox 159.0: auf virtuellem Linux-Desktop mit Mesa-Softwaregrafik über geckodriver 0.37.1. Laden, Start, Pause, Neustart und Bestätigung aller drei Werkzeuge wurden auf dem späteren Produktionsbuild geprüft. Eine vollständige 2×-Runde ohne Maßnahmen wurde auf dem vorigen Build abgeschlossen.
- Safari: in der vorliegenden Linux-Umgebung nicht verfügbar. Playwright-WebKit wurde nicht als Safari gewertet.

Die Tests sind automatisiert. Es wurden keine vollständigen manuellen Desktop-Abnahmen oder echten iPhone-/Android-Tests durchgeführt. Die gemessenen Desktopwerte belegen keine mobilen Framezeiten, Aktionslatenzen oder mobile Echtzeitfähigkeit.
