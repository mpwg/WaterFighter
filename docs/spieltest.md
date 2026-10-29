# Spieltest ohne Testkoordinaten

Dieser Ablauf bereitet die noch offene menschliche Spielprüfung vor. Er ist kein Testprotokoll und behauptet nicht, dass eine Person bereits gespielt hat. Die beobachtende Person öffnet das Spiel; die spielende Person erhält weder Rasterkoordinaten noch die Referenzstrategien oder diesen Beobachtungsbogen.

## Vorbereitung

Im Repository `bun install --frozen-lockfile` und `bun run dev` ausführen und die vom Server ausgegebene lokale Adresse im Browser öffnen. Auf einem anderen Gerät ist eine erreichbare lokale Bereitstellung erforderlich; der Entwicklungsserver bindet standardmäßig nur an `127.0.0.1`. Die spielende Person soll mit der regulären Oberfläche und der eingebauten Hilfe beginnen. Gerät, Betriebssystem, Browser, Eingabemethode, Ausrichtung, Szenarioversion und Commit notieren. Keine Entwicklerwerkzeuge, Testprojektionen oder vorbereiteten Klickpunkte verwenden.

### Produktionsbuild für ein Gerät im selben Netzwerk

Auf dem Rechner mit dem Repository zuerst `bun install --frozen-lockfile` und `bun run build` ausführen. Die private IPv4-Adresse der Netzwerkschnittstelle ermitteln, die das Testgerät erreicht, und sie im folgenden Beispiel anstelle von `192.168.1.20` einsetzen:

```sh
bun --bun vite preview --host 192.168.1.20 --port 4173 --strictPort
```

Die vom Server ausgegebene `http://…:4173/`-Adresse auf dem Testgerät öffnen. Beide Geräte müssen sich erreichen können; Gastnetz-Isolation oder eine lokale Firewall können die Verbindung verhindern. Den Server nach dem Test mit Strg+C beenden. Die Bindung an die ausgewählte private Adresse ist eine lokale Testbereitstellung, keine öffentliche Veröffentlichung. Im Beobachtungsbogen den tatsächlich getesteten Build, das Gerät und den Browser festhalten; das bloße Starten des Servers ist kein Geräte- oder Spieltest.

Auf dem hier verwendeten Linux-Rechner wurde ein isolierter Produktionsbuild kurz an dessen private Adresse gebunden. HTML und das komprimierte Szenario ließen sich über diese Adresse **vom selben Rechner** mit HTTP 200 abrufen; Chromium lud das Szenario und meldete den Worker als bereit. Ein Zugriff von einem zweiten Gerät wurde dabei nicht geprüft.

## Zwei Versuche

1. Die Person spielt eine vollständige erste Runde selbstständig. Die beobachtende Person greift nur bei technischen Problemen ein und notiert gegebenenfalls die Hilfe; sie gibt keine Platzierungstipps.
2. Vor dem Neustart beschreibt die spielende Person in eigenen Worten, woher die Bedrohung kam, was ihre Maßnahmen bewirkt haben und was das Ergebnis bedeutet.
3. Nach dem Neustart spielt sie einen vollständigen zweiten Versuch. Vor oder während des Versuchs beschreibt sie, was sie aufgrund der ersten Runde ändern möchte und warum.
4. Anschließend beschreibt sie, ob die Änderung das Ergebnis verbessert hat und woran sie das erkennt. Unklare Informationen, Fehlbedienungen und unterbrochene Läufe festhalten.

## Beobachtungsbogen

- Datum, Szenarioversion, Commit, Gerät, Betriebssystem, Browser, Maus oder Touch und Ausrichtung:
- Versuch 1: Startbedingungen, gewählte Maßnahmen, Eingriffe vor und nach Flutbeginn, Ergebnis, Budgetrest und selbst erklärte Wirkung:
- Versuch 2: bewusst geänderte Entscheidung und Begründung, Maßnahmen und Zeitpunkte, Ergebnis und Budgetrest:
- Beobachtete Schwierigkeiten: Erkennen von Zufluss und möglichen Abflusswegen; Gebäudezustände und Schaden; Vorschau, Hindernisgründe und Bestätigung; Pause, Neustart und Bedienung der Karte:
- Erbetene Hilfe, technische Fehler und offene Fragen der spielenden Person:

Eine erfolgreiche numerische Strategie oder eine automatisierte Runde ersetzt diese Beobachtung nicht. Auch ein misslungener Versuch ist ein verwertbares Ergebnis: Aussagen und Schwierigkeiten möglichst wörtlich beziehungsweise nachvollziehbar festhalten, ohne nachträglich eine Erklärung zu unterstellen. Nur tatsächlich ausgeführte Schritte und Geräte dokumentieren.
