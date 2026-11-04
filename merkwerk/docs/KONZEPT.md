# Merkwerk – Konzept

## Idee
Merkwerk ist eine Werkstatt für den Kopf: kurze Denkspiele, die visuelles Gedächtnis,
Tempo, Lernen (Wiederholung) und Allgemeinwissen trainieren. Ehrliches Versprechen:
„Trainiere dein visuelles Gedächtnis“, keine Aussagen über IQ oder „fotografisches Gedächtnis“.

## Designrichtung: Bauhaus-Formenlehre auf Papier
- Flache Flächen, keine Verläufe, kein Glas, keine Emojis.
- Grundformen Kreis, Quadrat, Dreieck sind Logo, Icons, Spielsteine und Kartenknoten zugleich.
- Harte Tintenkonturen (2–3 px), kaum Rundungen (2 px), Raster-Hintergrund wie ein Druckbogen.
- Layout linksbündig und redaktionell, große Display-Ziffern statt Karten-Dashboards.

| Token  | Farbe     | Einsatz                                   |
|--------|-----------|-------------------------------------------|
| Papier | `#F4EEE1` | Hintergrund, Flächen                      |
| Tinte  | `#1B1A17` | Text, Konturen                            |
| Rot    | `#B8331D` | Akzent: Primäraktion, Fehler (mit Symbol) |
| Blau   | `#1E4FA3` | Info, richtig (immer mit Häkchen)         |
| Gelb   | `#F2B807` | Sterne, Hervorhebung (nur als Fläche)     |

Schriften (OFL, lokal): **League Spartan** (Display, 700–900), **Atkinson Hyperlegible** (Text).

## Spielmodi
1. **Blitzbild**: Raster 3×3 bis 6×6, Formen kurz zeigen, Positionen bzw. Formen wiederherstellen.
2. **Detailblick**: generierte SVG-Szene, danach Fragen (Anzahl, Ecke, Farbe, Existenz).
3. **Zahlenspur**: Ziffernfolgen vorwärts, ab Stufe 6 auch rückwärts; Länge passt sich pro Folge an.
4. **Tempo-Duell**: Ja/Nein gegen die Uhr (Farbe↔Wort, Form↔Wort, gleiches Symbol wie vorher), Combo ×1–×4.
5. **Wissensrunde**: Multiple Choice in 6 Kategorien, 300+ Fragen, Leitner-System (5 Fächer).

Adaptiv: zwei sehr gute Runden in Folge → +1 Stufe, zwei Fehlschläge in Folge → −1 Stufe (pro Modus).

## Progression
- 6 Welten × 12 Level = 72 Level: Punkt, Linie, Fläche, Raum, Rhythmus, Komposition.
- Sterne: 1★ ab 50 %, 2★ ab 75 %, 3★ ab 90 % Leistung. Welten öffnen über Gesamtsterne (0/20/45/70/95/120).
- XP und Spielerlevel, Tagesaufgabe (aus dem Datum abgeleitet), Serie (Tage in Folge), 25 Erfolge.
- Statistik: Leistungsindex pro Fähigkeit über Zeit, Bestwerte, Lernstand (Leitner-Fächer).

## Screens
Splash → Onboarding (3 Schritte, inkl. Einstufung per Zahlenspur) → Start → Karte → Level-Intro →
Spiel (Pause-Menü) → Ergebnis → Statistik → Erfolge → Training → Einstellungen → Impressum/Datenschutz.

## Dateistruktur
```
src/
  game/          reine Spiellogik (kein React): Wertung, Adaptiv, Leitner, Level, Erfolge, Modi
  data/questions Fragen als Datendateien je Kategorie
  state/         Spielstand (Schema, Version, Migration, Speicher)
  lib/           Router, Zufall, Datum, Ton, Haptik
  ui/            Designsystem-Komponenten und eigene SVG-Icons
  games/         React-Oberflächen der fünf Modi
  screens/       Bildschirme
e2e/             Playwright-Tests
```
