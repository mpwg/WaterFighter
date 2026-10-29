# WaterFighter – Status und Kriterienmatrix

Stand: 29. Oktober 2026.

## Aktueller Stand

**Nur Dokumentation erstellt. Die Spielimplementierung wurde auf ausdrücklichen Wunsch des Nutzers nicht begonnen.** Die Umsetzung ist für einen später beauftragten Agenten vorgesehen.

Vorhanden sind Spielplan, detaillierter Umsetzungsplan, dieser Status, ein kopierfertiger Goal-Auftrag und der archivierte frühere Enginevergleich. Die README verweist auf diese Dokumente und kennzeichnet den Planungsstand.

Es wurden keine Spielabhängigkeiten installiert, keine Anwendung erzeugt, keine Geodaten heruntergeladen, keine Simulation implementiert und keine Geräte- oder Browserabnahme durchgeführt. Ein Goal wurde nicht angelegt. Es erfolgte keine Veröffentlichung.

## Arbeitspakete

| Paket | Status | Tatsächlicher Nachweis | Nächster Schritt |
| --- | --- | --- | --- |
| AP 1 – Projektgrundlage | offen | Planungsdokumente vorhanden; kein Laufzeitprojekt | Repository-Regeln prüfen, TypeScript/Vite/Babylon.js/Worker und Tests einrichten |
| AP 2 – Wiener Geodaten | offen | Quellenbasis dokumentiert; kein Datensatz beschafft oder verarbeitet | Ausschnitt auswählen, Datenbezug und Lizenzpflichten prüfen |
| AP 3 – Simulation | offen | Verfahren und Tests spezifiziert; kein Solver | Synthetische Felder und konservativen Solver implementieren |
| AP 4 – Darstellung | offen | Bedienung und Darstellung spezifiziert | Nach frühem Solver-Leistungstest die Spielansicht implementieren |
| AP 5 – Werkzeuge/Schäden | offen | Regeln spezifiziert | Aktionen, Budget, Vorschau, Wassererhaltung und Schäden implementieren |
| AP 6 – Spielrunde | offen | Ablauf und Referenznachweise spezifiziert | Vollständige Runde und erfolgreiche Referenzstrategie erstellen |
| AP 7 – Gesamtprüfung | offen | Abnahmeverfahren spezifiziert | Implementierung und reale Geräte testen |

AP 1 bleibt offen, obwohl seine Dokumentationsvorarbeit bereits erledigt ist. Es wird nicht allein wegen dieser Dateien als implementiert oder geprüft markiert.

## Kriterienmatrix

| Kriterium | Status | Beleg beziehungsweise fehlender Nachweis |
| --- | --- | --- |
| Spielkonzept dokumentiert | erfüllt | `spielplan.md` |
| AP 1–7 mit Schnittstellen und Abnahme dokumentiert | erfüllt | `umsetzungsplan.md` |
| Goal-Übergabe dokumentiert | erfüllt | `goal-auftrag.md` |
| Historische Untersuchung erhalten; README aktualisiert | erfüllt | `archiv/enginevergleich-3d.md`, `../README.md` |
| Build, Typprüfung, Entwicklungsserver und Worker-Start | offen | Keine Implementierung |
| Reproduzierbares reales Wiener Szenario | offen | Kein konkreter Ausschnitt und keine Rohdatenprüfung |
| Ausrichtung, Höhenbezug, Datenlücken und Quellen geprüft | offen | Keine Geodatenpipeline |
| Stabiler Solver und Bilanzfehler unter 0,1 % | offen | Keine Simulation und keine numerischen Tests |
| Plausible Flutwelle, Barrieren und Überströmung | offen | Keine Simulation |
| 2,5D-Ansicht, Touch-Modi und Fehlerbehandlung | offen | Keine Oberfläche |
| Atomare Aktionen, Budget, Wassererhaltung und Schadenswertung | offen | Keine Regeln oder Tests |
| Vollständige Runde und bezahlbare erfolgreiche Strategie | offen | Kein spielbares Szenario |
| Neustart und Schutz vor alten/doppelten Nachrichten | offen | Keine Worker-Integration |
| Tatsächliche Desktop-Abnahme Safari/Chrome/Firefox | offen | Keine Browserläufe |
| Echte iPhone-/Android-Abnahme | offen | Gerätezugriff noch nicht untersucht; keine Geräteprüfungen |
| Mobile Framezeiten, Simulationsrate und Aktionslatenz | offen | Keine Messungen |
| Drei stabile aufeinanderfolgende Runden | offen | Keine Laufzeitprüfung |
| Statischer Produktionsbuild und vollständige Quellenhinweise | offen | Kein Build |

„Offen“ bedeutet hier, dass die Arbeit noch auszuführen ist. „Nicht prüfbar“ darf erst eingetragen werden, wenn ein konkretes Hindernis ermittelt und beschrieben wurde. Untersuchte, aber nicht erreichbare reale Geräte wären ein solcher Fall; ihr Fehlen wird aktuell nicht behauptet.

## Protokoll der Dokumentationsprüfung

- Interne relative Markdown-Dateiverweise geprüft.
- Git-Diff auf Leerraumfehler geprüft.
- Historischen Inhalt unterhalb des neuen Archivhinweises mit der ursprünglichen README verglichen.
- Änderungen auf README und Markdown-Dokumentation begrenzt.

Diese Prüfungen belegen ausschließlich die Dokumentation, keine Spiel- oder Plattformfunktion.

## Fortführung durch den implementierenden Agenten

1. `goal-auftrag.md` als Arbeitsauftrag verwenden und die referenzierten Pläne lesen.
2. Mit AP 1 beginnen; vorhandene Dokumente nicht als neue Aufgabe duplizieren.
3. Nach jedem Paket den tatsächlichen Fortschritt und Nachweise hier ergänzen.
4. Umfangreiche Test- und Gerätebelege bei Bedarf in einem separaten Abnahmebericht ablegen und von hier verlinken.
5. Abschluss nur kriteriumsgerecht melden; offene Geräteprüfungen separat ausweisen.
