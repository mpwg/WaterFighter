# Deterministische Vergleichsrunden

Stand: 30. Oktober 2026. Ausgeführt auf dem Arcade-Core dieser Branch.

## Reproduktion und Regeln

```sh
bun --bun run tools/compare-rounds.ts
```

Jeder Durchlauf startet mit demselben Spielzustand und 100 Energie. Die Simulationszeit wird in festen Schritten von 1/30 Sekunde fortgeführt, höchstens bis `MAX_TIME = 180`. Ein Lauf endet früher, wenn der Core Sieg oder Niederlage feststellt. Es gibt keine Zufallswerte.

Der Kaufschritt läuft zu jeder vollen simulierten Sekunde vor dem nächsten Zeitschritt. Bauplätze werden in der Reihenfolge `SLOTS` geprüft; der Slotindex wählt zyklisch die Gerätereihenfolge des Plans. Sobald ein Kauf finanzierbar ist, wird gebaut. Es gibt keine Ausbauten. Rettungsläufe verwenden denselben Bauplan wie „Pumpe/Freeze/Cannon“ und lösen zusätzlich das Boot für das erste bedrohte, noch stehende und noch nicht evakuierte Haus aus, sobald die globale Boot-Abklingzeit abgelaufen ist.

## Ergebnisse

| Strategie | Simulierte Zeit (s) | Restenergie | Ausgaben | Geräte | Sicher (von 24) | Punkte | Wellen | Ende |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Nichtstun | 77,97 | 250,0 | 0 | 0 | 0 | 0 | 2/5 | lost |
| Pumpe only | 146,67 | 233,3 | 300 | 6 | 0 | 177 | 4/5 | lost |
| Freeze only | 107,70 | 85,4 | 300 | 6 | 0 | 0 | 2/5 | lost |
| Cannon only | 105,87 | 81,7 | 300 | 6 | 0 | 0 | 2/5 | lost |
| Pumpe/Freeze/Pumpe | 152,23 | 250,0 | 300 | 6 | 16 | 630 | 5/5 | won |
| Pumpe/Freeze/Cannon | 154,20 | 250,0 | 300 | 6 | 16 | 638 | 5/5 | won |
| Pumpe/Freeze/Cannon + Rettung nach Durchbruch | 154,20 | 250,0 | 300 | 6 | 20 | 638 | 5/5 | won |

Restenergie ist der Energiebestand beim Rundenende; Ausgaben summieren die Baukosten. „Sicher“ umfasst Bewohner in stehenden Häusern sowie erfolgreich evakuierte Bewohner. Die Tabelle bestätigt in diesem Modell, dass die beiden Mischpläne die fünf Wellen abschließen und mindestens 12 von 24 Bewohnern sichern; die Boot-Aktion sichert in diesem Lauf weitere vier Bewohner.

## Grenzen

Der Läufer vergleicht eine feste, einfache Kaufregel und genau eine Rettungsregel. Er optimiert weder Platzierung noch Ausbau, Schutzzeitpunkt oder Rettungsziel. Diese Zahlen prüfen die deterministische Ressourcen- und Rundenlogik; sie belegen keinen menschlichen Spielspaß und ersetzen keinen manuellen Spieltest.
