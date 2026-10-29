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

## Drei Runden mit Szenario 1.3

Der Produktionsbuild `4bd9fbe`, Szenario `1.3-draft`, absolvierte am 29. Oktober 2026 drei ungeschützte 2×-Runden mit `tools/observe-three-rounds.mjs` in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik. Pause, Zoom, Fortsetzen und die regulären Neustarts funktionierten; Seitenfehler wurden nicht protokolliert. Die Runden dauerten 153,073 / 153,065 / 153,081 s und endeten jeweils mit 140.415 Schaden und 10.000 Budgetrest.

Der Seiten-Heap nach den Runden betrug 56.003.849 / 50.495.437 / 99.569.497 Bytes, die RSS-Summe im Prozessbaum 1.445.933.056 / 1.457.893.376 / 1.482.047.488 Bytes bei je zehn Prozessen. Der Heap schwankt und ist bei der letzten Stichprobe höher; die RSS-Summe steigt über die drei Stichproben. Weder ein langsames Leck noch normale Schwankungen durch Garbage Collection und Caches können damit ausgeschlossen werden. Die frühere Untersuchung mit erzwungener Seiten- und Worker-Garbage-Collection bezog sich auf einen vorherigen Build. Dieser Desktoplauf ersetzt keine echte Geräteabnahme und prüft nicht jede Bedienung über die gesamte Flutphase.

## Speichervergleich mit Szenario 1.3

Am 29. Oktober 2026 wurden auf Produktionsbuild `4bd9fbe`, Szenario `1.3-draft`, die beiden Zwölf-Kurzrunden-Tests aus `tools/inspect-restart-memory.mjs` in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik wiederholt. Jede Runde wurde testseitig auf zwei simulierte Sekunden verkürzt. Ohne zusätzliche Worker-Garbage-Collection stieg die PSS-Summe der Rendererprozesse nach Runde 1 bis 12 von 240.854.016 auf 283.122.688 Bytes; der Seiten-Heap nach Sammlung stieg von 20.229.640 auf 20.792.040 Bytes. Mit `--worker-gc` lag die Renderer-PSS-Summe nach Runde 1 und 12 bei 236.559.360 beziehungsweise 228.855.808 Bytes; der Seiten-Heap nach Sammlung bei 20.233.292 beziehungsweise 20.812.548 Bytes. Beide Läufe protokollierten keine Seitenfehler.

Die Ergebnisse sind mit dem früheren Hinweis auf noch nicht eingesammelte Worker-Daten vereinbar. Unterschiedliche Läufe, Caches und die erzwungene Sammlung verhindern eine eindeutige Ursachenzuordnung; insbesondere schließen die kurzen Runden ein Leck bei längerer Flut oder auf Mobilgeräten nicht aus. Prozessgruppen, PSS und Testbedingungen sind oben beschrieben; `--expose-gc` ist nur ein Diagnoseinstrument.

## Firefox mit Szenario 1.3

Am 29. Oktober 2026 prüfte `tools/observe-firefox.mjs` den Produktionsbuild `4bd9fbe` mit Szenario `1.3-draft` im offiziellen Firefox 159.0 über geckodriver 0.37.1. Laden, Start, Pause, Neustart sowie Vorschau und Bestätigung aller drei Werkzeuge funktionierten. Eine anschließende ungeschützte 2×-Runde erreichte nach 150,956 s das Ergebnis mit 140.414 Schaden und 10.000 Budgetrest; der Screenshot zeigte die Ergebnisanzeige mit lesbaren Texten.

Der Lauf verwendete einen virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik und deaktivierter Firefox-Content-Sandbox für die temporären Testschriften. Dies ist ein automatisierter Umgebungstest, keine manuelle Abnahme unter regulären Browsersicherheitseinstellungen und kein Ersatz für Safari oder echte Mobilgeräte.

## Wiederverwendung der Darstellungsdaten

Die Darstellung kopiert Tiefen-Snapshots nun in einen bestehenden Puffer und aktualisiert vorhandene Strömungsmarker statt sie bei jedem Snapshot neu anzulegen. Ein Vitest prüft insbesondere, dass spätere Änderungen am zurückgegebenen Snapshot die gespeicherte Tiefenabfrage nicht verändern und dass die Marker aktualisiert werden. Produktionsbuild, 34 Vitest-Tests und 19 Chrome-Browserprüfungen bestanden.

Ein erneuter Zwölf-Kurzrunden-Test mit Szenario `1.3-draft`, Chrome 156.0.8078.73 und erzwungener Seiten- und Worker-Garbage-Collection ergab für die Renderer-PSS-Summe nach Runde 1 und 12 236.818.432 beziehungsweise 229.062.656 Bytes und für den Seiten-Heap 20.237.404 beziehungsweise 20.815.248 Bytes; Seitenfehler wurden nicht protokolliert. Diese Stichproben ähneln dem vorigen GC-Lauf und belegen keine messbare Leistungsverbesserung oder das Fehlen langsamer Lecks. Vollständige Runden und echte Geräte müssen nach der Darstellungsänderung erneut geprüft werden.

## Drei Runden nach Wiederverwendung der Darstellungsdaten

Auf Produktionsbuild `9cd0aac`, Szenario `1.3-draft`, liefen am 29. Oktober 2026 drei ungeschützte 2×-Runden mit `tools/observe-three-rounds.mjs` in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik. Pause, Zoom, Fortsetzen und Neustarts funktionierten; Seitenfehler wurden nicht protokolliert. Die Runden dauerten 153,032 / 153,082 / 152,951 s und endeten jeweils mit 140.415 Schaden und 10.000 Budgetrest.

Der Seiten-Heap nach den Runden betrug 54.573.088 / 78.735.526 / 56.626.986 Bytes, die RSS-Summe im Prozessbaum 1.445.580.800 / 1.458.442.240 / 1.459.986.432 Bytes bei je zehn Prozessen. Der Heap schwankt, die RSS-Summe steigt leicht; aus drei Stichproben lässt sich kein langsames Leck ausschließen. Die Messung ersetzt keine echte Geräteabnahme und prüft nicht jede Bedienung über die gesamte Flutphase.

Nach Ergänzung direkter Repositorylinks zu Geodatenprüfung und Aufbereitung bestanden Produktionsbuild, 34 Vitest-Tests, 19 Chrome-Browserprüfungen und die statische Unterpfadprüfung. Der Quellenhinweis ist im ausgelieferten Paket vorhanden; die endgültige rechtliche Einordnung und dauerhafte externe Verfügbarkeit der exakten Rohdaten bleiben offen. Die vollständigen Drei-Runden-Läufe oben erfolgten vor dieser textlichen Änderung der Anwendungsoberfläche.

Nach Ergänzung der Worker-Start- und Nachrichtenfehlerbehandlung bestanden Produktionsbuild, 34 Vitest-Tests und 21 Chrome-Browserprüfungen. Ein Browserfall lässt den Worker-Konstruktor scheitern; ein weiterer ruft den registrierten `messageerror`-Handler mit einem synthetischen Ereignis auf und prüft Fehleranzeige sowie Worker-Beendigung. Die UI fordert jeweils zum Neuladen auf. Der zweite Fall simuliert den Handleraufruf, keine echte Browser-Deserialisierungspanne. Der Drei-Runden-Lauf oben erfolgte vor dieser Anwendungsänderung und muss für die Endabnahme erneut geprüft werden.

## Drei Runden nach erweiterter Worker-Fehlerbehandlung

Auf Produktionsbuild `ec8e054`, Szenario `1.3-draft`, liefen am 29. Oktober 2026 drei ungeschützte 2×-Runden mit `tools/observe-three-rounds.mjs` in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik. Pause, Zoom, Fortsetzen und Neustarts funktionierten; Seitenfehler wurden nicht protokolliert. Die Runden dauerten 153,211 / 152,997 / 152,981 s und endeten jeweils mit 140.415 Schaden und 10.000 Budgetrest.

Der Seiten-Heap nach den Runden betrug 47.292.510 / 60.261.730 / 47.630.514 Bytes, die RSS-Summe im Prozessbaum 1.434.931.200 / 1.460.142.080 / 1.456.439.296 Bytes bei je zehn Prozessen. Beide Werte schwanken ohne durchgehenden Anstieg, schließen aber langsame Speicherprobleme nicht aus. Die automatisierte Desktopprüfung ersetzt keine echte Geräteabnahme und prüft nicht jede Bedienung über die gesamte Flutphase.

## Drei Runden mit wiederverwendetem Wasser-Indexpuffer

Auf Produktionsbuild `599463a`, Szenario `1.3-draft`, liefen am 29. Oktober 2026 drei ungeschützte 2×-Runden mit `tools/observe-three-rounds.mjs` in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik. Pause, Zoom, Fortsetzen und Neustarts funktionierten; Seitenfehler wurden nicht protokolliert. Die Runden dauerten 153,136 / 153,054 / 152,987 s und endeten jeweils mit 140.415 Schaden und 10.000 Budgetrest.

Der Seiten-Heap nach den Runden betrug 33.964.452 / 30.247.072 / 31.684.488 Bytes, die RSS-Summe im Prozessbaum 1.394.540.544 / 1.414.283.264 / 1.427.746.816 Bytes bei je zehn Prozessen. Der Heap schwankt, die RSS-Summe steigt; drei Stichproben können langsame Speicherprobleme nicht ausschließen. Die automatisierte Desktopprüfung ersetzt keine echte Geräteabnahme.

## Gezielte Babylon-Imports

Am 29. Oktober 2026 wurde der Babylon-Gesamtimport durch direkte Imports der benötigten Module ersetzt; Auswahl und Abrissmarkierung registrieren ihre Babylon-Komponenten ausdrücklich. Im Vergleich zum Produktionsbuild `390c4ec` sank das Haupt-JavaScript von 6.935,80 kB (gzip 1.523,27 kB) auf 1.047,90 kB (gzip 251,90 kB); Vite transformierte 478 statt 3.159 Module. Dies sind Buildgrößen der jeweiligen Hauptdatei, nicht die gesamten übertragenen Daten oder ein Framerate-Nachweis.

Build, 35 Vitest-Tests und 21 Chrome-156-Browserprüfungen bestanden; ebenso der statische Unterpfadtest. In Chrome unter Linux mit Softwaregrafik wurden die Canvas-Screenshots der pausierten Ausgangsansicht und einer Abrissvorschau auf je 1.200 × 800 Pixel verglichen: Beide Paare waren bytegleich. Der Vergleich deckt nur diese Zustände und diese Umgebung ab. Die statischen Testserver meldeten eine fehlende Favicon-Datei; Seitenfehler traten nicht auf. Safari und echte Geräte bleiben ungeprüft.

## Drei Runden mit gezielten Babylon-Imports

Auf dem Produktionsbuild `493b6de` mit Szenario `1.3-draft` wurden am 29. Oktober 2026 drei ungeschützte 2×-Runden nacheinander in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik ausgeführt. Pause, Zoom, Fortsetzen und Neustart funktionierten; Seitenfehler wurden nicht protokolliert. Die Runden dauerten 153,087 / 153,072 / 153,135 s und ergaben jeweils 140.415 Schaden und 10.000 Budgetrest. Der Seiten-Heap nach den Runden betrug 22.306.462 / 21.476.434 / 20.989.446 Bytes, die Prozessbaum-RSS-Summe 1.379.258.368 / 1.392.025.600 / 1.407.623.168 Bytes bei je zehn Prozessen. Diese Stichproben schließen langsame Speicherprobleme nicht aus; der Desktoplauf ersetzt keine echte Geräteabnahme. Die Messung erfolgte vor der Bun-Migration.

## Strategie und Auswahl mit Bun

Am 29. Oktober 2026 wurden die Diagnosewerkzeuge auf die gezielten Babylon-Imports und einen wählbaren Entwicklungsserver angepasst. Mit Bun 1.4.4, Vite und Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik erreichte `bun tools/verify-highdpi-picking.mjs` bei verdoppelter Babylon-Renderauflösung die erwartete Dammvorschau mit Kosten von 800. Anschließend setzte `bun tools/observe-strategy-browser.mjs` im Entwicklungsserver auf Anwendungscode `4b425fc` die elf Dammabschnitte der Referenzstrategie per Oberfläche und spielte Szenario `1.3-draft` vollständig bei 2×: 35.144 Schaden, 2.600 Budgetrest, Ziel erreicht, 150,899 s, keine protokollierten Seitenfehler. `WATERFIGHTER_URL` und `WATERFIGHTER_CHROME` wählen Server und Browser. Die Klickkoordinaten werden testseitig berechnet; dieser Lauf ersetzt keine menschliche Bedienung oder Geräteabnahme und ist kein Produktionsbuild-Lauf.

## Mehrfinger-Eingabe

Am 29. Oktober 2026 wurde die Pointer-Zuordnung korrigiert: Ein weiterer Kontakt übernimmt eine laufende Kartenberührung nicht, und nur deren eigener Abschluss, Abbruch oder Verlust der Pointer-Capture beendet sie. Ein Chrome-156-Test sendet zwei überlappende Touchkontakte und hebt den zweiten zuerst ab; erst das Abheben des ersten setzt den Startpunkt, danach lässt sich der Endpunkt wählen und eine Dammvorschau erzeugen. Auf dem geänderten Produktionsbuild bestanden 22 Chrome-Browserprüfungen, Build und 35 Vitest-Tests mit Bun 1.4.4. Dies ist ein automatisierter Test unter Linux und keine Abnahme auf einem echten Touchgerät; weitere Mehrfinger-Gesten werden nicht angeboten.

## Maßnahmendetails in der Vorschau

Die Vorschau zeigt zusätzlich zu Kosten und verbleibendem Budget die Dammhöhe über der höheren benachbarten Sohle beziehungsweise die Geländeabsenkung des Grabens. Bei einem Gebäudeabriss nennt sie den vollständigen Gebäudeverlust; dieser ersetzt bereits verbuchten Flutschaden des Gebäudes und wird nicht zu ihm addiert. Die Werte stammen aus dem geladenen Szenario. Die Browserprüfungen kontrollieren alle drei Angaben sowie Vorschau und Bestätigung; die bestehenden Touch-Abläufe im simulierten Hoch- und Querformat bestehen auch mit dem längeren Text. Am 29. Oktober 2026 bestanden Build, 37 Vitest-Tests, 22 Chrome-156-Browserprüfungen und der statische Unterpfadtest unter Bun 1.4.4. Echte Geräte und Safari bleiben ungeprüft.

## Moduswechsel während einer Berührung

Ein bereits begonnener Kartenkontakt wird nach jedem Wechsel des Bedienmodus verworfen, selbst wenn anschließend zum ursprünglichen Modus zurückgewechselt wird. So kann das Loslassen einer Kameraberührung keinen Baupunkt setzen. Eine Chrome-Prüfung sendet dafür einen echten automatisierten Touchkontakt, wechselt währenddessen die Werkzeugtasten und prüft anschließend eine reguläre Dammvorschau. Am 29. Oktober 2026 bestanden Build, 37 Vitest-Tests und 23 Chrome-156-Browserprüfungen unter Bun 1.4.4. Dies ist keine Prüfung auf einem echten Mobilgerät.

## Drei Runden nach Solver- und Bedienkorrekturen

Am 29. Oktober 2026 führte `bun tools/observe-three-rounds.mjs` auf dem Produktionsbuild von Anwendungscode `2a4f212` mit Szenario `1.3-draft` drei unbehandelte 2×-Runden nacheinander in Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik aus. Pause, Zoom, Fortsetzen und Neustart funktionierten; Seitenfehler wurden nicht protokolliert. Die Runden dauerten 153,090 / 153,089 / 153,113 s und ergaben jeweils 140.415 Schaden sowie 10.000 Budgetrest. Der Seiten-Heap nach den Runden betrug 23.212.959 / 28.910.411 / 20.626.491 Bytes; die RSS-Summe des Testprozessbaums 1.354.350.592 / 1.368.084.480 / 1.376.100.352 Bytes bei je zehn Prozessen. Die RSS-Summe kann gemeinsam genutzte Seiten mehrfach zählen; drei Stichproben schließen ein langsames Speicherproblem nicht aus. Der Lauf prüft nicht jede Bedienung über die gesamte Flutphase und ersetzt keine reale Geräteabnahme. Die früher abgebrochenen Aufzeichnungsläufe und ihre unbekannte Ursache bleiben im [Solverbericht](solverbericht.md#sichtprüfung-im-laufenden-produktionsbuild) dokumentiert.

## Dammvorschau über unebenem Gelände

Die Dammvorschau berechnete zuvor ihre Höhe nur aus einer der beiden Nachbarzellen; der Worker setzt die bestätigte Krone dagegen über der höheren Sohle. Beide verwenden nun dieselbe Berechnung. Vorschau und bestätigte Linie werden jeweils 0,5 m oberhalb der modellierten Krone dargestellt, um sichtbar zu bleiben; das verändert die physikalische Höhe nicht. Ein Test mit unterschiedlich hohen Nachbarzellen prüft beide Kantenrichtungen und vergleicht die Vorschauposition mit der vom Spielzustand bestätigten Krone. Am 29. Oktober 2026 bestanden Build, 38 Vitest-Tests und 23 Chrome-156-Browserprüfungen mit Bun 1.4.4. Der numerische Referenzlauf der Dammstrategie in `1.3-draft` ergab 35.146,35 Schaden, 2.600 Budgetrest und einen relativen Bilanzfehler von 2,68 × 10⁻¹³; das Ziel bleibt erreicht. Echte Geräte bleiben ungeprüft.

## OSM-Straßen und Wege im Spiel

Die Oberfläche stellt nun Straßen- und Weglinien aus dem Szenariopaket als Orientierung auf dem Gelände dar. Wege mit Brücken- oder Tunnelkennzeichnung werden ausgelassen, weil für ihre Tragwerke beziehungsweise Tunnel keine verlässlichen Höhen vorliegen. Im Szenario `1.3-draft` werden 375 von 422 Straßen-/Wegabschnitten dargestellt; die Linien werden höchstens alle 2 m abgetastet und folgen den Dreiecken des Geländemeshs. Nach einer Geländeänderung werden ihre Höhen aus dem Workerzustand aktualisiert. Die Linien sind nicht auswählbar und verändern die Simulation nicht. Bei Überflutung liegt die Wasserfläche über ihnen. Die [Kartenansicht](strassen-kartenansicht.png) wurde am 29. Oktober 2026 in Chrome 156 unter Linux mit Softwaregrafik aufgenommen; sie ist keine Sichtprüfung auf einem echten Mobilgerät.

Build, 41 Vitest-Tests und 23 Chrome-Browserprüfungen bestanden. Drei gezielte Tests prüfen die Geländeinterpolation, das Auslassen von Brücken und Tunneln und die Anpassung der Linien bei einer Geländeänderung. Für einen kurzen Leistungsindikator wurden auf demselben Rechner je zwei 15-s-Ausschnitte bei 1× mit 1.200 × 800 CSS-Pixeln in der Reihenfolge alt, neu, neu, alt gemessen. Die 95. Perzentile der Frameabstände lagen bei 66,8 / 83,3 / 66,8 / 83,3 ms, bei 234 / 226 / 230 / 230 erfassten Frames; Seitenfehler wurden nicht protokolliert. Die Werte schwanken, liegen alle über dem mobilen Ziel von 33,3 ms und erlauben weder eine belastbare Aussage zum Einfluss der Linien noch eine mobile Leistungsabnahme.

## Drei Runden mit Straßenlinien

Am 29. Oktober 2026 wurden auf dem Produktionsbuild `c98eeb2` mit Szenario `1.3-draft` drei unbehandelte 2×-Runden nacheinander mit `bun tools/observe-three-rounds.mjs` ausgeführt: Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik. Pause, Zoom, Fortsetzen und Neustart funktionierten; Seitenfehler wurden nicht protokolliert. Die Runden dauerten 153,165 / 153,114 / 153,151 s und ergaben jeweils 140.415 Schaden und 10.000 Budgetrest. Der Seiten-Heap nach den Runden betrug 25.871.770 / 18.839.878 / 28.120.562 Bytes; die Prozessbaum-RSS-Summe 1.346.801.664 / 1.363.361.792 / 1.377.882.112 Bytes bei je zehn Prozessen. Die RSS-Summe kann gemeinsam genutzte Seiten mehrfach zählen. Drei Stichproben schließen langsame Speicherprobleme nicht aus; der Test prüft nicht jede Bedienung während der Runde und ersetzt keine echte Geräteabnahme.

## Geländeaktualisierung bei Aktionen

Seit dieser Änderung werden Gelände, Straßenlinien und vermessene Kanten nur dann neu übertragen beziehungsweise aufgebaut, wenn ein Worker-Snapshot tatsächlich geänderte Bodenhöhen enthält. Dämme und Gebäudestatus werden bei jeder neuen Zustandsrevision weiterhin aktualisiert. Ein Test prüft den ausbleibenden Geländetransfer bei einem Gebäudestatuswechsel und anschließend die Aktualisierung nach einer Höhenänderung. Am 29. Oktober 2026 bestanden Build, 42 Vitest-Tests und 23 Chrome-156-Browserprüfungen. Die Screenshots vor und nach der Änderung waren nach Bestätigung desselben Damms in der pausierten Vorbereitung bytegleich (1.200 × 800 CSS-Pixel, Linux/Playwright mit Softwaregrafik).

Für einen begrenzten Latenzvergleich wurde derselbe Damm in sechs neuen Browserseiten während laufender 1×-Simulation über die Oberfläche bestätigt; Reihenfolge alt, neu, neu, alt, alt, neu. Das Messskript erfasste die Zeit bis zum ersten Rendern des bestätigten Zustands mit 149,8 / 138,9 / 150,6 / 141,3 / 145,2 / 78,3 ms. Das Budget betrug jeweils 9.040; Seitenfehler wurden nicht protokolliert. Die Stichprobe ist zu klein und schwankt zu stark, um eine Leistungssteigerung oder eine übliche Latenz zu belegen. Sie ersetzt keine Messung auf echten Geräten.

## Beschädigte Worker-Nachrichten

Die Oberfläche fängt Fehler bei der Verarbeitung von Worker-Nachrichten ab, beendet den Worker und zeigt einen Hinweis zum Neuladen. Eine ungültige Initialisierungsantwort wird ebenfalls als Fehler behandelt. Drei Chrome-Tests injizieren nach dem Laden einen leeren Nachrichteninhalt, eine `ready`-Antwort mit falscher Protokollversion und einen Snapshot ohne verwendbaren Puffer. Vor der Änderung blieb die Oberfläche in diesen Fällen im Vorbereitungszustand; danach zeigen alle drei Fälle den Fehlerzustand und deaktivieren den Start. Die Prüfung deckt keine vollständige Validierung aller denkbaren Nachrichtenfelder ab. Am 29. Oktober 2026 bestanden Build, 42 Vitest-Tests und 26 Chrome-156-Browserprüfungen unter Bun 1.4.4. Safari und reale Geräte bleiben ungeprüft.

## Vorschau bei kleinen Ansichten

Bei einer Ansicht von 320 × 480 CSS-Pixeln konnte die Vorschau zuvor rechts aus dem sichtbaren Bereich ragen. Die Positionierung begrenzt sie nun auf die verfügbare Breite. Zwei Chrome-156-Tests emulieren Touch bei 320 × 480 und 480 × 320 CSS-Pixeln: Nach Werkzeugwahl und Ausblenden des Menüs wählen sie zwei Kartenpunkte, prüfen Sichtbarkeit, Treffpunkt und mindestens 44 × 44 CSS-Pixel für Bestätigen und Verwerfen und bestätigen anschließend den Damm. Am 29. Oktober 2026 bestanden Build, 42 Vitest-Tests und 28 Chrome-Browserprüfungen unter Bun 1.4.4. Die emulierten Ansichten ersetzen keine echte Geräteabnahme.

## Aktuelle Strategie- und Firefox-Läufe

Am 29. Oktober 2026 wurde die Referenzstrategie auf Anwendungscode `5a2b550` mit Szenario `1.3-draft` im Bun/Vite-Entwicklungsserver über `bun tools/observe-strategy-browser.mjs` erneut vollständig bedient: Chrome 156.0.8078.73 unter Linux/Playwright mit Softwaregrafik, elf bestätigte Dammabschnitte, 2.600 Budgetrest, 35.144 Schaden und erreichtes Ziel nach 150,844 s bei 2×. Seitenfehler wurden nicht protokolliert. Die Klickkoordinaten werden testseitig projiziert; es ist kein Produktionsbuild-Lauf und keine menschliche Geräteabnahme.

Der Produktionsbuild desselben Anwendungscodes wurde mit `bun tools/observe-firefox.mjs` im offiziellen Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik geprüft. Laden, Start, Pause, Neustart und Vorschau sowie Bestätigung aller drei Werkzeuge funktionierten. Eine vollständige unbehandelte 2×-Runde zeigte nach 150,995 s das Ergebnis mit 140.414 Schaden und 10.000 Budgetrest. Der Test deaktivierte die Firefox-Content-Sandbox für temporäre Testschriften und ersetzt keine manuelle Abnahme unter regulären Sicherheitseinstellungen oder auf einem echten Gerät.

Beim ersten Start der neu eingerichteten virtuellen Anzeige meldete Firefox für den aktuellen und einen vorherigen Build fehlendes WebGL. Mit `LIBGL_DRIVERS_PATH` auf die lokal bereitgestellten Mesa-Treiber und `LIBGL_ALWAYS_SOFTWARE=1` für den X-Server starteten die oben beschriebenen Prüfungen. Die Meldung wird damit in dieser Umgebung durch die Grafik-Konfiguration erklärt; sie ist kein Nachweis für oder gegen WebGL auf anderen Geräten.

## Komprimiertes Szenario

Der Vite-Build erzeugt aus der unveränderten `public/scenarios/brigittenau-v1.json` zusätzlich eine gzip-Datei mit der Endung `.json.bin`. Die Anwendung lädt nur diese Datei und entpackt sie mit der [Compression-Streams-API](https://docs.webkit.org/Deep%20Dive/Modules/CompressionStreams.html) im Browser; die Dateiendung vermeidet eine Annahme über automatische HTTP-Inhaltskodierung. Der Entwicklungsserver stellt denselben Inhalt bereit; zur Aktualisierung bei Dateiänderungen siehe die nachfolgende Prüfung. Die ursprüngliche JSON-Datei bleibt für Quellenprüfung und Diagnose im Build verfügbar. Es ist kein besonderer Server oder externer Dienst notwendig.

Am 29. Oktober 2026 umfasste das Szenario 1.692.269 Bytes unkomprimiert und 237.478 Bytes in der Builddatei. Zwei Builds mit Bun 1.4.4 erzeugten dieselbe komprimierte SHA-256 `80b894c399c6902389275873b9168aba1c9471225107a41745c3b24ee4480680`; nach Entpacken entsprach der Hash `f9c8766bf5399e54a5cf5574e008895278817f1ee635c0ba3713a9d42780e81d` exakt der eingecheckten JSON-Datei. Das ist ein Größenvergleich ohne Berücksichtigung möglicher zusätzlicher HTTP-Kompression des ursprünglichen JSON.

Build, 42 Vitest-Tests, 29 Chrome-156-Browserprüfungen, der statische Unterpfadtest und die Auswahlprüfung im Entwicklungsserver bestanden. Ein zusätzlicher Browsertest bestätigt die sichtbare Fehlermeldung bei beschädigten gzip-Daten. Firefox 159 lud die Produktionsversion und bediente Start, Pause, Neustart und alle drei Werkzeuge auf dem virtuellen Linux-Desktop mit Softwaregrafik und deaktivierter Content-Sandbox für Testschriften. Die vollständige Dammstrategie wurde im Chrome-Entwicklungsserver über 300 simulierte Sekunden gespielt: 35.144 Schaden, 2.600 Budgetrest, 150,799 s bei 2×, keine protokollierten Seitenfehler. Die Klickpositionen sind testseitig berechnet. Safari und echte Mobilgeräte bleiben ungeprüft.

## Werkzeuge im schmalen Querformat

Bei 480 × 320 CSS-Pixeln konnte der Quellenbereich die Abriss-Schaltfläche verdecken. In kurzen, schmalen Ansichten werden Bedienfeld und Quellenbereich nun nebeneinander begrenzt. Ein Chrome-156-Touchtest prüft für 480 × 320 CSS-Pixel die Treffpunkte und mindestens 44 × 44 CSS-Pixel aller Werkzeug- und Spielsteuerungsschaltflächen sowie die Erreichbarkeit des OSM-Quellenlinks; anschließend wählt er den Abrissmodus. Eine ergänzende Sicht- und Treffpunktkontrolle prüfte auch 320 × 480, 320 × 568, 390 × 844 und 844 × 390 CSS-Pixel. Build, 42 Vitest-Tests und 30 Chrome-Browserprüfungen bestanden am 29. Oktober 2026 unter Bun 1.4.4. Dies ersetzt keine Prüfung auf echten Mobilgeräten.


## Szenarioaktualisierung im Entwicklungsserver

Ein isolierter Test zeigte, dass der ursprüngliche Dateiwächter einen kurz nach einer anderen Änderung atomar ersetzten Szenariostand verpassen konnte; der Entwicklungsserver lieferte dann veraltete komprimierte Daten. Er prüft nun vor jeder Szenarioanfrage Dateigerät, Inode, Größe und Änderungszeiten und komprimiert bei einer Änderung erneut. Fehlt die Quelldatei, antwortet er mit HTTP 503 statt den alten Inhalt auszuliefern. Ein Integrationstest und ein zusätzlicher Lauf mit einem echten Vite-Server prüften direkte Änderung, atomaren Dateiersatz und fehlende Datei in einem temporären Verzeichnis. Auf der korrigierten Entwicklungsversion bestand außerdem die Damm-Auswahlprüfung mit erhöhter Auflösung. Build, 43 Vitest-Tests und der statische Unterpfadtest bestanden am 29. Oktober 2026. Der Produktionsbuild erzeugt die komprimierte Datei weiterhin direkt aus der Quelle; die eigentliche Szenariodatei wurde bei dieser Prüfung nicht verändert.

## Neustart nach allen drei Werkzeugen

Ein neuer Worker-Integrationstest setzt in einer laufenden synthetischen Runde Damm, Graben und Abriss, führt einen Neustart aus und vergleicht den neuen Snapshot mit dem Ausgangszustand: Wasser, Impuls, Gelände, Gebäude, Budget, Dämme, Uhr, Geschwindigkeit, Rückstand und Wasserbilanz. Eine alte Aktion wird verworfen; dieselbe Aktionskennung ist in der neuen Runde wieder nutzbar. Ein ergänzender Chrome-Test bestätigt im realen Szenario alle drei Werkzeuge, startet die Flut und setzt anschließend zurück. Der Screenshot der Ausgangsansicht war danach unter Linux/Playwright mit Softwaregrafik bytegleich; der Test wartet zuvor auf den Snapshot der neuen Runde. Am 29. Oktober 2026 bestanden 44 Vitest-Tests und 31 Chrome-156-Browserprüfungen unter Bun 1.4.4. Der Screenshotvergleich belegt nur diesen Ablauf und diese Umgebung und ersetzt keine echte Geräteabnahme.
