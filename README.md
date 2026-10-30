# WaterFighter: Flutwehr

Ein Browser-Arcade-Spiel über eine kleine Stadt und große Wasserzüge: Baue deine Flutwehr in einem Spielzeug-Wien, kombiniere drei Geräte und rette bedrohte Bewohner. Eine Runde hat fünf deterministische Wellen und dauert höchstens drei Minuten.

## Starten

Voraussetzung: Bun 1.4.4. Die Abhängigkeiten werden aus `bun.lock` installiert.

```sh
bun install --frozen-lockfile
bun run dev
```

Öffne die im Terminal angezeigte lokale Adresse (normalerweise `http://127.0.0.1:5173`). Für den Produktionsbuild:

```sh
bun run build
bun run preview
```

Es gibt keinen Serverdienst, keine Konten, keine Persistenz und keine externen Laufzeitassets.

## Spielen

1. Starte den Einsatz und klicke einen gelben Bauplatz an. Die Auswahl eines Geräts baut es sofort. Die Startenergie reicht für zwei Geräte.
2. **Wirbelpumpen** reduzieren die Flutstärke. **Gefriergeräte** bremsen. **Wasserwerfer** schieben die vorderste Welle zurück. Geräte wirken entlang ihrer zugeordneten Route; ausgewählte Bauplätze zeigen den wirksamen Streckenabschnitt. Jedes Gerät lässt sich genau einmal verbessern.
3. Kombiniere Geräte. Energie wächst um zwei Einheiten pro Sekunde, eine abgeschlossene Welle liefert weitere 35. Energie ist auf 250 begrenzt.
4. Wähle ein Haus und nutze **Luftkissen** für sechs Sekunden Schutz (20 Sekunden Abklingzeit) oder ein **Rettungsboot** für eine zweisekündige Evakuierung eines bedrohten Hauses (25 Sekunden Abklingzeit). Alternativ zuerst die Fähigkeit, danach das Haus auswählen.
5. Bei anhaltendem Kontakt nehmen Häuser alle zwei Sekunden Schaden. Nach drei Treffern ist ein Haus verloren. Evakuierte Bewohner bleiben sicher, auch wenn das Gebäude später zerstört wird.

Nach der Schlussflut beziehungsweise bei 180 Sekunden sind mindestens zwölf von 24 sicheren Bewohnern nötig. Bewohner gelten als sicher, wenn sie evakuiert wurden oder ihr Haus noch steht. Vollständiger Bewohnerverlust beendet die Runde vorzeitig. Erhaltene Häuser und früh abgewehrte Wasserzüge geben Punkte; Hausschaden gibt keine Punkte.

Die Leertaste oder „Pause“ unterbricht das Spiel; ein unsichtbarer Tab pausiert automatisch. Geräte und Rettungen sind während der Pause gesperrt. „Neustart“ setzt die Runde zurück. Ton und Kamerawackeln lassen sich getrennt abschalten. Desktop-Bedienung steht im Vordergrund; Touch und mobile Geräte sind nicht abgenommen.

## Prüfen

```sh
bun run test
bun run test:browser
bun tools/compare-rounds.ts
```

Die Browserprüfung baut zuerst die aktuelle Produktion und startet sie auf einem exklusiven Port 4187. Sie benötigt den Playwright-Chromium-Browser (`bunx playwright install chromium`). Ein bestehender Server wird nicht wiederverwendet. Für einen vorhandenen kompatiblen Chromium-Browser lässt sich `WATERFIGHTER_CHROME` auf dessen ausführbare Datei setzen.

`?test=1` aktiviert ausschließlich für lokale Browserprüfungen eine steuerbare Testoberfläche. Die automatisierte Zeitbeschleunigung prüft Regeln und UI, keine drei Minuten Echtzeitperformance oder menschlichen Spielspaß.

## Aufbau und Stand

- `src/core/`: Arena, feste Zeitschritte von 1/30 Sekunde, Regeln, Commands und Events; unabhängig von Darstellung und Eingabe.
- `src/render/`: Babylon-Arena, Wasserzüge, Geräte- und Rettungseffekte.
- `src/main.ts`: Eingabe, UI, Audio und Laufzeitschleife.
- `tests/`: Kern- und Browserprüfungen.
- [Freigegebener Auftrag](docs/arcade-auftrag.md), [Vergleichsrunden](docs/vergleichsrunden.md), [aktueller Status und Kriterienmatrix](docs/status.md).

Der frühere Geodaten-/Solver-Prototyp ist aus diesem Branch entfernt. Die unveränderte Git-Referenz `prototype/v1` (`baf0b198732377907eab29eb45869d6da7d5b1cd`) enthält seinen vollständigen historischen Stand; frühere Abnahmeaussagen gelten ausschließlich dort.

Menschliche Spielspaßabnahme, ein echter Browser-Tabwechsel und eine Hörprobe bleiben offen. Touch, Safari und echte mobile Geräte sind nicht abgenommen. Es gibt keinen Release, keine Kampagne und keinen Multiplayer.
