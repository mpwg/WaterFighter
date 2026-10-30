# Flutwehr – freigegebener Arcade-Auftrag

Stand: 30. Oktober 2026. Dieser Auftrag ersetzt die aktiven Solver- und Geodatenkonzepte. Historische Unterlagen und der alte Prototyp bleiben ausschließlich in der unveränderten Git-Referenz `prototype/v1`.

## Runde und Spielregeln

Eine vollständige Spielzeug-Wien-Arena bleibt sichtbar. Eine deterministische Runde dauert höchstens 180 Sekunden. Fünf teils überlappende Wellen beginnen mit der ersten Flut bei Sekunde 5; ungeschützte Häuser sind spätestens bei Sekunde 15 bedroht. Es folgen schnelle kleine Wellen, ein vorher angekündigter zweiter Zufluss, gemischte Wellen und eine große Schlussflut.

Feste Bauplätze und Routen ersetzen freies Terrainbauen. Die Startenergie reicht für zwei Geräte, regeneriert passiv und erhält einen Wellenabschlussbonus. Direkte Geräteauswahl baut ohne weiteren Bestätigungsdialog. Preis, Wirkung und Reichweite sind vor dem Bau erkennbar. Jedes Gerät hat genau einen Ausbau:

- Wirbelpumpe entzieht der Flut Stärke.
- Gefriergerät verlangsamt die Flut.
- Wasserwerfer schiebt die vorderste Flut zurück, ohne Schaden zu verursachen.

Luftkissen schützen ein gewähltes Haus sechs Sekunden und laden zwanzig Sekunden nach; sie sind sofort verfügbar. Das Rettungsboot evakuiert ein bedrohtes Haus in zwei Sekunden und lädt fünfundzwanzig Sekunden nach. Evakuierung schützt Bewohner, nicht das Gebäude. Häuser erleiden bei anhaltendem Kontakt alle zwei Sekunden Schaden und gehen nach drei Treffern verloren. Luftkissen unterbrechen den Schadenszähler. Verlorene Häuser bleiben verloren.

Nach Schlusswelle beziehungsweise am Zeitlimit gewinnt, wer mindestens die Hälfte der Bewohner in noch stehenden Häusern oder durch Evakuierung gesichert hat. Vollständiger Bewohnerverlust beendet die Runde sofort. Punkte entstehen durch erhaltene Häuser und frühe Abwehr, niemals durch wiederholten Hausschaden. Neustart und Pause sind verfügbar; in Pause gibt es keine Spielaktionen. Ein unsichtbarer Tab pausiert automatisch.

## Darstellung und Rückmeldung

Zusammenhängende, schäumende Wasserzüge, große Fronten und sichtbare Geräteeffekte sollen den Zusammenhang zwischen Eingriff und Wirkung innerhalb von 0,5 Sekunden lesbar machen. Häuser zeigen Warnung, Schadensstufe und Schadenscountdown. Spritzer und Rettungen sind sichtbar, Sound ist optional. Kamerawackeln lässt sich abschalten. Desktop hat Vorrang; Touch wird nicht abgenommen.

## Technik und Abnahme

TypeScript, Vite, Bun und Babylon bleiben. Der deterministische Kern tickt in festen Zeitschritten getrennt von Renderer und Eingabe. Er modelliert Arena, Routen, Bauplätze, Häuser, Wellen, Commands, Zustand und Events. Alte Solver, Worker und Geodaten sind aus diesem Branch entfernt.

Kernprüfungen betreffen Zeit, Geräte, Ressourcen, Cooldowns, Schaden, Score und Neustart. Gleiche Szenarien vergleichen Nichtstun, einzelne Gerätetypen und eine bessere Kombination; Rettung nach Durchbruch wird separat geprüft. Browserprüfungen umfassen Bau, Ausbau, beide Rettungsfähigkeiten, eine vollständige Runde, Pause und Tabwechsel. Visuelle Screenshots ergänzen DOM-Prüfungen. Alle Plattform- und Abnahmeaussagen benötigen tatsächlich erhobene Belege. Menschlicher Spielspaß bleibt offen.

Kein Multiplayer, keine Kampagne, keine Persistenz und kein Release oder Push.
