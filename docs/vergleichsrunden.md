# Modellinterner Strategievergleich

Aktualisiert am 31. Oktober 2026 für die organische 256×192-Karte mit 34 Häusern und 135 Personen. `bun tools/compare-strategies.ts` führt drei vollständige 360-Sekunden-Runden mit identischem Anfangszustand und Zufluss aus, jeweils in 10800 Aufrufen zu 1/30s. Keine Runde rettet Menschen: Die Messung isoliert Wasser und Sachschaden.

- **no-action:** keinerlei Eingriff.
- **barrier:** elf vom echten Kern akzeptierte Abschnitte entlang `(174,61) → (185,61)`, unterhalb des Schützkanals.
- **gate:** Schütz 0 ab Beginn geschlossen. Die genaue Öffnung liegt an Vertex-y57, von x176 bis x183.

[JSON-Rohdaten](strategy-evidence.json) enthalten bei 180 und 360 Sekunden die nasse Fläche (>2cm), Gesamtvolumen, mittleren Schaden, beschädigte Häuser, höchsten Hauspegel und Bilanzfehler.

| Strategie | Material übrig | Nasse Zellen bei 360s | Mittlerer Schaden bei 360s | Beschädigte Häuser |
| --- | ---: | ---: | ---: | ---: |
| Keine Aktion | 900 | 10879 | 0.0526697 | 4 |
| Elf Sandsackabschnitte | 878 | 10551 | 0.0485182 | 3 |
| Schütz geschlossen | 900 | 10467 | 0.0430877 | 2 |

Beide Maßnahmen reduzieren in diesem Szenario nasse Fläche, mittleren Schaden und die Zahl beschädigter Häuser. Der höchste Hauspegel bleibt bei rund 1.79235m, da andere Häuser weiterhin exponiert sind. Der größte absolute Bilanzfehler über alle erfassten Zwischen- und Endwerte beträgt rund 3.84e-8m³.

Ein Eingriff kann lokal helfen und Wasser anderswo verlagern. Die Zahlen gelten ausschließlich für dieses stilisierte Modell; sie belegen weder reale Schutzwirkung noch eine Hochwasserprognose. Der feste 1/30-Aufrufplan hier kann geringfügig andere Werte als ein einzelner `stepGame(...,360)`-Kalibrierungsaufruf liefern. Historische Zahlen zur früheren Rasterkarte vom 30. Oktober und ältere HQ100/V3-Varianten gelten nicht für die aktuelle Geometrie.
