# Modellinterner Strategievergleich

`bun tools/compare-strategies.ts` führt drei vollständige 360-Sekunden-Runden auf derselben deterministischen 256×192-Karte aus. Zeit, Anfangszustand und Zufluss bleiben identisch. Keine Runde rettet Häuser: Die Messung isoliert ausschließlich Wasser und Sachschaden.

- **no-action:** keinerlei Eingriff.
- **barrier:** 18 Abschnitte entlang `(170,72) → (188,72)`, unterhalb des Schützkanals. Der Befehl muss vom echten Kern angenommen werden.
- **gate:** Schütz 0 ab Beginn geschlossen.

[JSON-Rohdaten](strategy-evidence.json) enthalten bei 180 und 360 Sekunden Wasserstandfläche (>2 cm), Gesamtvolumen, mittleren Schaden, beschädigte Häuser, höchsten Hauspegel und Bilanzfehler. Ein Eingriff kann lokal helfen und Wasser anderswo verlagern. Die Ergebnisse gelten nur für dieses stilisierte Modell und belegen weder reale Schutzwirkung noch eine Hochwasserprognose.

Die früheren HQ100-Varianten gehörten zum entfernten V3-Kern und sind keine Vergleichsdaten des aktuellen Spiels.

Gemessener Stand (30. Oktober 2026):

| Strategie | Material übrig | Nasse Zellen bei 360 s | Mittlerer Schaden bei 360 s | Beschädigte Häuser |
| --- | ---: | ---: | ---: | ---: |
| Keine Aktion | 900 | 24198 | 0.0975162 | 7 |
| 18 Sandsackabschnitte | 864 | 23999 | 0.0914444 | 7 |
| Schütz geschlossen | 900 | 23586 | 0.0862523 | 7 |

Beide Maßnahmen reduzieren modellintern die nasse Fläche und den mittleren Schaden; sie vermeiden in diesem Szenario keine zusätzlichen beschädigten Häuser. Der höchste Hauspegel bleibt praktisch unverändert bei 0.6689 m. Der größte erfasste absolute Bilanzfehler liegt bei rund 1.28e-7 m³. Diese begrenzten Unterschiede sind keine Garantie für eine erfolgreiche Gesamtstrategie.
