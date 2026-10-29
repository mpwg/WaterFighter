# Landgraben während einer laufenden Flut

**Versionsbezug:** Der erste Lauf unten verwendete die frühere rechtwinklige Dammführung. Der ergänzende Lauf mit direkter Dammführung ist separat am Ende dokumentiert.

Am 29. Oktober 2026 wurde `bun tools/observe-live-land-flow.mjs` mit Szenario `1.4-draft`, dem Vite-Entwicklungsserver und Chrome 156.0.8078.73 unter Linux mit Softwaregrafik ausgeführt. Der Test bestätigte vor Flutbeginn drei Dammabschnitte und den Graben von (0,4) bis (25,4) über die Spieloberfläche; der Budgetrest betrug 7.510. Die Klickpunkte wurden aus der Kamera und Szenengeometrie berechnet. Danach richtete der Test die Kamera programmatisch auf den Graben und blendete das Menü aus. Die Simulation und die Snapshots stammten während der gesamten Runde vom unveränderten Worker; es wurden keine gespeicherten Wasserzustände eingesetzt.

Bei angezeigten 02:01 waren 13 Grabenzellen für Strömungsmarker abgetastet, davon keine mit einer Geschwindigkeit von mindestens 0,01 m/s. Bei 03:01 und 04:01 erfüllten jeweils alle 13 diese Schwelle; die größten abgetasteten Geschwindigkeiten betrugen 5,55 beziehungsweise 1,48 m/s. Die [Ansicht bei 03:01](landgraben-live-180.png) und die [Ansicht bei 04:01](landgraben-live-240.png) zeigen Strömungsstriche und den veränderten Überflutungszustand. Die Markergeschwindigkeit ist eine Anzeigegröße aus dem Spielmodell; sie ist kein realer Messwert.

Die vollständige 2×-Runde dauerte 151,185 s und endete ohne protokollierte Seitenfehler mit 21.594 Flutschaden, 0 Abrissverlust und 7.510 Budgetrest bei einem Ziel von 50.000. Die verwendete Kamerafokussierung und die Klickpunkte sind Testhilfen. Die Bilder belegen eine live aktualisierte Darstellung zu zwei Zeitpunkten, keine ununterbrochene visuelle Verfolgung einzelner Wasserteilchen oder eine sichere reale Ableitung. Menschliches Auffinden des Grabens, ein Produktionslauf dieser konkreten Strategie und echte Geräte bleiben ungeprüft.


## Live-Runde mit direkter Dammführung

Am 29. Oktober 2026 wurde `bun tools/observe-live-land-flow.mjs` erneut mit dem Anwendungscode `9ac0d10`, Szenario `1.4-draft`, dem instrumentierten Vite-Entwicklungsserver und Chrome 156.0.8078.73 unter Linux mit Softwaregrafik ausgeführt. Die ersten drei Referenzdämme und der Landgraben (0,4) bis (25,4) wurden vor Flutbeginn über die Oberfläche bestätigt; das Budget betrug 7.510. Die Klickpositionen wurden aus Kameraprojektion und Szenengeometrie berechnet. Das Skript richtete die Kamera anschließend testseitig auf den Graben und blendete das Menü aus. Wasserzustand und Strömungsmarker kamen während der Runde vom echten Worker.

Bei 02:00 erreichte keiner der 13 abgetasteten Grabenmarker eine Geschwindigkeit von 0,01 m/s. Bei 03:01 und 04:00 überschritten jeweils alle 13 diese Schwelle; die höchsten abgetasteten Modellgeschwindigkeiten betrugen 4,83 beziehungsweise 1,30 m/s. Die [Ansicht bei 03:01](landgraben-direkt-180.png) und die [Ansicht bei 04:00](landgraben-direkt-240.png) zeigen die aktuelle Darstellung. Die Werte sind Momentaufnahmen und keine realen Messwerte; die Bilder verfolgen keine einzelnen Wasserteilchen.

Die vollständige 2×-Runde dauerte 151,613 s und endete ohne protokollierte Seitenfehler mit 863 Schaden, keinem Abrissverlust und 7.510 Budgetrest. Sie erreicht das Ziel von 50.000. Die Kamerafokussierung und Klickpunkte sind Testhilfen; menschliches Auffinden, Sichtbarkeit über die gesamte Runde und echte Geräte sind damit nicht geprüft. Der separate markierte Modellfluss ist im [Gebäudevergleich](review-gebaeudevergleich.md#markierter-landgraben-mit-direkten-dämmen) bilanziert; der offene Modellrand belegt keine sichere reale Ableitung.


## Live-Runde im emulierten Hochformat

Am 29. Oktober 2026 lief `bun tools/observe-mobile-land-flow.mjs` auf einem isolierten Archiv von Anwendungscode `4bdae2c` mit Szenario `1.4-draft`, instrumentiertem Vite-Entwicklungsserver und Chrome 156.0.8078.73 unter Linux mit Softwaregrafik. Die Ansicht war 390 × 844 CSS-Pixel groß, mit emuliertem Touch. Die Referenzmaßnahmen lagen zunächst außerhalb des sichtbaren Ausschnitts. Nach drei simulierten Touch-Ziehbewegungen im Dammwerkzeug setzte das Skript die projizierten Endpunkte per Touch; Vorschauknöpfe und Rundenschaltflächen wurden automatisiert angeklickt. Die drei Dämme kosteten 400, 800 und 640, der Graben 650; der Budgetrest betrug 7.510.

Der Kamerafokus auf den Graben wurde anschließend testseitig gesetzt und das Menü ausgeblendet. Bei 02:00 erreichte keiner der 13 abgetasteten Grabenmarker 0,01 m/s; bei 03:00 und 04:00 überschritten jeweils alle 13 diese Schwelle. Die größten abgetasteten Modellgeschwindigkeiten betrugen 4,87 beziehungsweise 1,33 m/s. Die [Ansicht bei 03:00](landgraben-mobil-emuliert-180.png) und die [Ansicht bei 04:00](landgraben-mobil-emuliert-240.png) zeigen die fokussierte Darstellung. Die Werte sind Momentaufnahmen, keine realen Messwerte oder Wasserteilchenverfolgung.

Die 2×-Runde dauerte 150,639 s und endete ohne protokollierte Seitenfehler mit 863 Schaden und 7.510 Budgetrest. Sie erreicht das Ziel von 50.000. Projektion und Kamerafokus sind Testhilfen; die Ausführung ersetzt weder einen menschlichen Spieltest noch einen Test auf einem echten Smartphone. Insbesondere belegt sie nicht, dass jemand die zunächst außerhalb des Ausschnitts liegende Stelle selbst findet.
