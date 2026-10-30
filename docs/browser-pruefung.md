# Browser- und Stabilitätsprüfung

**Versionsbezug:** Die folgenden historischen Dammrunden und Screenshots vor der direkten Dammführung verwendeten die frühere rechtwinklige Pfadregel. Sie belegen den jeweils genannten damaligen Build, nicht die neuen Referenzwerte; aktuelle Nachweise sind gesondert gekennzeichnet.

## Gesamtsuite nach kompaktem Status

Auf einem isolierten Archiv von `0f3ee22` bestand am 29. Oktober 2026 der Produktionsbuild. Der anschließende Playwright-Lauf mit Chrome 156 unter Linux, Softwaregrafik und einem Worker endete nach 13,5 Minuten mit 81 bestandenen Fällen und einem Timeout nach 30 Sekunden bei `small-readouts.spec.ts` (Status und Treffflächen bei 320 × 480). Der gleiche Fall bestand anschließend auf demselben Build und mit demselben Zeitlimit isoliert in 20,6 Sekunden. Die Ursache des ursprünglichen Timeouts ist ungeklärt; der Gesamtlauf ist deshalb nicht als vollständig bestanden zu werten. Zeitweise liefen weitere numerische Untersuchungen und Browserprüfungen parallel. Dies ist weder eine Leistungsmessung noch eine menschliche oder echte Geräteprüfung; spätere Tests und Änderungen sind nicht umfasst.

Das Testzeitlimit für `small-readouts.spec.ts` wurde anschließend von 30 auf 60 Sekunden erhöht; die Assertions und Treffflächenprüfungen blieben unverändert. Drei Wiederholungen mit einem Worker bestanden auf demselben Produktionsbundle in 16,1, 13,0 und 8,1 Sekunden. Eine vollständige Suite mit dem erhöhten Limit wurde damit nicht nachgewiesen. Das Limit ist keine Vorgabe für Geräteperformance.

Auf dem isolierten Produktionsbuild `cdf3873` bestanden anschließend alle 84 Chromium-Fälle mit einem Worker in 13,8 Minuten. Der zuvor zeitüberschrittene Fall zur kleinen Statusansicht bestand im Gesamtlauf in 13,8 Sekunden. Es liefen zeitweise weitere Untersuchungen parallel; die Laufzeit ist keine Leistungsmessung. Später veränderte Darstellung und echte Geräte sind damit nicht geprüft.

## Gesamtsuite mit schematischer Grabenlinie

Auf dem isolierten Produktionsbuild `d38c0ca` bestanden am 29. Oktober 2026 alle 85 Playwright-Chromium-Fälle unter Linux mit Softwaregrafik und einem Worker in 14,3 Minuten. Dazu gehört der Bildvergleich der bestätigten Grabenlinie bei künstlich erhöhtem Wasser. Zeitweise liefen andere Untersuchungen parallel; die Dauer ist keine Leistungsmessung. Der Test belegt weder menschliche Verständlichkeit noch tatsächliches Safari oder echte Mobilgeräte.

## Firefox-Runde mit schematischer Grabenlinie

Auf dem isolierten Produktionsbuild `d38c0ca` prüfte `WATERFIGHTER_FIREFOX_FULL=1 bun tools/observe-firefox.mjs` Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik. Start, Pause, Neustart sowie Vorschau und Bestätigung je einer Graben-, Damm- und Abrissaktion funktionierten. Danach endete eine unbehandelte 2×-Runde nach 150,86 Sekunden bei 05:00 mit sichtbarem Ergebnis: 138.835 Flutschaden, kein Abrissverlust und 10.000 Budgetrest; das Schadensziel wurde verfehlt. Die Aktionen wurden testseitig ausgelöst und vor der unbehandelten Runde zurückgesetzt. Für die lokalen Testschriften war die Firefox-Content-Sandbox deaktiviert. Der automatisierte Lauf belegt weder menschliche Bedienung noch echte Mobilgeräte oder tatsächliches Safari.

Auf demselben Build `d38c0ca` prüfte `bun tools/verify-firefox-pan.mjs` in Firefox 159.0 über geckodriver 0.37.1 bei 1200 × 800 CSS-Pixeln die Kartenverschiebung nach Auswahl eines Grabenstartpunkts getrennt mit Maus und emuliertem Touch. Das Kartenbild änderte sich, der Startpunkt blieb erhalten und nach Auswahl des Endpunkts erschien jeweils eine bestätigbare Vorschau mit 1.000 Kosten; vor Bestätigung blieb das Budget bei 10.000. Der virtuelle Linux-X-Desktop nutzte Mesa-Softwaregrafik und deaktivierte Firefox-Content-Sandbox für Testschriften. Dies ist keine menschliche Bedienprüfung und kein echter Touchscreen.

## Firefox-Runde mit Babylon.js 9.33.1

Auf einem isolierten Produktionsbuild von `c8b4b33` mit Babylon.js 9.33.1 prüfte `WATERFIGHTER_FIREFOX_FULL=1 bun tools/observe-firefox.mjs` Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik. Start, Pause, Neustart sowie Vorschau und Bestätigung je einer Graben-, Damm- und Abrissaktion funktionierten. Nach deren Rücksetzung endete eine unbehandelte 2×-Runde bei 05:00 nach 150,072 Sekunden mit sichtbarem Ergebnis: 138.836 Flutschaden, kein Abrissverlust und 10.000 Budgetrest; das Schadensziel wurde verfehlt. Für die lokalen Testschriften war die Firefox-Content-Sandbox deaktiviert. Die Aktionen sind automatisiert; menschliche Bedienung, echte Mobilgeräte und tatsächliches Safari bleiben ungeprüft.

Auf demselben Build bestand `bun tools/verify-firefox-pan.mjs` in Firefox 159.0 bei 1200 × 800 CSS-Pixeln getrennt für Maus und emulierten Touch: Nach Wahl des Grabenstartpunkts änderte das Ziehen die Kartenansicht, der Startpunkt blieb erhalten und der Endpunkt erzeugte eine bestätigbare Vorschau mit 1.000 Kosten. Vor Bestätigung blieb das Budget bei 10.000. Dieselben Bedingungen mit virtueller Anzeige, Softwaregrafik und deaktivierter Content-Sandbox gelten; ein echter Touchscreen und menschliche Bedienung wurden nicht geprüft.

## Gesamtsuite mit näherem Kartenzoom

Auf dem isolierten Produktionsbuild `4dfe2e7` mit Babylon.js 9.33.1 bestanden am 30. Oktober 2026 alle 89 Playwright-Chromium-Fälle unter Linux mit Softwaregrafik und einem Worker in 12,1 Minuten. Die Suite enthält unter anderem Kartenverschiebung, Werkzeug- und Touchbedienung, Neustarts sowie die Grabenlinie. Eine unabhängige Wiederholung auf dem isolierten Archiv `489e515` mit gleichem Anwendungscode bestand nach `bun install --frozen-lockfile` und `bun run build` ebenfalls alle 89 Fälle in 12,3 Minuten. Der erste Installationsversuch scheiterte an einer Speicherquote; nach Entfernen eigener abgeschlossener Testarchive gelang er. Zeitweise liefen weitere Untersuchungen parallel; die Laufzeiten sind keine Leistungsmessung. Menschliche Zielgenauigkeit und Verständlichkeit, tatsächliches Safari und echte Mobilgeräte bleiben ungeprüft.

## Firefox-Runde mit näherer Kartenansicht

Auf dem isolierten Produktionsbuild `506ed5c` mit Anwendungscode `a51f659` und Babylon.js 9.33.1 prüfte das Werkzeug `tools/observe-firefox.mjs` mit den ergänzten Testpunkten aus `b3b7197` am 30. Oktober 2026 Firefox 159.0 über geckodriver 0.37.1. Auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik funktionierten Start, Pause, Neustart sowie Vorschau und Bestätigung je einer Graben-, Damm- und Abrissaktion. Nach deren Rücksetzung endete eine unbehandelte 2×-Runde bei 05:00 nach 150,656 Sekunden mit sichtbarem Ergebnis: 138.836 Flutschaden, kein Abrissverlust und 10.000 Budgetrest; das Schadensziel wurde verfehlt. Die Firefox-Content-Sandbox war für lokale Testschriften deaktiviert. Feste Testpunkte, virtuelle Anzeige und Softwaregrafik ersetzen keine menschliche Bedienung, echte Mobilgeräte oder tatsächliches Safari. Der frühere WebDriver-Sitzungsabbruch bleibt ungeklärt.

## Karte im Werkzeugmodus verschieben

Nach der Verbesserung der Platzierung lässt sich die Karte in allen Werkzeugmodi ziehen. Bei Damm und Graben bleibt ein bereits gewählter Startpunkt erhalten; gezogene Kontakte setzen keinen weiteren Punkt. Ein Produktionsbuild und 67 Modelltests bestanden. In Chromium mit Softwaregrafik bestanden gezielte Mausprüfungen in Hoch- und Querformat sowie Touch- und Mausprüfungen, die eine sichtbare Kartenverschiebung und die anschließende Endpunktauswahl prüfen. Ein erster erweiterter Touchlauf überschritt das bisherige 30-s-Testlimit; mit 90 s erlaubter Testdauer bestanden beide Verschiebungsfälle. Anschließend bestanden alle 64 Playwright-Chromium-Prüfungen auf dem Produktionsbuild des Anwendungscodes `4a54de4` unter Linux mit Softwaregrafik und einem Worker in 8,1 Minuten. Ein paralleler Langzeitlauf belastete den Rechner; die Zeit ist keine Leistungsmessung. Spätere Renderänderungen, unabhängige Spielpersonen und echte Geräte bleiben separat zu prüfen.

### Referenzgraben nach Verschieben und Vergrößern

Ein zusätzlicher Test auf dem isolierten Produktionsbuild `13537eb` wählte den ersten Punkt des Referenzgrabens, verschob die Karte bei aktivem Grabenwerkzeug und vergrößerte sie dreimal. Der danach gewählte Endpunkt erzeugte genau die 26 Referenzzellen (0,4) bis (25,4); die Vorschau kostete 650, und erst die Bestätigung verringerte das Budget auf 9.350. Die Worker-Vorschaunachricht wurde beobachtet, die Aktion unverändert ausgeführt. Der Test bestand in Chromium unter Linux mit Softwaregrafik bei 1600 × 1000; die Mauskoordinaten wurden aus Szenenprojektion und Kamera ermittelt. Eine instrumentierte Entwicklungsansicht maß für zwei benachbarte Zellmittelpunkte in diesem Bereich vor der Vergrößerung etwa 2,8 und nach drei Zoomschritten etwa 5,5 Bildpunkte Abstand. Diese einzelne Desktopansicht belegt keine menschliche Zielgenauigkeit oder Bedienbarkeit auf kleinen echten Geräten.

### Werkzeugverschiebung in Firefox

`bun tools/verify-firefox-pan.mjs` prüfte auf dem isolierten Produktionsbuild `13537eb` mit Firefox 159.0 und geckodriver 0.37.1 unter Linux bei 1200 × 800 getrennt Maus und emulierte Touch-Eingaben. Nach Auswahl des ersten Grabenpunkts veränderte ein Ziehen jeweils das Kartenbild; die Oberfläche meldete den erhaltenen Startpunkt und nach Auswahl des zweiten Punkts eine bestätigbare Vorschau. Das Budget blieb vor Bestätigung bei 10.000. Der Test verwendete einen virtuellen X-Desktop mit Mesa-Softwaregrafik und deaktivierter Firefox-Content-Sandbox für lokale Testschriften. Dies ist keine manuelle Desktopabnahme und keine Prüfung auf einem echten Touchgerät.

## Produktionsbuild mit direkter Dammführung

Der Produktionsbuild des Anwendungscodes `2851271` mit Szenario `1.4-draft` bestand am 29. Oktober 2026 alle 62 Playwright-Chromium-Prüfungen unter Linux mit Softwaregrafik und einem Worker. Dazu gehören die direkte diagonale Dammvorschau in beiden Richtungen, ein gültig verschobener Referenzdamm, die Erklärung einer unzulässigen Randführung, Maus- und emulierte Touchbedienung sowie Neustarts. `bun run test --maxWorkers=1` bestand mit 63 Modelltests einschließlich einer erschöpfenden Pfadprüfung auf einem kleinen Raster; der Produktionsbuild bestand ebenfalls. Während des Browserlaufs liefen zeitweise numerische Modelluntersuchungen parallel; dies ist keine Leistungsmessung. Tatsächliche Mobilgeräte, Safari und menschliche Bedienung bleiben offen.

### Vollständige Runde mit späteren Eingriffen

Auf demselben Produktionsbuild wurden mit `tools/observe-staged-production.mjs` in Chrome 156.0.8078.73 unter Linux und Softwaregrafik zwei Dämme über die Oberfläche vor Beginn gesetzt. Bei 02:01 wurde pausiert, ein Gebäude abgerissen und ein Graben ausgehoben; während der Pause blieb die Uhr stehen. Nach Fortsetzen endete die 2×-Runde nach 164,104 s mit „Schadensziel erreicht“: 11.909 Flutschaden, 16.017 Abrissverlust, 27.926 Gesamtschaden und 6.598 Budgetrest. Es gab keine protokollierten Seitenfehler; der anschließende Neustart stellte Zeit, Budget und Schaden zurück. Die Klickpunkte sind Testkoordinaten bei 1600 × 1000; dies ist keine menschliche Bedien- oder Geräteprüfung. Die Kombination ist gegenüber zwei vorbereiteten Dämmen allein nicht wirtschaftlich vorteilhaft. Der hier geprüfte Abrissgraben ist nicht die numerisch besonders erfolgreiche Landgraben-Variante.

### Vollständige Landgraben-Runde

`tools/observe-land-production.mjs` setzte auf demselben Produktionsbuild in Chrome 156.0.8078.73 unter Linux drei Dämme und den Landgraben über die Oberfläche vor Flutbeginn. Die bestätigten Kosten waren 400, 800, 640 und 650; das Restbudget betrug 7.510. Die vollständige 2×-Runde dauerte 151,055 s und endete ohne protokollierte Seitenfehler mit 863 Flutschaden, keinem Abrissverlust und „Schadensziel erreicht“. Der anschließende Neustart setzte Zeit, Budget und Schaden zurück. Das Ergebnis entspricht dem gerundeten numerischen Vergleich von 863,20. Die Klickpunkte stammen aus einer testseitigen Projektion bei 1600 × 1000; eine unabhängige Person oder ein echtes Mobilgerät wurde nicht geprüft.

### Landgraben nach Flutbeginn im Produktionsbuild

Am 29. Oktober 2026 setzte `bun tools/observe-land-production.mjs --after-flood` auf dem isolierten Produktionsbuild mit Anwendungscode `b44c067` drei Dämme in der Vorbereitung und pausierte die 2×-Runde bei 02:32. Die Grabenaktion traf nach Prüfung der Worker-Vorschau genau die 26 Referenzzellen (0,4) bis (25,4), kostete 650 und ließ 7.510 Budget übrig; die Uhr blieb während der Pause stehen. Nach Fortsetzen endete die Runde nach 158,279 s ohne protokollierte Seitenfehler bei 1.477 Flutschaden und keinem Abrissverlust; das Ziel von 50.000 wurde erreicht. Der anschließende Neustart setzte Zeit, Budget und Schaden zurück. Die numerische Kontrolle ohne Graben und mit denselben drei Dämmen ergibt 23.574,17 Schaden bei 8.160 Budgetrest. Unterschiedliche Rundungs- und Schrittzeitpunkte begrenzen die Genauigkeit des Vergleichs.

Der Test nutzte Chrome 156.0.8078.73 unter Linux mit Softwaregrafik, 1600 × 1000 und projizierte Testkoordinaten. Bei früheren Versuchen zur angezeigten Zeit 02:33 traf der unveränderte Vorbereitungspunkt am zweiten Ende Zelle (26,3), wodurch die Vorschau wegen eines Gebäudes abgelehnt wurde; eine Verschiebung um 1,5 beziehungsweise 3 Bildpunkte nach oben traf Zelle (24,5) statt der Referenz. Im erfolgreichen Lauf traf ein um einen Bildpunkt nach oben verschobener Endpunkt die richtige Zelle. Das Skript kann nahe Endpunkte ausprobieren und unpassende Vorschauen verwerfen; beim dokumentierten erfolgreichen Lauf passte der erste getestete Versatz. Die Prüfung zeigt eine empfindliche Platzierung in der Übersicht, belegt aber weder menschliche Unbedienbarkeit noch eine erfolgreiche Bedienung ohne Testkoordinaten.

Der vorbereitete Referenzlauf wurde auf demselben neueren Produktionsbuild ebenfalls wiederholt: 150,936 s bei 2×, 863 Schaden und 7.510 Restbudget, ohne protokollierte Seitenfehler; der Neustart setzte den Schaden zurück.

## Fehleranzeige bei ausgeblendetem Menü

Ein kritischer Lade-, Worker- oder Grafikfehler öffnet das ausgeblendete Spielmenü, beendet den Worker und bietet dort eine Schaltfläche zum Neuladen. Eine Browserprüfung löst einen Grafikkontextverlust bei ausgeblendetem Menü aus, prüft die sichtbare Fehlermeldung und lädt über die Schaltfläche erfolgreich eine neue Vorbereitung. Die Prüfung simuliert das Ereignis und ersetzt keine Geräteprüfung eines tatsächlichen Grafikverlusts.

Auf diesem Änderungsstand bestanden der Produktionsbuild, 44 Vitest-Tests und alle 31 Playwright-Prüfungen mit Chrome 156 und Softwaregrafik.

In der lokalen Linux-Testumgebung müssen neben den temporären Browserbibliotheken auch Schriften eingerichtet sein: Ohne `FONTCONFIG_FILE=/tmp/waterfighter-fonts/fonts.conf` zeigte Chrome Text mit praktisch null Breite, wodurch Prüfungen der Hilfe und des Quellenlinks scheiterten. Die Dateien unter `/tmp` sind lokale Testvoraussetzungen, keine Voraussetzungen für die ausgelieferte Anwendung.

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

## Experimentelle Ableitungsstrategie im Browser

Am 29. Oktober 2026 wurde `bun tools/observe-review-diversion.mjs` mit Chrome 156.0.8078.73 und dem Vite-Entwicklungsserver auf Anwendungscode `c3d6cc3` unter Linux mit Softwaregrafik ausgeführt. Ausschließlich der Test ersetzte die Szenarioantwort durch `1.3-draft` mit offenem Westrand und 3 m Grabentiefe. Zwei Dämme, der Abriss von `w33581744-0` und der Graben (0,10)–(23,10) wurden über Vorschau und Bestätigung der Oberfläche gesetzt. Die Bildschirmkoordinaten berechnete das Testprogramm mit Zugriff auf die Kamera und Szenengeometrie; sie wurden nicht von einer Person gefunden. Das Gebäude lag zunächst hinter dem geöffneten Bedienfeld; nach Ausblenden des Menüs war es auswählbar. Die Maßnahmen kosteten zusammen 3.402, der Budgetrest betrug 6.598.

Die vollständige 2×-Runde dauerte 150,931 s und endete ohne protokollierte Seitenfehler mit 17.625 Flutschaden, 16.017 Abrissverlust und 33.642 Gesamtschaden; das Ziel 50.000 wurde erreicht. Der vorherige numerische Vergleich ergab 33.646,93; die abweichende Schrittfolge begrenzt die Vergleichbarkeit. Die [Vorbereitungsansicht](review-ableitung-vorbereitung.png) und die [Ansicht bei 180 s](review-ableitung-flut.png) zeigen den Teststand. Die laufende Schadensanzeige und farbliche Gebäudezustände ändern sich; der Graben und der vorgesehene Abfluss sind in der Übersicht schwer erkennbar und teilweise vom Menü verdeckt. Die Bilder belegen keinen durchgehend visuell verfolgbaren Wasserweg.

Der Test nutzt eine abgefangene Szenarioantwort und einen instrumentierten Entwicklungsserver, keinen unveränderten Produktionsbuild. Er belegt weder menschliche Spielbarkeit noch reale Geräte, tatsächliches Safari oder eine sichere Ableitung außerhalb des Ausschnitts. Die zusätzliche Randöffnung bleibt eine experimentelle Annahme und wurde nicht ins ausgelieferte Szenario übernommen.

## Bestätigte Gräben sichtbar machen

Bestätigte Grabenzellen werden aus dem Worker-Snapshot als braune Flächen auf dem veränderten Geländemesh dargestellt. Sie sind nicht anklickbar, verändern die Simulation nicht und können von Wasser verdeckt werden. Die Markierung wird bei einer neuen Aktionsrevision erneuert und beim Neustart entfernt. Die Hilfe erklärt die Unterscheidung zu den orangefarbenen Dammlinien.

Ein Entwicklungsbrowser-Vorbereitungslauf mit den experimentellen Reviewparametern bestätigt zwei Dämme, Abriss und Graben bei Budgetrest 6.598. Die [Ansicht mit ausgeblendetem Menü](review-grabenmarkierung.png) zeigt die neue Markierung; der Graben ist im unvergrößerten Überblick weiterhin schmal. Der Test verwendet projizierte Koordinaten und keine echte Person oder Mobilhardware. Ein erneuter vollständiger Flutlauf nach dieser Darstellungsänderung steht aus.

Produktionsbuild und 47 Vitest-Tests bestanden. In Chrome 156 bestanden 33 Browserprüfungen vor einer anschließenden Ergänzung des Hilfetexts; nach dem erneuten Build bestanden die zwei betroffenen Prüfungen zu Hilfe und Grabenmarkierung erneut. Eine Browserprüfung beobachtet, dass Grabenzellen erst nach Bestätigung im Worker-Snapshot erscheinen und nach Neustart wieder leer sind; ein Babylon-NullEngine-Test prüft Aufbau und Entfernen des Markierungsmeshes.

## Flutrunde mit Grabenmarkierung und Modellrand-Hinweise

Nach Aufnahme der Grabenmarkierung wurde die experimentelle Ableitungsrunde mit `bun tools/observe-review-diversion.mjs` auf Anwendungscode `a863390` erneut ausgeführt. Chrome 156.0.8078.73 auf Linux mit Softwaregrafik setzte dieselben Maßnahmen über die Oberfläche; die testseitig projizierten Koordinaten, das abgefangene Szenario und der offene Westrand entsprechen dem früheren Versuch. Die vollständige 2×-Runde dauerte 151,078 s und endete ohne protokollierte Seitenfehler mit 17.625 Flutschaden, 16.017 Abrissverlust, 33.642 Gesamtschaden und 6.598 Budgetrest. Dies bleibt ein instrumentierter Entwicklungsbrowserlauf, keine Produktions- oder Geräteabnahme.

Danach wurden schematische Pfeile für Zuflussbereiche und offene Modellränder ergänzt. Sie werden aus `inflowCells` und `outflowEdges` erzeugt; die Pfeilrichtung zeigt hinein beziehungsweise hinaus. Sie kennzeichnen Modellgrenzen und behaupten keine sichere reale Ableitung oder einen tatsächlich durchströmten Weg. Die [Kontrollansicht](modellraender-kontrolle.png) zeigt den ausgelieferten Szenariostand ohne experimentelle Öffnung des Westrands. Der vollständige Flutlauf oben erfolgte vor dieser Pfeiländerung; seine Aussage erstreckt sich nicht auf deren Darstellung während einer vollständigen Runde.

### Produktionsrunde mit laufendem Grabeneingriff

Am 29. Oktober 2026 lief der lokale Produktionsbuild mit Szenario `1.4-draft` in Playwright-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik. `bun tools/observe-production-trench.mjs` setzte nach Start bei 2× einen Graben über Mauskoordinaten und bestätigte ihn. Die Runde dauerte 151,4 s; Budgetrest 9.350, Flutschaden 138.832, Abrissverlust 0, Gesamtschaden 138.832 bei Ziel 50.000. Der laufende Wert und die Aufteilung stimmten mit dem Ergebnis überein; nach Neustart zeigten Budget und Schaden wieder 10.000 beziehungsweise 0. Es wurden keine Seitenfehler gemeldet. Dieser willkürlich platzierte Graben ist keine Referenzstrategie und verfehlte das Ziel. Der automatisierte Lauf mit Mauskoordinaten ersetzt weder einen menschlichen Spieltest noch echte Mobilgeräte oder Safari.

### Maus und Touch in beiden Ausrichtungen

Am 29. Oktober 2026 bestanden im Vite-Entwicklungsserver auf Anwendungscode `ebc0ac9` mit Szenario `1.4-draft` in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik getrennt zwei Maus- und zwei emulierte Touchprüfungen bei 390 × 844 und 844 × 390 CSS-Pixeln. Beide Prüfungen wählten Damm, Graben und Abriss jeweils in der Vorbereitung, prüften Kosten und Bestätigung, bestätigten die Aktion und setzten danach zurück. Die Mausprüfung kontrollierte zusätzlich mit `elementFromPoint`, dass die Mitte der Bestätigung tatsächlich auf den Knopf trifft. Ausgeführt wurden `WATERFIGHTER_TEST_DEV=1 bun --bun playwright test tests/browser/mouse-orientation.spec.ts` und `WATERFIGHTER_TEST_DEV=1 bun --bun playwright test tests/browser/start.spec.ts --grep 'Bauwerkzeuge mit Touch im'`, jeweils mit dem lokal installierten Chrome-Pfad und den bereitgestellten Systembibliotheken.

Die Klick- und Tippstellen sind feste Testkoordinaten. Die Prüfungen belegen weder eine komplette Runde noch menschliches Auffinden sinnvoller Maßnahmen. Touch wird emuliert; tatsächliche Smartphones und Safari bleiben offen. Kleinere Ansichten und Treffflächen wurden separat wie oben beschrieben geprüft.

### Aktueller statischer Unterpfad

Am 29. Oktober 2026 wurde der Anwendungsstand `69eead7` mit `bun --bun vite build --base /waterfighter/ --outDir /tmp/wf-subpath-current` separat gebaut. `WATERFIGHTER_DIST=/tmp/wf-subpath-current bun tools/verify-static-subpath.mjs` lieferte den Build unter `/waterfighter/` aus und bestand in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. Die Prüfung lud Szenario und Worker, bestätigte einen Damm, startete und pausierte die Uhr, setzte zurück und verglich den über Quellenhinweis und direkten Download erreichbaren Szenarioinhalt byteweise mit der Quelldatei. Alle protokollierten Anfragen waren erfolgreich, Seitenfehler wurden nicht gemeldet. Das optionale `WATERFIGHTER_DIST` erlaubt die Prüfung eines isolierten Builds, ohne das gemeinsame `dist` zu verändern; ohne diese Variable bleibt `dist` der Standard. Die Prüfung ersetzt weder eine vollständige Runde noch eine Geräte- oder Lizenzabnahme.

### Maßnahmen nach Flutbeginn

Am 29. Oktober 2026 bestanden zwei zusätzliche Playwright-Chrome-Prüfungen auf dem Vite-Entwicklungsserver mit Szenario `1.4-draft` und 1200 × 800 CSS-Pixeln: `WATERFIGHTER_TEST_DEV=1 bun --bun playwright test tests/browser/paused-actions.spec.ts`. Im ersten Ablauf wurde die Flut gestartet, nach sichtbarem Zeitfortschritt pausiert und anschließend je ein Graben, Damm und Abriss über Vorschau und Bestätigung gesetzt. Nach jeder Aktion sank das Budget, Zustand und angezeigte Zeit blieben pausiert; nach Fortsetzen lief die Zeit weiter. Im zweiten Ablauf wurden dieselben drei Werkzeuge bei laufender Uhr bestätigt; das Budget sank jeweils und die Uhr lief weiter. Chrome 156.0.8078.73 auf Linux mit Softwaregrafik verwendete feste Mauskoordinaten. Dies belegt die Bedienfolge in dieser Umgebung, nicht die Wirksamkeit der gewählten Maßnahmen, eine vollständige Runde oder menschliche Spielbarkeit.

Eine ergänzende Prüfung `WATERFIGHTER_TEST_DEV=1 bun --bun playwright test tests/browser/shifted-reference.spec.ts` bestand auf demselben Szenario mit Chrome 156.0.8078.73 bei 1600 × 1000 CSS-Pixeln. Der Anfang des ersten Referenzdamms wurde um eine Rasterzelle von (26,0) nach (25,0) verschoben; der zweite Endpunkt blieb bei (26,10). Die Oberfläche zeigte „Der Damm darf nicht auf dem Kartenrand verlaufen. Endpunkte weiter innen wählen.“, deaktivierte die Bestätigung und ließ das Budget bei 10.000. Die Klickpunkte wurden zuvor testseitig aus der Szenengeometrie projiziert und sind ans gewählte Bildformat gebunden; sie belegen kein menschliches Auffinden der Maßnahme.

Ein weiterer unabhängiger Produktionslauf mit `1.4-draft`, Chrome 156.0.8078.73 und demselben zufällig gewählten Graben dauerte 150,958 s. Er meldete 138.830 Gesamtschaden, 9.350 Budgetrest und keine Seitenfehler; nach Neustart standen Budget 10.000 und Schaden 0. Der vor der Runde erzeugte Build enthielt den damals uncommitteten Quellenhinweis; spätere Änderungen der Einführung sind damit nicht abgedeckt. Der Lauf ist kein Test der Referenzstrategie oder menschlicher Gerätebedienung.

Die Browser-Suite auf diesem Build bestand in 32 von 33 Fällen; der kombinierte Neustarttest überschritt beim Screenshot unter hoher Softwaregrafiklast sein 30-s-Limit. Bei Einzelwiederholung mit 90-s-Limit bestand er, ebenso nach einem erneuten Build mit der späteren Einführung. Die Verlängerung ändert weder die Screenshotprüfung noch die funktionalen Erwartungen. Die erste parallel zu weiteren Simulationen gestartete Suite wurde nach mehreren Zeitüberschreitungen abgebrochen.

Nach der Ergänzung der Planungshinweise in `ebc0ac9` bestanden auf dem lokalen Produktionsbuild mit Bun 1.4.4 alle 49 Vitest-Tests und anschließend alle 33 Playwright-Chromium-Prüfungen (3,0 min). Für den Browserlauf waren `LD_LIBRARY_PATH=/tmp/waterfighter-libs/root/usr/lib/x86_64-linux-gnu` und `FONTCONFIG_FILE=/tmp/waterfighter-fonts/fonts.conf` gesetzt. Der Teststand enthielt das erhöhte Zeitlimit für den kombinierten Neustarttest (`3459401`). Die zuvor ohne Fontconfig als unsichtbar gemeldeten Texte hatten in dieser Umgebung nahezu keine Breite; mit Schriften bestanden die betroffenen Prüfungen. Dies sind automatisierte Linux-Prüfungen, keine Abnahme auf echten Geräten oder Safari.

### Kombinierte Referenzstrategie auf isoliertem Produktionsbuild

Am 29. Oktober 2026 wurde der unveränderte Produktionsbuild von Commit `c00f07c` in einem getrennten temporären Git-Worktree erzeugt und lokal ausgeliefert. So konnte eine parallele Änderung des gemeinsamen Buildverzeichnisses den Lauf nicht beeinflussen. `bun tools/observe-review-production.mjs` verwendete Chrome 156.0.8078.73 unter Linux mit Softwaregrafik und 1.600 × 1.000 Pixeln. Die in `tests/fixtures/review-screen-points.json` gespeicherten Klickpunkte wurden vorher mit `bun tools/observe-review-diversion.mjs --prepare-only` aus der instrumentierten Entwicklungsansicht desselben Szenarios gewonnen. Der Produktionslauf selbst ersetzte weder Anwendungsmodule noch Szenarioantworten.

Die Oberfläche bestätigte zwei Dämme für 400 und 800 Budgeteinheiten, den Abriss mit 16.017 Verlust und 1.602 Kosten sowie den 3-m-Graben für 600. Die vollständige 2×-Runde dauerte 150,865 s und endete ohne protokollierte Seitenfehler mit 17.625 Flutschaden, 16.017 Abrissverlust, 33.642 Gesamtschaden und 6.598 Budgetrest. Die laufende Schadensanzeige stimmte mit dem Ergebnis überein; der Neustart setzte Budget und Schaden zurück. Das Ziel von 50.000 wurde erreicht.

Der Lauf belegt die automatisierte Referenzstrategie auf diesem Produktionsbuild, keine eigenständige Suche oder Bedienung durch eine Person. Die Bildschirmkoordinaten hängen von Ansicht und Kamera ab; spätere Darstellungsänderungen, tatsächliches Safari und echte Mobilgeräte sind durch diesen Lauf nicht abgedeckt. Der offene Westrand ist eine Spielannahme, und Folgen außerhalb des Modellausschnitts werden nicht berechnet.

### Referenzrunde mit Strömungsmarkern

Am 29. Oktober 2026 wurde der Produktionsbuild von `69eead7` mit `bun --bun vite build --outDir /tmp/waterfighter-flow-69eead7` separat erzeugt und lokal per Python-HTTP-Server ausgeliefert. Chrome 156.0.8078.73 auf Linux mit Softwaregrafik spielte `bun tools/observe-review-production.mjs --capture-flow` mit denselben vorbereiteten Bildschirmkoordinaten. Anwendung und Szenarioantwort wurden nicht instrumentiert oder ersetzt. Nach Bestätigung aller Maßnahmen lief die vollständige 2×-Runde 151,195 s und ergab 17.625 Flut-, 16.017 Abriss- und 33.642 Gesamtschaden bei 6.598 Budgetrest; das Ziel wurde erreicht. Die laufende Anzeige entsprach dem Ergebnis, nach Neustart stand der Schaden auf 0; Seitenfehler wurden nicht protokolliert.

Bei ausgeblendetem Menü wurden Bilder nach Erreichen von 120, 180 und 240 simulierten Sekunden aufgenommen. Die [Aufnahme ab 180 s](referenz-produktionsflut.png) zeigt laufende Schadensaufteilung, Gebäudezustände und Strömungsstriche im Gewässer. Der Graben und sein Wasserweg bleiben in der unvergrößerten Gesamtansicht sehr klein und nicht durchgehend nachvollziehbar. Die Prüfung verwendet feste Testkoordinaten und Einzelbilder; sie ersetzt weder den menschlichen Spieltest noch eine Geräte- oder Safariabnahme.

### Integrierte Prüfungen nach Szenariodownload

Ein aus Commit `5c2e0c4` isoliert erzeugter Produktionsbuild bestand am 29. Oktober 2026 mit Bun 1.4.4 die Typprüfung und den Build, 52 Vitest-Tests, zwei Python-Bruchkantentests und alle 38 Playwright-Chromium-Prüfungen (3,8 Minuten) unter Linux mit Softwaregrafik und eingerichteten Schriften. Die Browserprüfungen umfassen Maus und emulierten Touch in beiden Ausrichtungen, laufende und pausierte Maßnahmen, Quellen-Download sowie den kombinierten Neustart. Nachfolgende Änderungen, tatsächliches Safari, echte Mobilgeräte und ein menschlicher Spieltest sind damit nicht abgedeckt.

### Drei Runden auf Szenario 1.4

Ein aus `399bfa3` isoliert erzeugter Produktionsbuild mit `1.4-draft` wurde am 29. Oktober 2026 mit `bun tools/observe-three-rounds.mjs` geprüft. Der erste Versuch in Playwright-Chromium 156.0.8078.4 erreichte zwei vollständige Runden; während der dritten wurde die Seite geschlossen. Die Ursache ist nicht belegt, der Versuch ist nicht bestanden.

Eine Wiederholung mit Chrome 156.0.8078.73 unter Linux und Softwaregrafik bestand drei unbehandelte 2×-Runden mit Pause, Zoom, Fortsetzen und Neustarts. Die Runden dauerten 153,312 / 153,295 / 153,391 s, endeten jeweils bei 138.836 Gesamtschaden und 10.000 Budgetrest und meldeten keine Seitenfehler. Der Seiten-Heap nach den Runden betrug 30.656.186 / 23.117.977 / 18.813.445 Bytes; die RSS-Summen des Prozessbaums 1.360.351.232 / 1.370.898.432 / 1.378.258.944 Bytes bei je zehn Prozessen. RSS kann gemeinsam genutzte Seiten mehrfach zählen; drei Stichproben schließen langsame Speicherprobleme nicht aus. Der erfolgreiche Wiederholungslauf klärt die Ursache des ersten Abbruchs nicht und ersetzt weder Maßnahmen während aller drei Runden noch eine Geräteabnahme.

Auf einem aus `e8e20cb` isoliert gebauten Produktionsstand mit direkten Werkzeugpfaden und skalierten Strömungspfeilen wurden drei unbehandelte 2×-Runden erneut mit `bun tools/observe-three-rounds.mjs` ausgeführt: Chrome 156.0.8078.73, Linux, Playwright und Softwaregrafik. Der lokale Previewserver lief auf Port 4188; in der isolierten Kopie wurde ausschließlich der Berichtspfad nach `/tmp/wf-three-arrows-e8.json` geändert. Pause, Zoom, Fortsetzen und Neustarts funktionierten; es gab keine protokollierten Seitenfehler. Die Runden dauerten 162,533 / 156,057 / 157,482 s und endeten jeweils mit 138.836 Schaden sowie 10.000 Budgetrest. Der Seiten-Heap nach den Runden betrug 19.584.827 / 19.047.918 / 18.893.942 Bytes; die RSS-Summe des Testprozessbaums 1.288.146.944 / 1.300.971.520 / 1.307.267.072 Bytes bei je zehn Prozessen. Gemeinsame Speicherseiten können in der Summe mehrfach enthalten sein; drei Stichproben belegen kein langfristig stabiles Speicherverhalten. Die späteren Änderungen ab `4a54de4`, Eingriffe während der Runden und echte Geräte sind in diesem Lauf nicht enthalten.

### Firefox mit Szenario 1.4

Am 29. Oktober 2026 wurde ein isolierter Produktionsbuild von `7e91234` mit `bun tools/observe-firefox.mjs` im offiziellen Firefox 159.0 über geckodriver auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik geprüft. Laden, Start, Pause, Neustart sowie Vorschau und Bestätigung von Graben, Damm und Abriss funktionierten. Eine vollständige unbehandelte 2×-Runde endete nach 151,132 s bei 138.836 Gesamtschaden und 10.000 Budgetrest; die Ergebnisanzeige war im Screenshot lesbar. Der erste Startversuch scheiterte vor dem Browserstart an einem fehlenden Tastaturcompiler des lokalen X-Servers; mit dem bereits vorbereiteten X-Server gelang der Lauf. Für temporäre Testschriften war die Firefox-Content-Sandbox deaktiviert. Der automatisierte Lauf ersetzt keine manuelle Abnahme unter regulären Sicherheitseinstellungen und keinen Test auf echten Mobilgeräten.

### Gesamte Chromium-Suite nach den Review-Prüfungen

Am 29. Oktober 2026 bestanden nach `bun run build` auf Stand `7e91234` alle 39 Browserprüfungen mit `bun run test:browser` in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik und zwei Playwright-Workern (4,2 min). `WATERFIGHTER_CHROME`, `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` verwiesen auf den lokal installierten Browser, die benötigten Bibliotheken und die Testschriften. Der Lauf umfasst unter anderem die getrennten Maus- und emulierten Touchprüfungen, die Eingriffe während laufender und pausierter Flut, den verschobenen Referenzdamm und den Neustart nach allen Werkzeugen. Anwendung, Szenario und Browsertests waren auf den danach eingegangenen Dokumentations- und Diagnoseänderungen bis `2593e2e` unverändert. Ein vollständiger menschlicher Spieltest, echte Geräte und Safari werden dadurch nicht belegt.

Nach Korrektur der `ready`-Rundenfolge in `01f0a1f` bestanden Produktionsbuild, 52 Vitest-Tests und alle 40 Chromium-Browserprüfungen in derselben Linux-Umgebung (zwei Worker, 3,5 min). Der neue Browsertest sendet nach einem Neustart alte und doppelte Startmeldungen an eine laufende zweite Runde und prüft, dass Uhr, Zustand und Pause weiter funktionieren. Die spätere Anwendung von `803b812` enthält zusätzliche Oberflächen- und Spielregeländerungen; dieser Gesamtlauf belegt sie nicht. Die gesonderten Prüfungen dieser Änderungen und eine erneute Gesamtprüfung sind maßgeblich.

Ein zusätzlicher gezielter Lauf auf dem Produktionsbuild von `91f31af` prüfte neben alten und doppelten Meldungen auch eine übersprungene Rundennummer. Beide Prüfungen bestanden in Chrome 156.0.8078.73; bei dem Sprung zeigt die Oberfläche einen Fehler mit Neuladen an und deaktiviert den Start. Dies ist keine vollständige Browser-Suite für spätere Änderungen.

Ein isolierter Build von `0fb7d9c` bestand Build, Typprüfung, 54 Vitest- und zwei Python-Tests. Die Chromium-Suite mit einem Worker ergab 44 bestandene und einen fehlgeschlagenen von 45 Fällen: Im damaligen Bestätigungstest wurde die künstlich um eine Sekunde verzögerte Aktion vor der Budgetprüfung freigegeben; das Budget war bereits geändert. Der Test wurde in `ad874fa` auf eine explizit gesteuerte Freigabe umgestellt. Auf demselben isolierten Anwendungsbuild bestanden danach alle drei korrigierten Bestätigungstests einschließlich Ablehnung und Neustart mit verspäteter Aktion. Die fehlgeschlagene ursprüngliche Suite bleibt als solche dokumentiert; die späteren Anwendungsänderungen und eine vollständige Suite mit dem korrigierten Test sind damit nicht abgenommen.

Ein weiterer isolierter Produktionsbuild von `ccafdbb` bestand Build, Typprüfung, 54 Vitest- und zwei Python-Tests. Die vollständige Chromium-Suite mit zwei Workern ergab 50 von 51 bestandenen Fällen; beim Abriss im emulierten Touch-Querformat verschwand die Vorschau sofort. Drei Einzelwiederholungen auf demselben Build scheiterten ebenfalls. Eine instrumentierte Untersuchung zeigte, dass die Berührung das Gebäude traf, die Vorschau unter dem Finger erschien und der anschließende Klick auf „Verwerfen“ fiel. `14fa5ff` fängt den zu einer Kartenberührung gehörenden Klick ab; gezielte Maus- und Touchprüfungen bestanden danach. Der ursprüngliche Gesamtlauf bleibt fehlgeschlagen, und eine vollständige Suite auf dem korrigierten Stand ist gesondert nachzuweisen. Die Diagnose und Emulation ersetzen keine echten Geräte oder Safari.

### Touch-Folgeklick in Firefox

Am 29. Oktober 2026 wurde der korrigierte Produktionsbuild `14fa5ff` mit `bun tools/verify-firefox-touch.mjs` in Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop geprüft. Die X-Anzeige verwendete Mesa-Softwaregrafik; für die lokalen Testschriften war die Firefox-Content-Sandbox deaktiviert. Bei 844 × 390 CSS-Pixeln wählte das Skript den Abrissmodus programmatisch und löste eine emulierte Touch-Berührung auf der Karte aus. Die Gebäudevorschau blieb sichtbar und bestätigbar; eine separate Touch-Berührung auf „Verwerfen“ schloss sie und das Budget blieb bei 10.000. Der Kontrolllauf auf dem vorigen Build `00bb275` scheiterte: Nach derselben Berührung war die Vorschau bereits wieder geschlossen.

Der reproduzierbare Aufruf benötigt einen laufenden lokalen geckodriver und Produktionsserver sowie `WATERFIGHTER_FIREFOX` und gegebenenfalls `WATERFIGHTER_URL`; die Berührungsstellen sind feste Testkoordinaten. Der Test verwendet keinen echten Touchscreen und ersetzt weder eine vollständige Runde noch die Abnahme auf iPhone, Android oder tatsächlichem Safari.

### Kompakte Statusanzeige bei 320 × 480

Am 29. Oktober 2026 zeigte eine lokale Chromium-Sichtprüfung bei 320 × 480 CSS-Pixeln umgebrochene Zeit-, Budget- und Zustandswerte sowie eine sehr schmale Quellenleiste. Die angepasste Ansicht zeigt diese drei Werte einzeilig und legt die Quellen unter das scrollbare Werkzeugfeld. Ein neuer emulierter Touchtest prüfte die Textbreiten, getrennte Bereiche und die Treffflächen von Start, Neustart und Geschwindigkeit. Außerdem bestanden die vorhandenen vier Prüfungen für Vorschauen bei 320 × 480 und 480 × 320, Quellen und Szenariodownload. Die Prüfungen erfolgten auf einem isolierten Produktionsbuild mit Anwendungscode `29b5084` und der Layoutänderung; echte Geräte und menschliche Lesbarkeit bleiben offen.

In derselben 320 × 480-Ansicht ragten die Beschriftungen Damm, Graben und Abriss zuvor über die verfügbaren Schaltflächenbreiten. Das verbreiterte Werkzeugfeld hält die Texte innerhalb der Schaltflächen; die getesteten Treffflächen bleiben mindestens 44 × 44 CSS-Pixel groß. Der erweiterte Touchtest und die beiden Vorschauprüfungen für 320 × 480 und 480 × 320 bestanden im isolierten Produktionsbuild auf Basis `faa93fe`. Das ist kein Nachweis auf echten Geräten.

### Gezogene Berührungen im Baumodus

Eine gezogene Berührung zählt im Baumodus nicht mehr als ausgewählter Punkt; eine Rückmeldung fordert zum Antippen auf. Ein bereits gewählter Anfang bleibt erhalten, wenn die nächste Berührung versehentlich gezogen wird. Ein Chromium-Touchtest prüfte unter anderem eine Bewegung weg vom Anfang und wieder zurück, die anschließende gültige Dammvorschau und den Abrissmodus. Die bestehenden Tests für Moduswechsel während einer Berührung und einen zweiten Finger bestanden ebenfalls. Build und 53 Vitest-Tests bestanden; der Touchtest ist emuliert und ersetzt keine menschliche Geräteprüfung.

### Gestaffelte Eingriffe in einer Produktionsrunde

Am 29. Oktober 2026 spielte `bun tools/observe-staged-production.mjs` auf einem isolierten Produktionsbuild `7aae072` mit Szenario `1.4-draft` in Chrome 156.0.8078.73 unter Linux und Softwaregrafik. Testseitig berechnete Bildschirmkoordinaten setzten zwei Dämme in der Vorbereitung. Bei 02:03 wurde pausiert, das Gebäude für 1.602 abgerissen und der Graben für 600 bestätigt; während beider Eingriffe blieb die Uhr bei 02:03. Nach Fortsetzen endete die 2×-Runde mit 17.625 Flutschaden, 16.017 Abrissverlust, 33.642 Gesamtschaden und 6.598 Budgetrest; das Ziel war erreicht. Die Laufzeit betrug 170,184 s einschließlich Pause und Bedienung. Es wurden keine Seitenfehler gemeldet; nach Neustart standen Zeit, Budget und Schaden wieder bei 00:00, 10.000 und 0.

Dieser automatisierte Ablauf nutzt bekannte Koordinaten und bestätigt die Wirkung einer Pause auf dem getesteten Desktop-Build. Er belegt weder selbstständige menschliche Platzierung noch Echtzeitfähigkeit oder Aktionslatenz auf echten Mobilgeräten. Die Maßnahmenwerte im aufgezeichneten Bericht wurden zusätzlich mit den erwarteten Vorschaukosten verglichen; das Skript prüft sie nun unmittelbar.

### Wasserstand bei ausgeblendetem Menü

Die Kartenabfrage zeigt für nasse Zellen neben der Wassertiefe den aus aktuellem Worker-Bett und Tiefe berechneten Wasserspiegel über Wiener Null; trockene beziehungsweise sehr flache Zellen werden ausdrücklich bezeichnet. Bei ausgeblendetem Werkzeugmenü erscheint die Abfrage mit dem Zeitpunkt der Auswahl außerhalb des Menüs. Damit können Spielende Wasserstände auf beiden Seiten eines Damms vergleichen; der Wert wird bei einer erneuten Auswahl aktualisiert und ist keine Daueranzeige. Ein isolierter Versuch mit Tiefenfärbung allein machte den zuvor untersuchten Höhenunterschied nicht eindeutig erkennbar und wurde nicht übernommen.

Build und 55 Vitest-Tests bestanden. Fünf gezielte Chromium-Prüfungen bestätigten die Abfrage im ausgeblendeten Menü, das Verbergen beim Werkzeugwechsel, die Bedienbarkeit von Kopfzeile und Zoom bei 320 × 480 sowie die Einführung und Vorschau in kleinen Ansichten. Die Tests nutzen emulierte Eingaben; menschliche Verständlichkeit, tatsächliches Safari und echte Mobilgeräte bleiben offen.

### Höhenbezug beim Szenariostart

Ein gezielter Playwright-Chromium-Test am 29. Oktober 2026 lieferte dem Entwicklungsserver ein ansonsten unverändertes `1.4-draft`-Szenario mit Höhenbezug „Adria“. Der Lader meldete „Ungültiger Höhenbezug; Wiener Null erforderlich“, der Zustand zeigte „Fehler“ und der Startknopf blieb deaktiviert. Die Szenario- und Controller-Tests prüfen zusätzlich den unveränderten Datensatz sowie fehlenden und falschen Höhenbezug; Typprüfung bestand. Der Test prüft die Datenkennzeichnung und Fehlerbehandlung, nicht die fachliche Richtigkeit jeder Höhenordinate.

### Produktionsbuild mit Höhenbezugsprüfung

Am 29. Oktober 2026 wurde Commit `e5e0276` per `git archive` in ein separates Verzeichnis exportiert und mit den vorhandenen gesperrten Abhängigkeiten gebaut. `bun run test` bestand mit 56 Vitest-Tests; `bun run build` bestand einschließlich Typprüfung. Auf diesem isolierten Produktionsbuild bestanden alle 57 Playwright-Tests in Headless-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik (ein Worker, 6,6 Minuten). Eine separate Playwright-Konfiguration nutzte Port 4279 ohne Server-Wiederverwendung; Bibliotheken und Schriften wurden über die in dieser Umgebung eingerichteten `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` eingebunden.

Der Lauf umfasst unter anderem den fehlerhaften Höhenbezug, Maus- und emulierte Touchbedienung, laufende und pausierte Eingriffe, die verkürzte Runde und Neustart nach allen Werkzeugen. Er belegt weder eine vollständige menschliche Runde noch tatsächliches Safari oder echte Smartphones. Nach `e5e0276` hinzugekommene Änderungen sind nicht Teil dieses Laufs.

### Auswahl auf erhöhtem Wasser und Kameraneustart

Bei der Kartenabfrage und der Auswahl für Damm und Graben wird nun die sichtbare Wasseroberfläche berücksichtigt, wenn sie vor dem Gelände liegt; auf trockenem Gelände bleibt die Geländefläche auswählbar. Ein Diagnoseversuch projizierte drei Stellen des gespeicherten `1.4-draft`-Solverzustands nach 120 s auf den Bildschirm. Die bisherigen Geländeschnittpunkte lagen gegenüber den sichtbaren Wasserschnittpunkten um etwa 4,9 / 12,1 / 8,8 m versetzt; die neue Auswahl traf die Wasserschnittpunkte. Der reproduzierbare Diagnoseablauf verwendet `bun tools/compare-dam-backwater.ts --capture`, einen lokalen Entwicklungsserver und `bun tools/inspect-water-pick.mjs`; er ersetzt keine Prüfung durch eine spielende Person. Deaktivierte Gebäudemeshes werden bei der Gebäudeauswahl ausgelassen.

Die Änderung machte einen bestehenden Kameraneustartfehler sichtbar: Nach Verschieben der Karte setzte der Neustart zwar das Ziel, aber nicht alle Kamerawinkel auf den Ausgangswert zurück. Der vollständige Kamerazustand wird nun wiederhergestellt. Außerdem konnte eine beim Touch unter dem Finger erscheinende Vorschau den nachfolgenden Klick selbst abfangen; die getrennt implementierte Click-Sperre verhindert dies. Ein erster integrierter Browserlauf ergab deshalb 53 bestandene und zwei fehlgeschlagene Prüfungen; nach den Korrekturen bestanden auf einem isolierten Build basierend auf `e5e0276` alle 57 Chromium-Prüfungen, 57 Vitest-Tests und zwei Python-Tests. Eine gestaffelte 2×-Produktionsrunde auf demselben Build erreichte nach Pause bei 02:01, Abriss und Graben 33.642 Schaden und 6.598 Budgetrest; der Neustart setzte den Schaden zurück. Die Tests verwendeten Linux, Softwaregrafik und teils Testkoordinaten; sie ersetzen keine menschliche oder echte Geräteabnahme. Spätere Änderungen der Mesh-Grenzen sind darin nicht enthalten.

Auf einem anschließend isoliert aus Commit `6187434` erzeugten Produktionsbuild – einschließlich der inzwischen aktualisierten Gelände- und Wasser-Mesh-Grenzen – bestanden Build, 58 Vitest-Tests, zwei Python-Tests und alle 57 Playwright-Chromium-Prüfungen in 4,8 Minuten. Darin enthalten sind die beiden zuvor fehlgeschlagenen Touch- und Kameraneustartfälle, die Wasserabfrage sowie der kombinierte Neustart. Die Laufumgebung war Linux mit Softwaregrafik und den lokal eingerichteten Schriften; echte Geräte und menschliche Spielbarkeit bleiben ungetestet.

### Hinweis auf bereits durch Gebäude gesperrte Dammkanten

Der Worker zählt bei einer zulässigen Dammvorschau Kanten, die durch angrenzende Gebäude im aktuellen Modellzustand bereits mindestens ebenso hoch gesperrt sind; die Oberfläche erklärt die Anzahl. Die Aktion bleibt möglich und wird regulär bepreist. Ein Regeltest prüft die unveränderte Vorschau und das Verschwinden des Hinweises nach Gebäudeabriss. Ein Chromium-Test mit testseitig ergänzt platziertem Gebäude prüfte den Hinweis vor Bestätigung und unverändertes Budget; zwei emulierte Touchprüfungen bei 320 × 480 und 480 × 320 prüften sichtbare, erreichbare Bestätigungs- und Verwerfen-Schaltflächen. Build, 61 Vitest-Tests und zwei Python-Tests bestanden. Menschliche Verständlichkeit und echte Geräte bleiben offen.

### Produktionsbuild mit diagonaler Grabenführung

Am 29. Oktober 2026 wurde Commit `b5f2a8f` aus einem Git-Archiv separat gebaut. `bun run test` bestand mit 60 Vitest-Tests, der Produktionsbuild einschließlich Typprüfung bestand. Alle 58 Playwright-Tests bestanden in Headless-Chromium 156.0.8078.4 auf Linux mit Softwaregrafik (ein Worker, 6,5 Minuten). Der separate Previewserver verwendete Port 4289 ohne Wiederverwendung eines bestehenden Servers; lokale Bibliotheken und Schriften waren über `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` eingebunden.

Der Lauf umfasst die diagonale Grabenvorschau und Bestätigung, die Werkzeugbedienung mit Maus und emuliertem Touch sowie den kombinierten Neustart. Er prüft den genannten Commit, keine späteren Änderungen, keine menschliche Durchführung und keine echten Mobilgeräte oder tatsächliches Safari.

### Strömungsrichtung an den Markern

Die vorhandenen Strömungsmarker besitzen nun Pfeilspitzen, deren Orientierung aus der Geschwindigkeit im Worker-Snapshot folgt. Die [Kontrollansicht](nordgraben-stroemungspfeile.png) zeigt den gespeicherten Zustand des nördlichen Grabenvergleichs bei 210 s mit testseitig fokussierter Kamera und ausgeblendetem Menü. Sie wurde mit dem Entwicklungsserver und Headless-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik gerendert; sie ist weder eine vollständige Browserrunde noch eine menschliche Geräteprüfung. Die Pfeile zeigen den lokalen Modellzustand, keine garantierte Ableitung oder reale Strömung.

65 Vitest-Tests und Typprüfung bestanden. Fünf gezielte Chromium-Prüfungen bestanden: diagonale Grabenvorschau, Maßnahmen bei laufender und pausierter Flut, angehaltene Strömungsanimation in Pause sowie Einführung und Zustandsabfrage. Die Orientierung der Pfeilspitzen und das Entfernen der Grabenmarker nach Neustart werden zusätzlich in Modelltests geprüft. Eine vollständige Browserprüfung nach dieser Änderung sowie mobile Leistung und Lesbarkeit auf echten Geräten bleiben offen.

Am 29. Oktober 2026 bestanden auf einem isolierten Git-Archiv von Commit `b44c067` Produktionsbuild und 65 Vitest-Tests sowie alle 63 Playwright-Prüfungen in Headless-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik (ein Worker, 7,1 Minuten). Der separate Previewserver verwendete Port 4299 ohne Wiederverwendung; lokale Bibliotheken und Schriften waren über `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` eingebunden. Der Lauf umfasst unter anderem Pause und Fortsetzen der Strömungsanimation, beide Werkzeugausrichtungen, Fehlerbehandlung und den kombinierten Neustart. Er belegt den genannten Stand, keine spätere Änderung, menschliche Spielbarkeit oder echte Mobilgeräte.

### Strömungspfeile in schmaler Ansicht

Ein emulierter Chromium-Lauf mit 390 × 844 CSS-Pixeln und Geräteskalierung 1 zeigte die vorherigen Strömungspfeile in der [Übersicht](stroemung-mobil-vorher.png) sehr klein. Die neue Größenregel vergrößert die regulären Pfeile beim Herauszoomen begrenzt; auf der [neuen Übersicht](stroemung-mobil-uebersicht.png) sind ihre Spitzen in dieser Sichtprobe besser zu erkennen. In [vergrößerter Ansicht](stroemung-mobil-nah.png) behalten Pfeile entlang bestätigter Gräben eine auf die Zellgröße begrenzte Länge, um nicht weit über die schmale Trasse hinauszuweisen.

Die drei Bilder zeigen denselben gespeicherten Solverzustand des nördlichen Grabenvergleichs bei 210 s, testseitig in den Renderer eingesetzt. Für die Übersicht blieb die Ausgangskamera erhalten; die Nahaufnahme wurde testseitig auf den Graben zentriert. Das Menü wurde über die Oberfläche ausgeblendet. Weil der Zustand direkt in den Renderer eingesetzt und der Worker beendet wurde, bleiben Zeit- und Schadensanzeigen im Bild auf dem vorherigen Oberflächenstand; sie sind für diesen Sichtvergleich nicht gültig. Das Verfahren `bun tools/compare-northern-exposure.ts trench --snapshot=/tmp/wf-north-210-trench.json` und `node tools/render-mobile-flow.mjs` wurde mit Headless-Chromium 156.0.8078.4 unter Linux und Softwaregrafik ausgeführt. Das Ausgangsbild stammt von `6c18bcc`; die neuen Bilder enthalten die Maßstabsanpassung. Echte Geräte und menschliche Lesbarkeit bleiben offen.

Alle 67 Vitest-Tests und die Typprüfung bestanden. Zwei gezielte Chromium-Prüfungen für diagonale Grabenbestätigung und angehaltene Strömungsanimation in Pause bestanden. Ein neuer vollständiger Browserlauf und die mobile Leistungsmessung stehen aus. Die Pfeile zeigen lokale modellierte Strömung und beweisen keine durchgehende Ableitung.

Auf einem isolierten Git-Archiv von `870f345` bestanden am 29. Oktober 2026 der Produktionsbuild, alle 67 Vitest-Tests und alle 63 Playwright-Prüfungen in Headless-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik (ein Worker, 7,8 Minuten). Der separate Previewserver verwendete Port 4319 ohne Wiederverwendung; lokale Bibliotheken und Schriften waren über `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` eingebunden. Der Lauf belegt den genannten Commit, einschließlich Pause, Werkzeugbedienung und Neustart; er ersetzt weder tatsächliche Mobilgeräte noch die menschliche Lesbarkeitsprüfung.

### Aktuelle vollständige Firefox-Runde

Am 29. Oktober 2026 wurde ein isolierter Produktionsbuild von `0559025` in offiziellem Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik geprüft. Nach Start, Pause und Neustart bestätigte `bun tools/observe-firefox.mjs` je eine Graben-, Damm- und Abrissvorschau mit erneutem Neustart zwischen den Werkzeugen. Anschließend endete eine unbehandelte 2×-Runde nach 150,149 s mit 138.836 Flutschaden, 0 Abrissverlust, 10.000 Budgetrest und verfehltem Ziel; die Ergebnisanzeige war auf der [Kontrollaufnahme](firefox-0559025.png) sichtbar und lesbar.

Der erste Versuch scheiterte an fehlender GLX-Unterstützung der virtuellen Anzeige; `+extension GLX +iglx` und die lokale Mesa-Konfiguration stellten sie bereit. Ein anschließender Grabenversuch wurde mit den älteren Testkoordinaten wegen eines Gebäudes korrekt abgelehnt; das Prüfskript verwendet nun freie Punkte auf dem Wasser. Die Firefox-Content-Sandbox war für lokale Testschriften deaktiviert. Der Ablauf nutzt feste Testkoordinaten und ersetzt weder eine menschliche Abnahme noch tatsächliches Safari oder Mobilgeräte; die zwei ersten Fehlversuche sind keine bestandenen Runden.

### Zellnahe Strömungsmarker

Die Mittelpunkte der regulären Strömungsmarker entsprechen nun den Mittelpunkten der Zellen, aus denen ihre Geschwindigkeit stammt, und bewegen sich wie die Grabenmarker nur begrenzt um diese Stelle. Ihre Höhe wird am Zellmittelpunkt aus den benachbarten Eckhöhen der gerenderten Wasseroberfläche berechnet. Die Pfeilgeometrie kann je nach Maßstab über die einzelne Zelle hinausreichen; sie ist weiterhin eine vereinfachte Darstellung und kein verfolgtes Wasserteilchen.

Ein Modelltest prüft Zellmittelpunkt, Oberflächenhöhe und Bewegungsgrenze auf einem unebenen 2 × 2-Raster. Alle 68 Vitest-Tests und Typprüfung bestanden; zwei gezielte Chromium-Prüfungen für Pausenanimation und Einführung bestanden. Die [schmale Sichtprobe](stroemung-zellnah.png) verwendet wie der frühere Mobilvergleich einen testseitig eingesetzten Solverzustand bei 210 s und eine fokussierte Kamera. Der Worker wurde dafür beendet, weshalb die eingeblendeten Zeit- und Schadenswerte nicht den dargestellten Zustand beschreiben. Der Lauf erfolgte unter Linux mit Headless-Chromium 156.0.8078.4 und emuliertem Touch; tatsächliche Geräte, mobile Leistung und ein neuer vollständiger Browserlauf bleiben offen.

Der Produktionsbuild von `64ba8bd` wurde zusätzlich aus einem separaten Git-Archiv erstellt; Build und alle 68 Vitest-Tests bestanden. Dies ergänzt die gezielten Browserprüfungen oben, ist aber kein vollständiger Browserlauf und keine Geräteabnahme.

Auf dem isolierten Produktionsbuild `64ba8bd` bestanden am 29. Oktober 2026 zusätzlich alle 64 Playwright-Prüfungen in Headless-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik (ein Worker, 8,0 Minuten). Ein separater Previewserver verwendete Port 4339 ohne Wiederverwendung; lokale Bibliotheken und Schriften waren über `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` eingebunden. Der Lauf umfasst unter anderem die Pausenanimation, Bauauswahl mit Kartenverschiebung und den kombinierten Neustart. Er prüft diesen Commit, keine spätere Änderung oder echten Geräte.

### Vorschauersatz und angeschlossene Gräben

Auf Anwendungscode `bc6c8ed` bestanden am 29. Oktober 2026 `bun run test` mit 70 Modelltests sowie `bun --bun playwright test tests/browser/connected-trench.spec.ts tests/browser/preview-selection.spec.ts --workers=1` mit drei gezielten Fällen auf dem Vite-Entwicklungsserver. Playwright-Chromium 156 unter Linux verwendete Softwaregrafik und für einen Fall emulierten Touch. Die Fälle prüfen die Kosten einer überlappenden Grabenverlängerung und das Ersetzen einer unbestätigten Vorschau per Maus und Touch. Sie sind keine vollständige Browser-Suite, keine vollständige Spielrunde und keine Geräteabnahme.


### Grabenanschluss nach Flutbeginn

Zwei gezielte Playwright-Prüfungen auf dem isolierten Produktionsbuild `42da208` bestätigten zunächst einen Graben in der Vorbereitung und verlängerten ihn nach mindestens vier simulierten Sekunden. Eine Prüfung führte die Verlängerung bei laufender 2×-Flut aus, die andere in einer Pause. Beide prüften anhand der Worker-Vorschaunachricht, dass der neue Verlauf tatsächlich alte und neue Zellen enthält, dass die Vorschau deren Wiederverwendung und nur die Kosten neuer Zellen nennt und dass die Kosten erst bei Bestätigung einmalig abgezogen werden. In der Pause blieb die angezeigte Zeit stehen; während der laufenden Variante blieb der Zustand „Läuft“. Die Tests verwendeten automatisierte Bildschirmpositionen in Chromium unter Linux mit Softwaregrafik. Sie belegen weder eine gesamte Runde noch die Bedienung auf echten Geräten; Wassererhaltung und Wiederholung der Aktion werden gesondert durch die Regel- und Workertests geprüft.

### Kompakter Rundenzustand bei ausgeblendetem Menü

Die Kopfzeile zeigt bei verborgenem Werkzeugmenü zusätzlich Zeit, Budget und Zustand; die regulären Anzeigen im Menü bleiben maßgeblich und werden aus denselben Worker-Snapshots aktualisiert. Auf dem Vite-Entwicklungsserver bestanden die gezielten Chromium-Prüfungen für 320 × 480 und 480 × 320 CSS-Pixel mit emuliertem Touch, laufender Uhr und Budget nach bestätigter Maßnahme. Kartenabfrage, Status und Quellen im kleinen Hochformat sowie Grabenhinweise in beiden Ausrichtungen blieben in weiteren vier Fällen erreichbar. Ein fünfter Grabenhinweisfall erreichte bei parallelen Browserläufen zunächst das 30-s-Testlimit; die gezielte Wiederholung mit 90-s-Grenze bestand nach 18,2 s. Der Produktionsbuild und 71 Modelltests bestanden. Die Tests verwenden Linux-Softwaregrafik und belegen weder menschliche Lesbarkeit noch echte Geräte oder eine vollständige Browser-Suite des geänderten Stands.

### Gesamtsuite nach Vorschauersatz

Aus einem separaten Git-Archiv von `d436db0` wurde am 29. Oktober 2026 der Produktionsbuild erstellt und mit Playwright-Chromium 156 unter Linux in Softwaregrafik auf Port 4359 geprüft. Alle 69 Browserfälle bestanden mit einem Worker in 13,2 Minuten. Der Lauf belegt den damaligen Vorschauersatz einschließlich bestehender Maus-, Touch-, Neustart- und Fehlerfälle; spätere Änderungen an Grabenanschluss und Statusanzeige sind darin nicht enthalten. Echte Geräte und menschliche Bedienung bleiben offen.

Der kompakte Status wurde zusätzlich auf dem späteren Entwicklungsstand mit einer auf zwei Sekunden verkürzten Runde überprüft: Bei ausgeblendetem Menü zeigt er das Rundenende und nach „Neue Runde“ wieder 00:00, Vorbereitung und das Ausgangsbudget. Das ist ein gezielter Chromium-Test und keine vollständige Runde oder Geräteprüfung.

### Produktionsbuild mit Grabenanschlüssen

Auf dem isolierten Produktionsbuild `bc6c8ed` bestanden am 29. Oktober 2026 der Build, alle 70 Vitest-Tests und alle 71 Playwright-Prüfungen in Headless-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik (ein Worker, 13,5 Minuten bei paralleler Testlast). Der Previewserver verwendete Port 4349 ohne Wiederverwendung; lokale Bibliotheken und Schriften waren über `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` eingebunden. Der Lauf enthält unter anderem die Anschlussvorschau mit Kosten nur für neue Zellen, Touchbedienung, Pause und kombinierten Neustart. Er belegt den genannten Commit und ersetzt weder spätere Tests noch die menschliche und echte Geräteabnahme.

### Grabenanschluss per emuliertem Touch

Am 29. Oktober 2026 bestätigte `tests/browser/connected-trench-touch.spec.ts` im Chromium-Entwicklungsbrowser Grabenanschlüsse per emuliertem Touch bei 390 × 844 und 844 × 390 CSS-Pixeln. In beiden Fällen wurde zuerst der diagonale Referenzgraben gesetzt und anschließend eine teilweise überlappende Strecke ausgewählt. Der Test vergleicht die vom Worker empfangenen Zellfolgen, prüft den Hinweis auf bereits ausgehobene Zellen und die Kosten ausschließlich für neue Zellen und bestätigt die korrekte Budgetänderung. Die verwendeten Testkoordinaten sind fest; im Hochformat wird die Karte zuvor testseitig verschoben.

Ein erster Versuch mit weiter verlängerten Endpunkten wurde in beiden Formaten korrekt wegen eines Gebäudes abgelehnt; für den Anschlussnachweis wurden andere feste zulässige Endpunkte gewählt. Die zwei anschließenden Fälle bestanden in Headless-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik. Emulation und feste Koordinaten ersetzen weder selbstständige menschliche Platzierung noch Tests auf echten Smartphones.

### Aktueller Produktionsbuild unter einem Unterpfad

Ein isoliertes Git-Archiv von `7528e5b` wurde mit `bun --bun vite build --base /waterfighter/ --outDir /tmp/wf-subpath-build-7528e5b` gebaut. `WATERFIGHTER_DIST=/tmp/wf-subpath-build-7528e5b bun tools/verify-static-subpath.mjs` lieferte den Build unter `/waterfighter/` aus und bestand in Google Chrome 156.0.8078.73 unter Linux. Die Prüfung lud Szenario und Worker, bestätigte einen Damm, startete und pausierte die Uhr, setzte zurück und prüfte beide Szenariodownload-Links sowie den entpackten Inhalt bytegleich gegen die Szenariodatei. Alle 25 protokollierten Anfragen waren erfolgreich; Seitenfehler wurden nicht gemeldet. Anwendungscode, Szenario, Vite-Konfiguration und Paketlock stimmen mit `1f54165` überein. Dies belegt keine dauerhafte öffentliche Bereitstellung, Lizenzfreigabe oder Geräteabnahme.

### Werkzeughinweise bei verborgenem Menü

Bei ausgeblendetem Werkzeugmenü werden Hinweise zur Start- und Endpunktwahl, zum Verschieben, zu ungültigen Auswahlen und zu bestätigten Maßnahmen über der Karte angezeigt. Während eine Maßnahmenvorschau sichtbar ist, bleibt der zusätzliche Hinweis verborgen; im Kartenmodus bleibt die bestehende Wasser- und Gebäudeabfrage zuständig.

Am 30. Oktober 2026 bestanden Produktionsbuild und 72 Modelltests. In Google Chrome 156 unter Linux bestanden 14 gezielte Vite-Browserfälle: Hinweise mit emuliertem Touch bei 320 × 480 und 480 × 320 CSS-Pixeln, Kartenabfrage, ungültige Gebäudeauswahl, Vorschauersatz, ausstehende Aktionen und Kartenverschiebung. Die kleinen Ansichten prüften auch die Trennung von Kopfzeile und Zoom sowie das Erreichen der Bestätigung. Die Prüfungen ersetzen weder menschliche Bedienung noch echte Geräte oder eine vollständige Browser-Suite dieses Stands.

### Drei Runden mit schematischer Grabenlinie

Am 30. Oktober 2026 wurde ein isoliertes Git-Archiv von `9ae2a96` mit `bun run build` gebaut und lokal statisch ausgeliefert. `bun tools/observe-three-rounds.mjs` spielte in Google Chrome 156.0.8078.73 unter Linux mit Softwaregrafik drei unbehandelte 2×-Runden auf Szenario `1.4-draft`. In jeder Runde wurde kurz nach Beginn pausiert, hinein- und herausgezoomt und fortgesetzt; zwischen den Runden wurde über die Oberfläche neu gestartet. Die drei Ergebnisse waren identisch: jeweils 138.836 Flutschaden, kein Abrissverlust und 10.000 Budgetrest. Die Runden dauerten 156,775, 153,607 und 154,095 s einschließlich Bedienung; Seitenfehler oder Verbindungsabbrüche wurden nicht protokolliert.

Die Summe der `VmRSS`-Werte des Testprozesses und seiner Nachfahren betrug zu den sechs Messzeitpunkten vor und nach den Runden 1,30 bis 1,33 GB; gemeinsam genutzte Seiten können mehrfach gezählt werden und GPU-Speicher wird nicht zuverlässig erfasst. Die Momentaufnahmen belegen keine allgemeine Speichergrenze. Der Lauf enthält keine Baumaßnahmen, keine echte Geräteprüfung und keine menschliche Bedienung. Die spätere Änderung `25d4151` an Werkzeughinweisen ist darin nicht enthalten.

### Babylon.js 9.33.1

Am 30. Oktober 2026 wurde `@babylonjs/core` von 9.33.0 auf 9.33.1 aktualisiert. `bun install --frozen-lockfile`, Produktionsbuild und 72 Vitest-Fälle bestanden; `bun outdated` meldete keine veralteten direkten Pakete und `bun audit` keine bekannten Schwachstellen unter 88 geprüften Paketen. Die festgelegten Versionen der Python-Geodaten- und Plotpakete entsprachen bei Abfrage den stabilen PyPI-Versionen.

Sechs gezielte Fälle für Werkzeughinweise in kleinen Ansichten, getrennte Grabenplatzierung und sichtbare Grabentrasse bestanden auf dem Produktionsbuild in Google Chrome 156 unter Linux. Eine unmittelbar zuvor gestartete Gesamtsuite mit Babylon 9.33.0 wurde nach vier bestandenen Fällen bewusst beendet, um den Abhängigkeitsstand zu aktualisieren; sie ist kein Gesamtbeleg. Die vollständige Browser-Suite für 9.33.1 bestand anschließend im [gesonderten Durchgang](#vollständiger-browserdurchgang-mit-babylonjs-9331); echte Geräteprüfungen stehen noch aus.

### Gesamte Chromium-Suite mit Werkzeughinweisen

Am 30. Oktober 2026 bestanden auf einem isolierten Git-Archiv von `25d4151` eine Installation mit `bun install --frozen-lockfile`, der Produktionsbuild und alle 89 Playwright-Prüfungen (`bun run test:browser --workers=1 --timeout=60000`). Der Produktionsserver verwendete im isolierten Test Port 4392 statt des Standardports. Google Chrome 156.0.8078.73 lief unter Linux mit Softwaregrafik; lokale Bibliotheken und Schriften waren über `LD_LIBRARY_PATH` und `FONTCONFIG_FILE` eingebunden. Die Suite dauerte 14,1 Minuten und umfasst die Werkzeughinweise, die kombinierten Neustarts und die Auswahl der Abrissstrategie. Touchfälle sind emuliert.

Der Lauf verwendete Babylon.js 9.33.0 aus dem Lockfile dieses Commits. Die parallel erfolgte Aktualisierung auf 9.33.1 ist darin nicht enthalten; echte Geräte, tatsächliches Safari und menschliche Bedienung bleiben separat offen.

### Vollständiger Browserdurchgang mit Babylon.js 9.33.1

Für Anwendungscode `c8b4b33` wurde ein isolierter Produktionsbuild mit Bun und Babylon.js 9.33.1 erstellt. Der vollständige Playwright-Durchgang bestand mit **89 von 89 Prüfungen** in 14,2 Minuten; verwendet wurden Chrome 156.0.8078.73 unter Linux, Headless-Modus, Softwaregrafik und ein Testworker. Die Browserbibliotheken und Schriften wurden lokal bereitgestellt. Der nachfolgende Commit `1eb8e54` änderte Diagnoseskript und Dokumentation, jedoch weder Anwendungscode noch Browserprüfungen oder Abhängigkeiten.

Die Suite deckt unter anderem Maus und emulierte Touch-Bedienung, Vorschau und Bestätigung, Fehlerfälle, Aktionen bei laufender und pausierter Flut sowie Neustart ab. Sie ersetzt keine manuelle Prüfung und keine Abnahme auf echtem iPhone, Android-Gerät oder in Safari. Die Vite-Buildausgabe meldete eine Warnung zu einem JavaScript-Chunk über 500 kB; der Build war erfolgreich.

### Produktionsbuild unter Unterpfad mit Babylon.js 9.33.1

Für Commit `52807d5` wurde ein isolierter Build mit `bun --bun vite build --base /waterfighter/` erstellt und mit `bun tools/verify-static-subpath.mjs` unter diesem Pfad geprüft. Chrome 156.0.8078.73 lud HTML, Skripte, Worker und komprimiertes Szenario ohne fehlgeschlagene Anfragen; eine Dammmaßnahme wurde bestätigt, die Uhr bis 00:01 gestartet und anschließend pausiert und zurückgesetzt. Der Quellenhinweis und der direkte Szenariodownload waren erreichbar, das entpackte Downloadpaket stimmte byteweise mit der Quelldatei überein. Der Test lief lokal im Headless-Modus und stellt keine öffentliche Veröffentlichung oder Geräteabnahme dar.

### Später Landgraben mit Babylon.js 9.33.1

Am 30. Oktober 2026 wurden ein isoliertes Git-Archiv von `1e770da` mit `bun install --frozen-lockfile` installiert und mit `bun run build` gebaut. `bun tools/observe-land-production.mjs --after-flood` spielte den statisch ausgelieferten Build in Google Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. Drei Dämme wurden vor Flutbeginn bestätigt; bei 02:31 wurde pausiert und der nördliche Graben für 650 Budgeteinheiten bestätigt. Die Uhr blieb während der Pause stehen. Nach Fortsetzen endete die 2×-Runde nach 158,470 s einschließlich Bedienung mit 1.414 Flutschaden, keinem Abrissverlust und 7.510 Budgetrest; das Ziel von 50.000 wurde erreicht. Der Neustart setzte Zeit, Budget und Schaden zurück. Die Worker-Vorschau wurde testseitig mitgelesen; die Auswahl verwendete feste Bildschirmkoordinaten und eine kleine Endpunktkorrektur. Es wurden keine Seitenfehler protokolliert.

Ein erster Versuch auf demselben Build endete vor dem Ergebnis mit `Target page, context or browser has been closed`; die Ursache blieb ungeklärt. Parallel lief ein separater Firefox-Test. Nach dessen Ende gelang die oben beschriebene Wiederholung mit zusätzlicher Ereignisprotokollierung; das beweist nicht, wodurch der erste Abbruch verursacht wurde. Der Lauf belegt weder menschliches Auffinden der Trasse noch echte Geräte. Spätere Änderungen an der Kartenabfrage sind im getesteten Build nicht enthalten.

### Vollständige Runde bei maximaler Vergrößerung

Ein lokaler Produktionsbuild mit Anwendungscode `4dfe2e7` und Szenario `1.4-draft` wurde mit Chrome 156.0.8078.73 unter Linux und Softwaregrafik geprüft. `bun tools/observe-three-rounds.mjs --close --rounds=1` pausierte bei 00:03, vergrößerte die Ansicht über die Zoom-Schaltfläche bis zum Anschlag und setzte die unbehandelte 2×-Runde fort. Nach 170,259 s erreichte sie das Ergebnis: 138.836 Flutschaden, kein Abrissverlust und 10.000 Budgetrest. Das Schadensziel wurde ohne Maßnahmen verfehlt; Seitenfehler wurden nicht protokolliert. Die Zeit umfasst die Bedienung und ist keine Leistungsabnahme.

Der Versuch prüfte eine einzelne Runde ohne Baumaßnahmen bei fokussierter Karte, keine drei aufeinanderfolgenden Runden und keine echte Geräte- oder menschliche Bedienprüfung. Der Build der Anwendung war vor den späteren Dokumentations- und Diagnoseänderungen erstellt worden; diese änderten den Anwendungscode nicht.

### Größenwechsel bei geöffneter Vorschau

Am 30. Oktober 2026 bestanden nach `bun run build` zwei gezielte Fälle in `tests/browser/orientation-change.spec.ts` auf Anwendungscode `9461371` mit Chrome 156.0.8078.73 unter Linux und Softwaregrafik. In einer emulierten Touchansicht wurde jeweils eine Grabenmaßnahme ausgewählt und die gültige Vorschau geöffnet. Anschließend wechselte der Test die Viewportgröße von 390 × 844 auf 844 × 390 CSS-Pixel beziehungsweise umgekehrt. In beiden Fällen blieb der Vorschautext unverändert, die Bestätigung lag sichtbar und treffbar im Fenster, und nach dem Tippen sank das Budget genau um die angezeigten Kosten.

Dies prüft die Reaktion auf eine Größenänderung bei offener Vorschau, keine physische Gerätedrehung, keine während der Drehung laufende Geste und keine menschliche Bedienung. Die Gesamtsuite auf diesem Anwendungsstand wurde zuvor ohne die beiden neuen Fälle ausgeführt.

### Drei Runden bei maximaler Vergrößerung

Auf dem Produktionsbuild mit Anwendungscode `4dfe2e7` und Szenario `1.4-draft` spielte `bun tools/observe-three-rounds.mjs --close --rounds=3` in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik drei unbehandelte 2×-Runden. Jede Runde wurde bei 00:02 oder 00:03 pausiert, über die Zoom-Schaltfläche maximal vergrößert und fortgesetzt; dazwischen erfolgte jeweils der Neustart über die Oberfläche. Die Runden dauerten 171,508 / 171,481 / 164,410 s einschließlich Bedienung und endeten jeweils mit 138.836 Schaden und 10.000 Budgetrest. Seitenfehler wurden nicht protokolliert.

Der Seiten-Heap nach den Runden betrug 20.992.484 / 23.891.610 / 20.317.674 Bytes; die Prozessbaum-RSS-Summen betrugen 1.320.935.424 / 1.335.734.272 / 1.329.504.256 Bytes bei jeweils zehn Prozessen. Gemeinsame Seiten können mehrfach gezählt werden; drei Stichproben belegen keine langfristige Speicherstabilität. Die Runden enthielten keine Baumaßnahmen und ersetzen keine echten Geräte- oder menschlichen Spieltests.

### Firefox-Wiederholung nach Zoomänderung: abgebrochen

Am 30. Oktober 2026 wurde der isolierte Produktionsbuild von `489e515` mit Anwendungscode und Abhängigkeiten entsprechend `b1e9055` in Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Softwaregrafik untersucht. Die Firefox-Content-Sandbox war für lokale Testschriften deaktiviert. Für den lokalen X-Server wurde eine temporäre Kopie verwendet, die den vorhandenen Tastaturcompiler aus `/tmp/xkb` statt aus dem hier fehlenden Standardpfad aufruft.

Der erste Browserstart meldete fehlendes WebGL; mit dem explizit gesetzten Mesa-Treiberpfad startete die Anwendung. Im kleineren virtuellen Fenster verfehlten die festen Testpunkte die Karte. Ein weiterer Lauf mit größerer Anzeige erreichte Damm- und Grabenbestätigung, fand aber mit den vorhandenen Punkten kein abreißbares Gebäude. In einer temporären Kopie von `tools/observe-firefox.mjs` wurden daher für diese Fenstergröße zusätzliche Abriss-Testpunkte ergänzt. Damit erreichte der nächste Lauf die vollständige 2×-Runde, brach aber vor einem überprüften Ergebnis mit verlorener WebDriver-Sitzung ab. Der Treiber meldete Kanalfehler; beim Aufräumen überdeckte ein `invalid session id` die ursprüngliche Fehlerstelle. Eine eindeutige Ursache wurde nicht festgestellt.

Diese Versuche sind keine erfolgreiche vollständige Firefox-Abnahme des Zoomstands. Die [frühere vollständige Firefox-Runde](#firefox-runde-mit-babylonjs-9331) auf `c8b4b33` bleibt ein separater Beleg. Tatsächliches Safari, menschliche Bedienung und echte Mobilgeräte bleiben offen.

### Firefox-Wiederholung nach Korrektur der Diagnose

Ein anschließender Versuch brach zunächst im Testskript mit `ReferenceError: phase is not defined` ab. Die Phasenvariable wurde in `506ed5c` ergänzt; der ursprüngliche Fehler wird bei einem zusätzlich scheiternden Sitzungsabbau erhalten. Ein lokaler simulierter WebDriver-Gegenversuch mit getrenntem Fehler beim Laden und beim Abbau bestätigte, dass beide Meldungen sichtbar bleiben und das Skript fehlerhaft endet.

Danach bestand die vollständige Wiederholung am 30. Oktober 2026 auf dem isolierten Produktionsbuild `489e515` mit demselben Anwendungscode und denselben Abhängigkeiten wie `b1e9055`: Firefox 159.0, geckodriver 0.37.1, virtueller Linux-X-Desktop mit Softwaregrafik und für Testschriften deaktivierter Content-Sandbox. Eine temporäre Skriptkopie verwendete ergänzte feste Abriss-Testpunkte für die Fenstergröße. Start, Pause und Neustart sowie Vorschau und Bestätigung von Graben, Damm und Abriss funktionierten; nach Rücksetzung zwischen den Werkzeugen endete eine unbehandelte 2×-Runde bei 05:00 nach 150,527 s mit sichtbarem Ergebnis, 138.836 Flutschaden und 10.000 Budgetrest. Das Ziel wurde verfehlt. Der vorherige Sitzungsabbruch ist damit nicht erklärt. Die spätere Darstellungsänderung `a51f659`, menschliche Bedienung, tatsächliches Safari und echte Mobilgeräte sind in dieser Wiederholung nicht geprüft.

### Gesamtsuite mit näherer Kartenansicht

Am 30. Oktober 2026 bestanden auf einem isolierten Git-Archiv von `b21cedc` der Produktionsbuild mit Typprüfung, alle 72 Vitest-Fälle und alle 91 Playwright-Chromium-Fälle. Die Suite lief mit einem Worker und `--timeout=90000` in 8,5 Minuten auf Google Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. Der isolierte Testserver verwendete Port 4396; die installierten Abhängigkeiten stammten aus einer separaten Installation mit derselben Lockdatei. Ein Fall simuliert Wasser für die Grabentrasse; Touch und Größenwechsel sind emuliert.

Der Lauf umfasst unter anderem beide Größenwechsel bei offener Vorschau, alle drei Werkzeuge, Rücksetzung und Auswahl nach Kartenverschiebung. Anwendungscode, Szenario, Browserprüfungen und Abhängigkeiten stimmen mit `9ce9c28` überein. Der Build meldete die bestehende Größenwarnung für einen JavaScript-Chunk. Menschliche Bedienung, tatsächliches Safari und echte Mobilgeräte sind nicht geprüft; die Laufzeit ist keine Geräteleistungsmessung.

### Drei Runden mit allen Werkzeugen

Am 30. Oktober 2026 spielte `bun tools/observe-three-rounds.mjs --actions` drei vollständige 2×-Runden auf einem isolierten Produktionsbuild von `b21cedc` mit Szenario `1.4-draft` in Chrome 156.0.8078.73 unter Linux und Softwaregrafik. Der ergänzte Skriptmodus wurde für diesen Lauf in das isolierte Archiv kopiert. In jeder Runde pausierte er bei 00:02, bestätigte mit festen Mauskoordinaten nacheinander Graben, Damm und Abriss und prüfte jeweils den angezeigten Preis, die Budgetänderung und die unveränderte Uhrzeit. Danach zoomte er hinein und heraus und setzte die Flut fort. Zwischen den Runden wurden Zeit, Budget und Schadensanzeige nach Neustart geprüft.

Alle drei Runden endeten ohne protokollierte Seitenfehler mit 138.830 Flut- und 78.239 Abrissschaden, insgesamt 217.069, und 526 Budgetrest. Die Kosten waren jeweils 650 für den Graben, 1.000 für den Damm und 7.824 für den Abriss. Die für den Stabilitätstest gewählten Maßnahmen verfehlten das Ziel und sind keine Schutzstrategie. Die Rundendauern einschließlich Pause und Bedienung betrugen 161,311, 159,957 und 160,682 s.

Die Summen der `VmRSS`-Werte des Testprozesses und seiner Nachfahren lagen vor beziehungsweise nach den drei Runden bei 1,306/1,344, 1,352/1,396 und 1,404/1,386 GB. Sie können gemeinsam genutzte Seiten mehrfach zählen und erfassen GPU-Speicher nicht zuverlässig; sechs Stichproben reichen nicht, um ein Speicherleck auszuschließen oder nachzuweisen. Feste Testpunkte und ein virtueller Desktop ersetzen keine menschliche Bedienung oder echte Geräteprüfung.

Nach der weiteren Zoom- und Markeranpassung `a51f659` wurde die einzelne Nahzoom-Runde auf einem isolierten Produktionsbuild von `d092aec` wiederholt. Chrome 156.0.8078.73 unter Linux mit Softwaregrafik pausierte bei 00:02, zoomte bis zum Anschlag und setzte die unbehandelte 2×-Runde fort. Nach 162,156 s zeigte das Ergebnis 138.836 Schaden und 10.000 Budgetrest; es wurden keine Seitenfehler protokolliert. Die Runde enthielt keine Baumaßnahmen und belegt weder drei Runden mit dieser Zoomstufe noch eine echte Geräteabnahme.

### Speicherdiagnose nach zwölf Kurzrunden auf Szenario 1.4

Am 30. Oktober 2026 wurde `bun tools/inspect-restart-memory.mjs` auf einem isolierten Produktionsbuild von `b21cedc` in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik zweimal ausgeführt: zunächst ohne, danach mit `--worker-gc`. Der Test ersetzt das geladene Szenario jeweils durch eine Variante mit zwei Sekunden Rundendauer und führt zwölf Runden mit Neustarts ohne Maßnahmen aus. Nach jedem Neustart erzwingt er eine Sammlung des Seiten-Heaps; im zweiten Lauf zusätzlich eine Worker-Sammlung. Beide Läufe verwendeten `1.4-draft` und meldeten keine Seitenfehler.

Ohne erzwungene Worker-Sammlung stieg die Renderer-PSS-Summe von 170.727.424 Bytes nach Runde 1 auf 205.901.824 Bytes nach Runde 12; der Seiten-Heap nach Sammlung stieg von 12.356.476 auf 12.929.688 Bytes. Mit Worker-Sammlung betrug die Renderer-PSS-Summe 160.595.968 beziehungsweise 195.096.576 Bytes und der Seiten-Heap 12.352.192 beziehungsweise 12.945.044 Bytes. Im zweiten Lauf lag die Renderer-PSS nach Runde 10 bei 154.806.272 Bytes und nach Runde 11 bei 194.293.760 Bytes; auch mehrere andere Prozessgruppen zeigten dort einen sprunghaften PSS-Anstieg bei nahezu unverändertem RSS. PSS hängt von der Verteilung gemeinsam genutzter Seiten ab; die Messung belegt deshalb keine bestimmte Ursache oder ein Speicherleck.

Die Kurzrunden und erzwungenen Sammlungen sind Diagnosebedingungen, keine Abnahme über vollständige Flutverläufe. Der [separate Drei-Runden-Lauf mit Maßnahmen](#drei-runden-mit-allen-werkzeugen) und echte Geräte bleiben für die Beurteilung relevant; langsame Speicherprobleme sind weiterhin nicht ausgeschlossen.

### Vollständiger Browserdurchgang mit direktem Gebäudezugriff

Der Produktionsbuild von Anwendungscode `a836551` wurde in einem isolierten Git-Archiv erstellt und mit Playwright in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik geprüft. Alle 91 Browserprüfungen bestanden mit einem Testworker in 7,0 Minuten. Dazu gehören Gebäudeauswahl, Abrissvorschau und -bestätigung, Werkzeugaktionen, Kartenbedienung und Neustart. Die isolierte Testkonfiguration verwendete einen eigenen lokalen Port; Anwendung und Tests selbst wurden dafür nicht geändert.

Dies sind automatisierte Desktopprüfungen einschließlich emulierter Touch-Eingaben. Sie ersetzen weder einen unabhängigen menschlichen Spieltest noch die Abnahme auf echten Mobilgeräten oder in Safari.

### Später Abriss mit direktem Gebäudezugriff

Auf dem isolierten Produktionsbuild von Anwendungscode `a836551` spielte `bun tools/observe-partial-production.mjs --demolition` in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik die vorbereitete Dammkombination und einen späteren Abriss. Bei 03:01 wurde pausiert und das Zielgebäude über einen vorgegebenen Bildschirmtreffer abgefragt: 1.462 Flutschaden bei 11.056 Gebäudewert und 1,00 m Wassertiefe am Rand. Die Abrissvorschau zeigte 11.056 Gesamtverlust und 1.106 Kosten; die Aktion wurde bestätigt und die Runde fortgesetzt.

Nach 155,35 s erreichte die 2×-Runde das Schadensziel mit 31.076 Flutschaden, 11.056 Abrissverlust, 42.132 Gesamtschaden und 7.734 Budgetrest. Seitenfehler wurden nicht protokolliert; nach Neustart zeigte die Anzeige wieder null Schaden. Der Abrissverlust ist im Gesamtschaden enthalten. Der automatisierte Lauf mit festem Klickpunkt belegt keine menschliche Auffindbarkeit oder echte Geräteabnahme.

### Firefox-Runde mit direktem Gebäudezugriff

Am 30. Oktober 2026 wurde ein isoliertes Git-Archiv von `e8d61be` mit `bun run build` gebaut und statisch lokal ausgeliefert. Das Archiv verwendete eine separate Installation mit derselben Lockdatei. `WATERFIGHTER_FIREFOX_FULL=1 bun tools/observe-firefox.mjs` prüfte Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik. Für lokale Testschriften war die Firefox-Content-Sandbox deaktiviert; eine temporäre X-Server-Kopie verwendete den bereitgestellten Tastaturcompiler außerhalb des Standardpfads.

Start, Pause und Neustart sowie Vorschau und Bestätigung von Graben, Damm und Abriss funktionierten; zwischen den Werkzeugen wurde zurückgesetzt. Die anschließende unbehandelte 2×-Runde endete nach 150,917 s bei 05:00 mit sichtbarem Ergebnis, 138.836 Flutschaden, keinem Abrissverlust und 10.000 Budgetrest; das Ziel wurde verfehlt. Der Test verwendet feste Mauskoordinaten. Er ersetzt keine menschliche Bedienung oder Prüfung auf echten Geräten; der [frühere WebDriver-Abbruch](#firefox-wiederholung-nach-zoomänderung-abgebrochen) bleibt ungeklärt.

### Drei Runden mit direktem Gebäudezugriff

Auf dem isolierten Produktionsbuild von `a836551` absolvierte `bun tools/observe-three-rounds.mjs --actions` in Chrome 156.0.8078.73 unter Linux mit Softwaregrafik erneut drei vollständige 2×-Runden. In jeder Runde wurden Graben, Damm und Abriss bestätigt sowie Pause, Zoom, Fortsetzen und Neustart geprüft. Alle drei Runden ergaben 138.830 Flutschaden, 78.239 Abrissverlust und 526 Budgetrest; Seitenfehler wurden nicht protokolliert. Die absichtlich für den Stabilitätstest gewählten Maßnahmen verfehlten das Schadensziel. Die Runden dauerten 164,152, 159,969 und 159,686 Sekunden.

Die Summen der Prozess-RSS-Stichproben vor und nach den Runden betrugen 1,313/1,308, 1,316/1,354 und 1,362/1,368 GB. Gemeinsam genutzte Speicherseiten können mehrfach gezählt werden; die Stichproben beweisen weder das Vorliegen noch das Fehlen eines Speicherlecks. Die automatisierte Bedienung mit festen Koordinaten ersetzt keine Prüfung durch Menschen oder auf echten Geräten.

### Private Renderer-Seiten nach Neustarts

Die Kurzrunden-Diagnose wurde am 30. Oktober 2026 auf isoliertem Produktionsbuild `e8d61be` mit derselben Szenarioversion `1.4-draft`, Chrome 156.0.8078.73 unter Linux und Softwaregrafik wiederholt: zwölf auf zwei Sekunden verkürzte Runden ohne Maßnahmen, nach jedem Neustart erzwungene Seitensammlung und im zweiten Lauf zusätzlich erzwungene Worker-Sammlung. `tools/process-memory.mjs` erfasst dafür ergänzend die Summe von `Private_Clean` und `Private_Dirty` aus Linux-`smaps_rollup` je Prozessgruppe. Für die drei Rendererprozesse waren bei allen Stichproben diese Werte verfügbar; beide Läufe meldeten keine Seitenfehler.

Ohne erzwungene Worker-Sammlung stiegen die privaten residenten Renderer-Seiten von 116,07 MiB nach Runde 1 auf 150,33 MiB nach Runde 12; mit Worker-Sammlung lagen sie bei 109,49 beziehungsweise 99,77 MiB. Der Seiten-Heap nach Sammlung stieg in den beiden Läufen von 11,77 auf 12,33 MiB beziehungsweise von 11,79 auf 12,36 MiB. Die Renderer-PSS-Summe stieg ohne Worker-Sammlung von 204,94 auf 242,99 MiB; mit Worker-Sammlung sank sie von 198,85 auf 192,49 MiB.

Die Gegenüberstellung ist mit erst später eingesammelten Worker-Daten vereinbar. Es sind jedoch zwei getrennte Läufe unter künstlich erzwungener Sammlung; private Seiten umfassen auch andere Renderer-Daten, und GPU-Speicher wird nicht vollständig erfasst. Sie beweisen weder eine eindeutige Ursache noch das Fehlen eines Lecks über längere Flutverläufe oder auf echten Geräten. Die [drei vollständigen Runden mit Maßnahmen](#drei-runden-mit-direktem-gebäudezugriff) bleiben ein separater Stabilitätsbeleg.

### Lebensdauer alter Workerzustände

Am 30. Oktober 2026 prüfte `bun tools/inspect-worker-lifetime.mjs` den Anwendungscode von `e8d61be` mit Szenario `1.4-draft` in Chrome 156.0.8078.73 unter Linux. Eine instrumentierte Vite-Entwicklungsansicht ersetzte die Rundendauer testseitig durch zwei Sekunden und ergänzte im Worker einen Diagnosezugang zum bestehenden Controller. Der Test führte zwölf 2×-Runden ohne Maßnahmen mit Neustart durch und speicherte vor jedem Neustart ausschließlich schwache Referenzen auf das jeweilige `Game` und den Solver. Nach dem Neustart erzwang er mit `--js-flags=--expose-gc` zweimal die Worker-Garbage-Collection, jeweils getrennt durch einen Taskwechsel.

Nach jedem der zwölf Neustarts meldeten die schwachen Referenzen keine noch erreichbaren früheren Spiel- oder Solverobjekte; Seitenfehler wurden nicht protokolliert. Dies zeigt, dass die konkret beobachteten Objekte unter diesen Diagnosebedingungen eingesammelt wurden. Es schließt andere gehaltene Objekte, native beziehungsweise GPU-Speicher, verzögerte Sammlung ohne Zwang, längere Flutphasen und Probleme auf echten Geräten nicht aus. Die [Messung privater Renderer-Seiten](#private-renderer-seiten-nach-neustarts) bleibt ein getrennter Befund; die Ursache ihrer Zunahme ist damit nicht vollständig geklärt.

### Bestätigung und anschließender Bedienhinweis

Am 30. Oktober 2026 wurde die Rückmeldung nach einer bestätigten Maßnahme so angepasst, dass sie nach vier Sekunden wieder zum passenden Werkzeughinweis wechselt. Eine neue Auswahl, ein Moduswechsel oder ein anderer Hinweis beendet den Timer, damit eine neuere Rückmeldung nicht überschrieben wird. Produktionsbuild, 72 Vitest-Tests und zwei Python-Tests bestanden. In Chrome 156.0.8078.73 unter Linux mit Softwaregrafik bestanden elf gezielte Browserfälle für Werkzeughinweise, Vorschauwechsel und ausstehende Aktionen. Nach Ergänzung eines separaten Falls für eine unmittelbar begonnene neue Auswahl bestanden die fünf Hinweisfälle erneut. Die kleinformatigen Touchfälle sind emuliert; eine vollständige Suite und echte Geräte bleiben gesondert zu prüfen.

### Gesamtsuite nach der Bestätigungsrückmeldung

Am 30. Oktober 2026 bestanden auf einem isolierten Git-Archiv von `2c5506c` der Produktionsbuild mit Typprüfung und alle 93 Playwright-Chromium-Fälle. Die Suite lief mit einem Worker und `--timeout=90000` in 7,2 Minuten auf Google Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. Der isolierte Testserver verwendete Port 4396; die verwendete separate Abhängigkeitsinstallation entsprach der Lockdatei. Der Build meldete die bestehende Größenwarnung für einen JavaScript-Chunk.

Der Durchgang umfasst die beiden neuen Rückmeldungsfälle, Werkzeugaktionen, Kartenbedienung, emulierten Touch und Neustarts. Echte Geräte, tatsächliches Safari und menschliche Bedienung sind damit nicht abgenommen; die Laufzeit ist keine Geräteleistungsmessung.

### Produktionsrunde nach der Bestätigungsrückmeldung

Am 30. Oktober 2026 spielte `bun tools/observe-land-production.mjs --after-flood` auf dem isolierten Produktionsbuild `2c5506c` mit Szenario `1.4-draft` in Chrome 156.0.8078.73 unter Linux und Softwaregrafik. Drei Dämme wurden in der Vorbereitung bestätigt; bei 02:31 wurde pausiert und der nördliche Landgraben bestätigt. Die Worker-Vorschau wurde testseitig mitgelesen; die Auswahl nutzte feste Bildschirmkoordinaten und eine kleine Endpunktkorrektur. Die Uhr blieb während der Pause stehen.

Nach 156,682 s einschließlich Bedienung erreichte die 2×-Runde mit 1.405 Flutschaden, keinem Abrissverlust und 7.510 Budgetrest das Ziel. Seitenfehler wurden nicht protokolliert; der Neustart setzte Zeit, Budget und Schaden zurück. Der automatisierte Lauf belegt keine menschliche Platzierung oder echte Geräteabnahme.

### Firefox-Prüfung der Bestätigungsrückmeldung

Am 30. Oktober 2026 prüfte `WATERFIGHTER_FIREFOX_FULL=1 WATERFIGHTER_FIREFOX_HINT=1 bun tools/observe-firefox.mjs` den isolierten Produktionsbuild `2c5506c` in Firefox 159.0 über geckodriver 0.37.1 auf einem virtuellen Linux-X-Desktop mit Mesa-Softwaregrafik. Die Content-Sandbox war für lokale Testschriften deaktiviert. Das ergänzte Testskript wurde in das isolierte Archiv kopiert; es verwendete feste Mauskoordinaten.

Bei verborgenem Menü zeigte der erste bestätigte Graben zunächst die Kosten und nach 4,5 s wieder den Hinweis zur Start- und Endpunktwahl. Nach einer weiteren Bestätigung wurde unmittelbar ein neuer Startpunkt gewählt; auch nach 4,5 s blieb der Hinweis zur Endpunktwahl erhalten. Dazwischen setzte der Test die Runde zurück. Zusätzlich funktionierten Start, Pause, Neustart sowie Vorschau und Bestätigung aller drei Werkzeuge. Die anschließende unbehandelte 2×-Runde endete nach 150,977 s bei 05:00 mit sichtbarem Ergebnis, 138.836 Flutschaden und 10.000 Budgetrest; das Ziel wurde verfehlt.

Die Prüfung ist automatisiert und ersetzt weder menschliche Bedienung noch echte Geräte oder tatsächliches Safari. Der frühere [WebDriver-Abbruch](#firefox-wiederholung-nach-zoomänderung-abgebrochen) bleibt ungeklärt.

### Rückstandsmeldung und vollständige Chromium-Suite

Am 30. Oktober 2026 bestanden auf dem Anwendungscode `80cc37a` der Produktionsbuild mit Typprüfung, 72 Vitest-Tests, zwei Python-Tests für Bruchkanten und alle 95 Playwright-Browserfälle. Die Browser-Suite lief mit zwei Workern in sechs Minuten im Playwright-Chromium 156.0.8078.4 unter Linux mit Softwaregrafik. Für die Browserbibliotheken und Schriften wurden die lokalen Verzeichnisse `/tmp/waterfighter-libs` und `/tmp/waterfighter-fonts` verwendet. Der Produktionsbuild meldete weiterhin eine Größenwarnung für einen JavaScript-Chunk.

Zwei neue Fälle verändern testseitig den gemeldeten Rückstand in echten Worker-Snapshots: Sie prüfen das Verschwinden der Rückstandsmeldung beim Aufholen und Pausieren sowie den Vorrang einer neuen Punktauswahl während und nach dem Aufholen. Die übrige Suite umfasst unter anderem Vorschauen, Werkzeugaktionen, emulierten Touch und Neustarts. Der künstlich gesetzte Rückstand ist kein Leistungstest; menschliche Bedienung, Safari und echte Mobilgeräte bleiben ungeprüft.
