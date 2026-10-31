# V4 · Stand und Abnahme

Stand: 31. Oktober 2026. Aktive Laufzeit: „Wien geht unter“, 90 Sekunden, Canvas2D und separater Worker. Die frühere sechsminütige Tulln-/WebGPU-Laufzeit ist entfernt. Frühere Tulln-/V3-Dokumente und Bilder bleiben ausschließlich historische Nachweise.

| Kriterium | Technischer Nachweis und Grenze |
| --- | --- |
| Daten | Amtliche Wiener Straßen, Gebäudeumrisse und unveränderte DGM-Abtastung auf 512×512m/2m-Raster; lokale Assets, Quellen-Hashes und Importer in [V4-Datengrundlage](v4-data.md). Gebäudewerte, Rollen, Dammbruch, Zufluss und Zeitmaßstab sind Spielfiktion. |
| Kern | 31 Tests: Fluss, Massenerhalt, Positivität, Öffnen/Überströmen, Kosten, Nachschub, Sperren, Reset, Worker/Koordinaten und ungültige Karten. Keine unabhängige hydraulische Validierung. |
| Produktionsbuild | TypeScript und Vite erfolgreich; ca.22.41kB UI-JavaScript,9.59kB Worker,8.53kB CSS, jeweils minifiziert; lokale Karte/Schriften zusätzlich. Keine Babylon-/WebGPU-Abhängigkeit. |
| Maus und Regeln | Produktionsbrowser prüft tatsächliche Mausplatzierung/-entfernung, separate Abrissauswahl/Bestätigung, exakten Punktverlust, wiederholten Abriss, Pause/gesperrte Aktionen und Nachschub, Reset mit offener Bestätigung und fertige Runde. Beschleunigte Tests nutzen ausschließlich `?test=1`. |
| Echte Zeit | Normale URL ohne Testbrücke: eine vollständige90s-Runde mit HUD-Ergebnis und ohne Seitenfehler. Exakte Wandzeit, Browserversion und Ergebnis in [Browsermessdaten](v4-browser-evidence.json). Headless Chromium auf Linux, keine Geräte-/Safari-Aussage. |
| Layout | Produktionsaufnahmen bei1440×960 und1280×800, jeweils [Start1440](v4-1440-initial.png)/[1280](v4-1280-initial.png), [Eingriff1440](v4-1440-action.png)/[1280](v4-1280-action.png), [65s1440](v4-1440-crest.png)/[1280](v4-1280-crest.png), [Ergebnis1440](v4-1440-result.png)/[1280](v4-1280-result.png). Diese Bilder verwenden beschleunigte Testzeit. Keine Seitenscrolls; Karte, Bestätigung und Quellenhinweis passen in beide Viewports. |
| Sichtbarkeit | Verzögertes Laden von Schriften und Worker-Karte sowie Pause/manuelles Fortsetzen werden mit kontrolliertem `document.hidden` und synthetischen Visibilityereignissen geprüft. Das ist kein Nachweis eines natürlichen Tabwechsels. |
| Strategien/CPU | [Vier vollständige90s-Modellläufe](v4-strategy-evidence.json): ohne Eingriff, schädliche Barriere, schützende Barriere sowie Barriere+Öffnung. Vergleich nur im identischen fiktiven Modell; gemessene Solverzeit ist CPU-Laufzeit dieses Hosts, keine Geräte- oder UI-Leistungszusage. |
| Offen | Menschliche Verständlichkeit und Spielspaß, natürliche Tabwechsel, Safari, echte Telefone/Touch und andere physische Geräte. Keine fachliche oder rechtliche Freigabe für Hochwasserschutzentscheidungen. |

Im gemessenen Modell bleiben ohne Eingriffe86.742,25 Punkte, mit der schädlichen Barriere86.385,75, mit schützender Barriere89.520,49 und mit gezielter Barriere plus Öffnung89.857,92. Der zusätzliche Abriss kostet430,57 Punkte und senkt den modellierten Flutschaden um mehr als diese Kosten. Die gezielte Auswahl ist ein Vergleichsfall, kein Beleg für menschlich leicht erkennbare Strategien. Volumenbilanz und vollständige Aktionen stehen in der JSON-Datei.

Die vollständige automatische Prüfung umfasst fünf Browserfälle einschließlich der Lade-/Visibilityregression und der echten90s-Runde. Die visuelle Prüfung der gespeicherten Bilder kann Lesbarkeit und abgeschnittene Elemente beurteilen; sie belegt keinen menschlichen Spielspaß.
