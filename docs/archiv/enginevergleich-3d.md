# WaterFighter: Enginevergleich und Wassersimulation

> Historischer Entwurf vom 29. Oktober 2026. Die hier untersuchte native 3D-Spielrichtung wurde durch den browserbasierten 2,5D-Prototyp ersetzt. Maßgeblich sind jetzt [Spielplan](../spielplan.md) und [Umsetzungsplan](../umsetzungsplan.md). Der ursprüngliche Inhalt bleibt nachfolgend als Hintergrund erhalten.

Stand: 29. Oktober 2026

WaterFighter ist eine Idee für ein 3D-Spiel, in dem Wasser durch kleine Modelle fließt und auf veränderbare Hindernisse reagiert. Godot ist derzeit der bevorzugte Ausgangspunkt: Die Engine ist kostenlos, quelloffen und übersichtlich. Ob sie sich für die gewünschte Wassersimulation auf dem Mac eignet, muss ein Prototyp zeigen. Unreal Engine ist die wichtigste Alternative, weil sie bereits Werkzeuge für Flüssigkeitssimulation mitbringt.

## Ziele und Rahmenbedingungen

- Das Spiel soll zunächst auf macOS laufen und kleine 3D-Modelle zeigen.
- Wasser soll interaktiv und plausibel fließen, sich sammeln und auf Hindernisse reagieren. Kleine physikalische Abweichungen sind akzeptabel; wissenschaftliche Genauigkeit ist kein festes Ziel.
- Coding-Agents sollen einen großen Teil der Programmierung übernehmen. Die Ergebnisse müssen trotzdem im laufenden Spiel überprüft werden.
- Engine und benötigte Kernfunktionen sollen möglichst kostenlos sein. Eine kommerzielle Verwertung ist nicht geplant.
- Das Spiel darf Open Source sein. Eine konkrete Lizenz wurde noch nicht gewählt.

## Vergleich der Engines

| Engine | Einstieg und Verständlichkeit | Zusammenarbeit mit Coding-Agents | Wasser für WaterFighter | Kosten und Offenheit |
| --- | --- | --- | --- | --- |
| **Godot** | Überschaubarer Editor, lesbare Skriptsprache und vergleichsweise schneller Einstieg. | Code und viele Szenen sind textbasiert und gut zu bearbeiten. Visuelle Ergebnisse müssen im Editor geprüft werden. | GPU-Berechnungen sind möglich; eine geeignete interaktive 3D-Flüssigkeitssimulation muss gefunden oder entwickelt und auf macOS getestet werden. | Kostenlos und unter MIT-Lizenz verfügbar. Ein Open-Source-Spiel ist möglich; Lizenzhinweise sind zu beachten. |
| **Unity** | Viele Lernmaterialien; Pakete und Einstellungen erhöhen die Komplexität. C# ist gut lesbar. | C# lässt sich gut bearbeiten; Szenen und Editor-Einstellungen benötigen zusätzliche Kontrolle. Unity nennt MCP-Zugang im Personal-Tarif, dessen konkrete Nutzbarkeit mit dem gewählten Agenten zu prüfen ist. | Das HDRP-Wassersystem unterstützt Oberflächen und Effekte. Für frei fließendes Wasser durch Geometrie sind geeignete Erweiterungen oder Eigenentwicklung zu prüfen. | Unity Personal ist unter den Lizenzbedingungen kostenlos. Die Engine ist proprietär; die Lizenzbedingungen sind bei Veröffentlichung zu prüfen. |
| **Unreal Engine** | Sehr leistungsfähiger, aber komplexer Editor; vergleichsweise hoher Ressourcenbedarf. | C++ ist gut bearbeitbar. Visuelle Blueprints und Editor-Assets lassen sich schwieriger direkt durch Agents prüfen und ändern. | Niagara Fluids enthält eine 3D-Flüssigkeitssimulation mit Objektinteraktionen. Sie ist rechenintensiv und als Beta gekennzeichnet; macOS-Unterstützung, Leistung und Zugriff aus der Spiellogik müssen praktisch geprüft werden. | Für das geplante nicht kommerzielle Spiel voraussichtlich kostenlos. Der Engine-Quellcode ist zugänglich; Unreal ist keine Open-Source-Engine. Bei Veröffentlichung gelten die Lizenzbedingungen. |
| **Bevy** | Stark codeorientiert; Rust und weniger ausgereifte visuelle Editorabläufe erhöhen die Einstiegshürde. | Code ist direkt bearbeitbar, aber mehr Infrastruktur muss selbst entstehen. | Eine geeignete Simulation und ihre Integration wären gesondert zu klären. | Kostenlos und Open Source. |

Die Bewertungen von Einstieg und Agent-Tauglichkeit sind Einschätzungen für dieses Vorhaben, keine Messergebnisse. Keine der Engines oder Wassersimulationen wurde für WaterFighter bereits praktisch getestet.

## Wassersimulation

Eine animierte Wasseroberfläche allein berechnet nicht, wohin Wasser fließt. Für WaterFighter muss die Simulation mit der Geometrie und den Hindernissen interagieren; die Darstellung macht dieses Verhalten sichtbar.

Eine mögliche Herangehensweise ist eine Partikelsimulation für kleine Behälter und Durchgänge. Alternativ könnte eine vereinfachte Simulation die für das Spiel wichtigen Größen berechnen und eine separate Darstellung das Wasser visualisieren. Beide Ansätze sind Näherungen; welche Genauigkeit und Leistung erreichbar sind, hängt von der konkreten Umsetzung und Hardware ab.

Godot unterstützt Compute-Shader mit geeigneten Renderern. Unreal Niagara Fluids bietet unter anderem eine 3D-FLIP-Simulation, die Partikel und ein Rechengitter kombiniert. Das Vorhandensein dieser Bausteine bestätigt noch nicht, dass ein bestimmter Ansatz auf dem Ziel-Mac schnell genug läuft oder alle benötigten Spielinteraktionen unterstützt.

## Vorgeschlagener Machbarkeitstest

1. Einen kleinen Godot-Prototyp bauen: Wasser fließt aus einer Quelle durch ein 3D-Modell, trifft auf ein verschiebbares Hindernis und sammelt sich in einem Behälter.
2. Auf dem Ziel-Mac prüfen, ob Fluss, Hindernisse und Sammeln plausibel funktionieren und wie flüssig die Darstellung läuft. Auch prüfen, wie einfach Coding-Agents die Lösung ändern und testen können.
3. Falls die Godot-Lösung zu aufwendig oder unzureichend ist, einen vergleichbaren Versuch mit Unreal Niagara Fluids durchführen und insbesondere Leistung sowie Anbindung an die Spiellogik prüfen.
4. Die Engine anhand der Ergebnisse auswählen. Bis dahin ist Godot eine vorläufige Empfehlung und keine endgültige Entscheidung.

## Noch offen

- Konkrete Spielmechanik, Art der Modelle und Veränderbarkeit der Hindernisse.
- Mac-Modell und Leistungsziel für den Prototyp.
- Welche Größen die Spiellogik aus dem Wasser zuverlässig auslesen muss, etwa Wasserstand oder Durchfluss.
- Auswahl und Lizenz einer geeigneten Wassersimulation sowie gegebenenfalls die Open-Source-Lizenz des Spiels.

## Quellen

- [Godot: Lizenz und Lizenzhinweise](https://docs.godotengine.org/en/stable/about/complying_with_licenses.html)
- [Godot: Compute-Shader](https://docs.godotengine.org/en/stable/tutorials/shaders/compute_shaders.html)
- [Unity: Personal-Tarif](https://unity.com/products/unity-personal) und [Tarifübersicht](https://unity.com/products)
- [Unity: HDRP-Wassersystem](https://github.com/Unity-Technologies/Graphics/blob/master/Packages/com.unity.render-pipelines.high-definition/Documentation~/water.md)
- [Unreal Engine: Lizenz](https://www.unrealengine.com/license)
- [Unreal Engine: Überblick über Niagara Fluids](https://dev.epicgames.com/documentation/unreal-engine/fluid-simulation-in-unreal-engine---overview)
- [NVIDIA PhysX: Partikelsystem](https://nvidia-omniverse.github.io/PhysX/physx/5.6.0/docs/ParticleSystem.html): Dessen PBD-Flüssigkeitssimulation setzt eine CUDA-fähige GPU voraus und ist daher für einen Mac-ersten Ansatz nicht ohne Weiteres geeignet.
