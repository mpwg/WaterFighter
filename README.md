# WaterFighter

Ein geplantes Hochwasserschutzspiel für den Browser: Schütze ein reales Wiener Stadtviertel an der Donau mit Dämmen, Gräben und gezieltem Gebäudeabriss.

**Stand: 29. Oktober 2026 — Konzept und Umsetzungsplanung. Es gibt noch keine Spielimplementierung.**

Der vereinbarte Prototyp verbindet echte OpenStreetMap-Geometrien und Wiener Geländehöhen mit einer stilisierten 2,5D-Darstellung. Eine Flachwassersimulation berechnet Flutwelle, Strömung und Rückstau. Spieler können unbegrenzt vorbereiten und während der pausierbaren Echtzeit weiter eingreifen. Budget und Schäden bestimmen das Ergebnis.

Zielplattformen sind Desktop-Browser sowie iPhone und Android. Die reale Geografie dient einem Spiel, keiner Hochwasserprognose.

## Dokumentation

- [Spielplan](docs/spielplan.md): verbindliche Produktentscheidungen, Spielregeln und Grenzen.
- [Detaillierter Umsetzungsplan](docs/umsetzungsplan.md): Architektur, Arbeitspakete AP 1–7, Schnittstellen und Abnahmekriterien.
- [Status und Kriterienmatrix](docs/status.md): tatsächlicher Fortschritt, fehlende Nachweise und nächster Schritt.
- [Kopierfertiger Goal-Auftrag](docs/goal-auftrag.md): Auftrag für den implementierenden Agenten.
- [Historischer 3D-Enginevergleich](docs/archiv/enginevergleich-3d.md): archivierter früherer Ansatz, keine aktuelle Architekturvorgabe.

## Geplanter technischer Aufbau

TypeScript, Vite und Babylon.js mit WebGL2; Flachwassersimulation in einem Web Worker; Python und GDAL für die vorgelagerte Geodatenaufbereitung. Die fertige Anwendung soll statisch und ohne Laufzeit-Backend auslieferbar sein.

Es sind noch keine Abhängigkeiten, Startbefehle oder Testläufe eingerichtet. Diese README wird während der Umsetzung um die tatsächlich funktionierende Einrichtung und Bedienung ergänzt. Eine öffentliche Veröffentlichung ist nicht beauftragt.
