# WaterFighter: Die Donau kommt

Ein dreiminütiges Desktop-Browserspiel über Hochwasser an der Donau zwischen Tulln und Wien. Lenke Wasser in Rückhalteräume, schütze Dämme und evakuiere gefährdete Gemeinden. Die Ortsnamen sind real; Flussgeometrie und Hochwasserwirkung sind ein vereinfachtes Spielszenario.

## Starten und prüfen

Voraussetzung: Bun 1.4.4. Die Abhängigkeiten stehen in `bun.lock`.

```sh
bun install --frozen-lockfile
bun run dev
bun run build
bun run test
bun run test:browser
bun --bun tools/compare-rounds.ts
```

`bun run dev` zeigt die lokale Adresse an. `bun run preview` öffnet den Produktionsbuild. Die Browserprüfung baut neu und startet Vite Preview exklusiv auf Port 4187. Sie benötigt Playwright Chromium; bei Bedarf `bunx playwright install chromium`. `WATERFIGHTER_CHROME` kann auf eine kompatible lokale Chromium-Datei zeigen.

## Spielen

1. Wähle vor dem Einsatz genau drei Maßnahmen. Unter **Dämme**, **Rückhalt** und **Rettung** kannst du Ziele frei kombinieren und eine Wahl per erneutem Klick zurücknehmen.
2. Starte die HQ100-Flut. Die ganze Karte bleibt sichtbar. Wähle Ziele auf der Karte oder über die Listen rechts. Wehre haben die Stellungen zu, halb und offen; ihre Umstellung dauert 1,2 Sekunden.
3. Zwei Notdämme können gebaut werden, solange der Pegel es zulässt. Der Bau dauert drei Sekunden. Eine Dammöffnung ist dauerhaft und wird erst nach 0,9 Sekunden Gedrückthalten ausgelöst. Die Vorschau nennt die betroffene Gemeinde.
4. Weise bis zu zwei Rettungsteams Gemeinden zu, verteile sie um oder ziehe sie per erneutem Klick ab. Beobachte Pegel, Zulaufprognose, Meldungen, sichere Menschen und Sachschäden.
5. **Pause** friert die Simulation ein und sperrt Eingriffe. **Weiter** setzt sie fort. **Neustart** beginnt dieselbe Flut erneut. Am Ende zeigt die Bilanz sichere, gerettete und noch in Not befindliche Menschen sowie Sachschäden getrennt.

Die Steuerung ist für Desktop und Maus ausgelegt. Dammöffnungen funktionieren auch mit Leertaste oder Eingabetaste auf dem fokussierten Button.

## Aufbau und Abnahme

`src/core/` enthält den deterministischen Wasserkern mit festen 1/30-Sekunden-Schritten. `src/render/` zeichnet die Canvas-Karte. `src/main.ts` verbindet Eingabe, Status, Karte und Spielschleife. `?test=1` aktiviert nur für lokale Browserprüfungen die Test-API `window.__waterfighter`; ohne Query ist sie nicht vorhanden.

[Vergleichsrunden](docs/vergleichsrunden.md) messen reproduzierbare HQ100-Strategien unter gleichen Vorbereitungen. [Status und Kriterienmatrix](docs/status.md) führen tatsächliche Nachweise und offene Punkte. [Spieltest-Leitfaden](docs/spieltest.md) beschreibt die ausstehende menschliche Abnahme.

Der frühere V2-Stand liegt als Git-Referenz `prototype/v2-preserved-2026-10-30` (`106c26a28f869b1a84330bdd0e24ed3625eabe09`). Die aktuelle Entwicklung liegt auf `codex/donau-v3`.

Automatisiert geprüft wurden der Kern und Desktop-Chromium. Der 15-Sekunden-RAF-Lauf belegt einen kurzen Echtzeitausschnitt; die vollständige Browserrunde nutzt Zeitbeschleunigung. Ein echter Hintergrund-Tabwechsel wurde in der Testumgebung nicht ausgelöst. Menschliche Verständlichkeit und Spielspaß, Safari, Touch und mobile Geräte sind nicht abgenommen. HQ10, HQ50, HQ500 und HQ1000 sind bis nach drei menschlichen HQ100-Runden zurückgestellt. Kein Release oder Push ist Teil dieser Arbeit.
