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

## Künftige Prozessspeicher-Messung

`tools/observe-three-rounds.mjs` erfasst jetzt auf Linux zusätzlich die Summe von `VmRSS` des Testprozesses und seiner Nachfahren vor und nach jeder Runde. Der Wert kann gemeinsam genutzte Seiten mehrfach zählen und umfasst nicht zuverlässig sämtliche GPU-Speicherzuweisungen; fehlender `/proc`-Zugriff ergibt `null`. Die oben protokollierte Drei-Runden-Messung erfolgte vor dieser Ergänzung und enthält deshalb nur den JavaScript-Heap.

Nach Einführung der Messereignisse und einer sauberen `npm ci`-Installation bestanden auf dem aktuellen Arbeitsstand Build, 30 Vitest-Tests, zwei Python-Tests und 13 automatisierte Chrome-156-Browserprüfungen. Darunter prüfen zwei Tests die Korrelation einer bestätigten Aktion mit dem gerenderten Zustand und die Erfassung durch das Messskript. Die drei vollständigen Runden oben wurden vor dieser Änderung ausgeführt.

## Wiederholung mit Prozessbaum-RSS

Auf Produktionsbuild `998e992`, Szenario `1.2-draft`, wurden mit demselben Chrome und derselben Linux-Umgebung drei weitere ungeschützte 2×-Runden hintereinander ausgeführt. Zeiten: 151,205 / 151,886 / 150,957 s. Alle drei meldeten gerundet 322.752 Schaden und 10.000 Budgetrest; das Protokoll enthält keine Seitenfehler. Die Summe der Linux-`VmRSS`-Werte im Prozessbaum nach jeder Runde betrug 1.384.529.920 / 1.404.665.856 / 1.409.671.168 Bytes; jeweils wurden zehn Prozesse gezählt. Die JavaScript-Heaps nach den Runden lagen bei 34,3 / 40,1 / 41,3 MB. Die drei Stichproben zeigen keinen starken fortlaufenden Anstieg, schließen aber ein langsames Leck nicht aus. RSS kann gemeinsame Seiten mehrfach zählen und GPU-Speicher auslassen. Während dieses Laufs wurden kurz ein Entwicklungsbrowser und numerische Diagnoseläufe parallel ausgeführt; die Werte sind daher keine isolierten Leistungsmessungen.

Danach wurde die Rücksetzung von Kamera und Werkzeugmodus geändert. Der Drei-Runden-Lauf ist deshalb weiterhin für einen vorherigen Build belegt und nicht als vollständige Endabnahme ausgewiesen.

## Wiederholung nach Neustartkorrektur

Auf dem Produktionsbuild von Commit `40ff739` (Szenario `1.2-draft`) liefen am 29. Oktober 2026 drei weitere ungeschützte 2×-Runden nacheinander in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. In diesem Lauf wurden keine weiteren Browser- oder numerischen Tests parallel gestartet. Die Runden dauerten 151,014 / 150,933 / 150,954 s; jede meldete 322.752 Schaden und 10.000 Budgetrest, ohne protokollierten Seitenfehler. Zwischen den Runden wurde die reguläre Neustart-Schaltfläche benutzt.

Der JavaScript-Heap nach den Runden betrug 39.576.440 / 52.637.268 / 33.848.292 Bytes. Die Prozessbaum-RSS-Summe nach den Runden lag bei 1.399.074.816 / 1.418.850.304 / 1.417.220.096 Bytes, jeweils bei zehn Prozessen. Drei Stichproben reichen nicht aus, um langsame Lecks auszuschließen; RSS kann gemeinsame Seiten mehrfach zählen und GPU-Speicher auslassen. Der automatisierte Ablauf bestätigt Start, Ergebnis und Neustart, prüft jedoch nicht jede Bedienung während aller drei Flutphasen und ersetzt keine Mobilgeräteprüfung.

## Statische Auslieferung unter einem Unterpfad

Am 29. Oktober 2026 wurde der Produktionsbuild des Anwendungscodes `82562b8` mit `npm run build` erzeugt und anschließend mit `node tools/verify-static-subpath.mjs` auf einem lokalen statischen HTTP-Server unter `/waterfighter/` geprüft. Der Server bedient nur Dateien unter diesem Präfix und liefert für fehlende Pfade HTTP 404. Google Chrome 156.0.8078.73 unter Linux/Playwright lud die Anwendung, den Worker, das Szenario `1.2-draft`, die benötigten Assets und den Quellenhinweis ohne Fehler. Eine Dammvorschau wurde bestätigt, die Simulation lief bis mindestens 00:01, wurde pausiert und über die Oberfläche neu gestartet. Dieser kurze automatisierte Test belegt die relativen Assetpfade und den Workerstart unter einem Unterpfad; er ersetzt weder eine vollständige Runde unter diesem Pfad noch eine echte Geräteabnahme. `WATERFIGHTER_CHROME` kann den Pfad zu einem verfügbaren Chrome angeben; ohne diese Variable verwendet das Skript den installierten Playwright-Chromium.

## Workerfehler

Nach der Ergänzung der Fehlerbehandlung bestanden Build, 30 Vitest-Tests, zwei Python-Tests und 16 Chrome-156-Browserprüfungen. Zwei neue Browserprüfungen injizieren Worker-Fehlermeldungen bei der Initialisierung beziehungsweise beim Start der Simulation: Die Oberfläche zeigt den Fehler und den Hinweis zum Neuladen; die Simulation bleibt deaktiviert. Die Tests simulieren diese Fehlermeldungen und beweisen nicht jeden möglichen Worker-Ausfall. Der oben dokumentierte Drei-Runden-Lauf erfolgte vor dieser Änderung und muss für die vollständige Endabnahme auf dem endgültigen Anwendungscode wiederholt werden.

## Wiederholung nach Workerfehlerkorrektur

Der Produktionsbuild von Anwendungscode `48d5e8d`, Szenario `1.2-draft`, wurde am 29. Oktober 2026 erneut in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik über `tools/observe-three-rounds.mjs` geprüft. Drei ungeschützte 2×-Runden dauerten 150,939 / 150,958 / 150,900 s; sie meldeten jeweils 322.752 Schaden und 10.000 Budgetrest. Das Protokoll enthält keine Seitenfehler. Weitere Browser- oder Simulationsprüfungen wurden währenddessen nicht gestartet.

Der JavaScript-Heap nach den drei Runden betrug 32.175.461 / 33.140.033 / 53.416.153 Bytes, die Prozessbaum-RSS-Summe 1.395.912.704 / 1.405.493.248 / 1.432.903.680 Bytes bei jeweils zehn Prozessen. Beide Größen stiegen in diesen drei Endstichproben; daraus lässt sich weder ein Leck nachweisen noch ausschließen. Gemeinsame Speicherseiten können mehrfach gezählt werden, GPU-Speicher fehlt möglicherweise, und Garbage Collection beeinflusst den Heap. Der Lauf prüft Start, Ergebnis und Neustart, aber keine vollständige Bedienung während aller drei Flutphasen. Echte Geräte und eine längere Speicheruntersuchung bleiben offen.

## Kurze Neustartrunden mit Garbage Collection

Zur Einordnung der steigenden Stichproben lief am 29. Oktober 2026 `tools/inspect-restart-memory.mjs` auf dem Produktionsbuild von Anwendungscode `48d5e8d`, Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. Das Skript ersetzt testseitig nur die Rundendauer des Szenarios `1.2-draft` durch zwei Sekunden und führt zwölf 2×-Runden mit Neustart durch. Nach jedem Neustart fordert es über das Chrome DevTools Protocol eine Garbage Collection des Seitenkontexts an und liest `Runtime.getHeapUsage` sowie die Linux-Prozessbaum-RSS-Summe. Keine weiteren Browser- oder Simulationsprüfungen wurden parallel gestartet; Seitenfehler wurden nicht protokolliert.

Der belegte Seiten-Heap nach Garbage Collection stieg von 21.125.948 Bytes nach Runde 1 auf 21.681.864 Bytes nach Runde 12 (etwa 0,56 MB). Der Prozessbaum-RSS stieg von 1.424.048.128 auf 1.488.347.136 Bytes (etwa 64,3 MB), jeweils bei zehn Prozessen. Der Verlauf ist ein Anlass zur weiteren Untersuchung, aber kein Beweis für ein Leck: Der RSS-Wert zählt gemeinsame Seiten möglicherweise mehrfach, und Worker-, Browser- und GPU-Speicher sowie Caches sind darin nicht getrennt. Die erzwungene Garbage Collection und Heapmessung betreffen den Seitenkontext, nicht den Worker. Die kurzen Runden sind kein Ersatz für die drei vollen Runden oder eine längere Profileraufnahme.

Eine Wiederholung desselben Zwölf-Runden-Kurztests gruppierte Linux-Prozesse zusätzlich nach Chrome-Prozesstyp und erfasste `Pss` aus `/proc/<pid>/smaps_rollup`, das gemeinsam genutzte Seiten anteilig berücksichtigt. Nach Runde 1 beziehungsweise 12 betrug die PSS-Summe der drei Rendererprozesse 240.151.552 beziehungsweise 282.914.816 Bytes (+42,8 MB); der einzelne Grafikprozess lag bei 129.515.520 beziehungsweise 128.064.512 Bytes. Der Node-Testprozess stieg von 114.333.696 auf 136.725.504 Bytes. Der Seiten-Heap nach erzwungener Garbage Collection stieg von 21.126.276 auf 21.685.516 Bytes; keine Seitenfehler wurden protokolliert. Für alle erfassten Prozesse war PSS verfügbar.

Diese Gruppierung lokalisiert den Anstieg grob, weist aber weder eine Ursache noch ein Leck nach: Die drei Renderer sind gemeinsam erfasst, und Seiten-, Worker-, native und zwischengespeicherte Speicheranteile werden nicht einzeln ausgewiesen. Die Testumleitung liefert das verkürzte Szenario aus dem Node-Prozess; dessen Wachstum ist daher kein direktes Maß für das Spiel. Ein Heap- oder Prozessprofil über längere Zeit und echte Geräte bleibt für eine weitergehende Aussage erforderlich. Die Prozesstypen werden aus Chrome-Argumenten erkannt; fehlender `/proc`-Zugriff kann eine Messung verhindern.

Ein weiterer Zwölf-Runden-Lauf verwendete `tools/inspect-restart-memory.mjs --worker-gc`. Hier startete Chrome zusätzlich mit `--js-flags=--expose-gc`; das Skript löste nach jedem Neustart Garbage Collection im einzigen Spiel-Worker und anschließend im Seitenkontext aus. Die Renderer-PSS-Summe betrug nach Runde 1 und 12 236.525.568 beziehungsweise 228.291.584 Bytes; der Seiten-Heap nach Sammlung lag bei 21.129.264 beziehungsweise 21.664.820 Bytes. Der Node-Testprozess stieg von 114.475.008 auf 137.718.784 Bytes. Keine Seitenfehler wurden protokolliert.

Die zusätzliche Worker-Sammlung ist ein Hinweis darauf, dass noch nicht eingesammelte Worker-Daten zum früheren Rendereranstieg beitragen können. Unterschiedliche Läufe und Garbage-Collection-Zeitpunkte erlauben keine genaue Zuordnung oder den Ausschluss eines Lecks. `--expose-gc` ist ausschließlich ein Testinstrument und keine Voraussetzung des Spiels; die zwölf verkürzten Runden ersetzen weiterhin weder lange Profilerläufe noch reale Gerätetests.

Nach der Worker-Korrektur gegen Aktionen nach einem Simulationsfehler bestanden Produktionsbuild, 31 Vitest-Tests, zwei Python-Tests und 16 Chrome-Browserprüfungen. Ein neuer Controller-Test erzwingt einen Fehler unmittelbar vor einer Aktion, überprüft das Ausbleiben der Aktion und weiterer Starts und bestätigt die Wiederaufnahme nach einem sauberen Worker-Neustart. Die vollständigen Drei-Runden- und Speicherläufe oben stammen von vor dieser Worker-Änderung; sie müssen für eine Endabnahme auf dem endgültigen Stand wiederholt werden.

## Drei Runden mit Bedienung nach der Worker-Sperre

Auf dem Produktionsbuild des Anwendungscodes `47de8e8`, Szenario `1.2-draft`, liefen am 29. Oktober 2026 drei ungeschützte 2×-Runden in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. In jeder Runde pausierte `tools/observe-three-rounds.mjs` bei 00:02, betätigte beide Zoomknöpfe, prüfte die angehaltene Zeitanzeige und setzte die Simulation fort. Ergebnisse und reguläre Neustarts waren erreichbar; Seitenfehler wurden nicht protokolliert. Die Laufzeiten einschließlich der Bedienung betrugen 154,060 / 153,964 / 154,035 s, bei jeweils 322.752 Schaden und 10.000 Budgetrest.

Der Seiten-Heap nach den Runden betrug 43.397.662 / 39.169.718 / 55.474.138 Bytes; die Prozessbaum-RSS-Summe 1.401.016.320 / 1.408.233.472 / 1.430.786.048 Bytes bei je zehn Prozessen. Diese drei Stichproben und die frühen Bedienaktionen schließen weder langsame Speicherprobleme noch alle Bedienungsfehler aus. Die früheren Untersuchungen mit Garbage Collection und ihre Grenzen stehen oben; mobile Geräte bleiben ungeprüft.

## Aktualisierte Abhängigkeiten

Am 29. Oktober 2026 wurde TypeScript auf die stabile Version 7.0.2 aktualisiert. `npm outdated` meldete anschließend keine veralteten direkten npm-Pakete; die festgelegten Python-Geodaten- und Plot-Pakete entsprachen den aktuellen stabilen Versionen laut Paketindex. Indirekte npm-Abhängigkeiten können aufgrund der Versionsvorgaben ihrer Elternpakete hinter deren neuesten Hauptversionen liegen. `npm ci` und `npm audit` meldeten keine bekannten Sicherheitslücken. Der Build, 31 Vitest-Tests, zwei Python-Tests, 16 Chrome-156-Browsertests und der statische Unterpfadtest bestanden. npm meldete ein blockiertes esbuild-Installationsskript; die installierte plattformspezifische Binärdatei funktionierte bei den ausgeführten Prüfungen. Der Drei-Runden-Lauf und die vollständige Strategie oben wurden vor dem Compilerwechsel durchgeführt.

## Drei Runden mit TypeScript 7

Am 29. Oktober 2026 wurden auf dem mit TypeScript 7.0.2 erzeugten Produktionsbuild von Commit `4251f2e`, Szenario `1.2-draft`, erneut drei ungeschützte 2×-Runden mit `tools/observe-three-rounds.mjs` in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik durchgeführt. Pause, Zoom und Fortsetzen bei 00:02 sowie die regulären Neustarts funktionierten. Die Runden dauerten einschließlich Bedienung 154,041 / 154,138 / 154,118 s und meldeten jeweils 322.752 Schaden und 10.000 Budgetrest. Seitenfehler wurden nicht protokolliert.

Der Seiten-Heap nach den Runden betrug 43.773.390 / 44.551.226 / 43.024.046 Bytes, die Prozessbaum-RSS-Summe 1.400.586.240 / 1.413.263.360 / 1.422.331.904 Bytes bei jeweils zehn Prozessen. Der Heap steigt nicht durchgehend; der RSS-Anstieg und die früheren Untersuchungen lassen langsame Speicherprobleme weiterhin nicht ausschließen. Diese Desktopprüfung ersetzt keine echte Geräteabnahme und prüft nicht jede Bedienung während der gesamten Runde.

## Drei Runden nach Optimierung der Wasserdarstellung

Der Produktionsbuild `3bbc7af`, Szenario `1.2-draft`, absolvierte am 29. Oktober 2026 drei ungeschützte 2×-Runden in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik. Pause, Zoom, Fortsetzen und Neustarts funktionierten; es gab keine protokollierten Seitenfehler. Die Runden dauerten 153,097 / 152,992 / 153,034 s und endeten jeweils mit 322.752 Schaden und 10.000 Budgetrest. Nach den Runden betrug der Seiten-Heap 73.456.545 / 74.860.001 / 73.885.765 Bytes, die RSS-Summe im Prozessbaum 1.465.413.632 / 1.457.942.528 / 1.474.433.024 Bytes bei je zehn Prozessen. Die Stichproben schwanken ohne durchgehend steigende Folge, schließen langsame Speicherprobleme aber nicht aus. Die automatisierte Desktopprüfung ersetzt keine Prüfung auf echten Geräten.

## Firefox nach Wasseroptimierung

Am 29. Oktober 2026 prüfte `tools/observe-firefox.mjs` den Produktionsbuild mit Anwendungscode `3bbc7af` und Szenario `1.2-draft` im offiziellen Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik. Laden, Start, Pause und Neustart funktionierten; Vorschau und Bestätigung von Graben, Damm und Abriss waren bedienbar. Nach erneutem Neustart erreichte eine vollständige ungeschützte 2×-Runde nach 150,312 s das Ergebnis mit 322.753 Schaden und 10.000 Budgetrest.

Vor der erfolgreichen Prüfung fehlte zunächst ein WebGL-Kontext. Nach Konfiguration des virtuellen X-Servers mit Mesa-Treiberpfad und Softwaregrafik funktionierte WebGL. In der verwendeten Testumgebung zeigte der Screenshot fehlende Schriftglyphen; die textliche Darstellung wurde daher nicht visuell abgenommen, obwohl die DOM-Texte per WebDriver geprüft wurden. Die automatisierten Klickpositionen hängen von der Fenstergröße ab. Dies ist keine manuelle Desktopabnahme und ersetzt weder Safari noch reale Mobilgeräte.

In einem weiteren kurzen Firefox-159-Lauf auf demselben optimierten Build wurde in dieser isolierten Testumgebung `MOZ_DISABLE_CONTENT_SANDBOX=1` gesetzt, damit Firefox die lokal unter `/tmp` bereitgestellten Testschriften lesen konnte. Der Screenshot zeigte anschließend lesbare deutsche Texte; Laden, Start, Pause, Neustart und die Bestätigung aller drei Werkzeuge funktionierten erneut. Der Test wählte beim Abriss nach Bedarf ein anderes bezahlbares Gebäude. Die Sandbox-Deaktivierung diente ausschließlich diesem lokalen Diagnoseversuch und ist keine Anwendungsvoraussetzung; es bleibt ein automatisierter virtueller Desktoptest ohne vollständige Runde in dieser Konfiguration.
