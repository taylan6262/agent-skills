# Qualitätsprotokoll

Stand der Abnahme: 6. November 2026, Version 1.1.0 (acht Modi, 617 Fragen).

## Abnahme-Checkliste

| Punkt                                                         | Ergebnis           | Nachweis                                                                                                                   |
| ------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Alle 8 Modi von Anfang bis Ende spielbar, ohne Konsolenfehler | erfüllt            | Zwei E2E-Tests spielen alle acht Modi bis zum Ergebnis und prüfen Konsole und Laufzeitfehler                               |
| 60+ Level, Freischaltung und Sterne                           | erfüllt (72 Level) | Unit-Tests `levels.test.ts`, `apply.test.ts`; E2E Level 1 → 3 Sterne → Level 2 offen                                       |
| Fortschritt bleibt nach Neuladen und offline                  | erfüllt            | E2E „Onboarding … nach dem Neuladen“ und „Offline …“                                                                       |
| Build, Lint, Typecheck, Unit- und E2E-Tests grün              | erfüllt            | `npm run build`, `npm run check` (125 Unit-Tests), `npm run test:e2e` (7 Tests); zusätzlich in einem frischen Klon geprüft |
| Lighthouse ≥ 90                                               | erfüllt            | siehe unten                                                                                                                |
| 360 px: nichts abgeschnitten oder überlappend                 | erfüllt            | E2E prüft `scrollWidth ≤ 360` auf 12 Routen; Screenshots aller Bildschirme gesichtet                                       |
| Kein „KI-Look“                                                | erfüllt            | flache Bauhaus-Formen auf Papier, keine Verläufe, kein Glas, keine Emojis, eigene SVG-Icons                                |
| README, Impressum-/Datenschutz-Vorlagen, Deploy-Konfiguration | erfüllt            | `README.md`, `src/screens/Legal.tsx`, `vercel.json`, `netlify.toml`                                                        |

## Lighthouse (mobil, simuliertes Throttling)

Gemessen gegen `vite preview` mit denselben Sicherheits-Headern wie beim Hosting.

| Kategorie      | Wert | Werkzeug                                                               |
| -------------- | ---- | ---------------------------------------------------------------------- |
| Performance    | 98   | Lighthouse 13.6.0, Route `/willkommen` (Erstbesuch)                    |
| Accessibility  | 100  | Lighthouse 13.6.0                                                      |
| Best Practices | 100  | Lighthouse 13.6.0                                                      |
| SEO            | 100  | Lighthouse 13.6.0                                                      |
| PWA            | 100  | Lighthouse 11.7.1 – ab Version 12 gibt es die PWA-Kategorie nicht mehr |

Kennzahlen der Endmessung zu Version 1.0: FCP 0,76 s · LCP 2,29 s · TBT 85 ms · CLS 0.
Nachmessung zu Version 1.1 (zwei Läufe): Performance 99/99, Accessibility, Best Practices und SEO je 100,
LCP 2,2 s, TBT 4–22 ms – auf einem schnelleren Messrechner (Benchmark-Index rund 3.100), daher nicht direkt
mit den Werten von Version 1.0 vergleichbar.
Accessibility und Best Practices liegen zusätzlich auf `/karte`, `/level/w1-1`, `/training`, `/statistik`,
`/erfolge`, `/einstellungen` und `/datenschutz` bei je 100.

Hinweis zur Streuung: Der Performance-Wert hängt vom Messrechner ab. Eine frühe Messung ergab 78 Punkte bei
einem Benchmark-Index von 861 (ausgelasteter Host); unter normaler Last (Index 1050–1350) lagen alle Läufe
zwischen 94 und 99.

## Barrierefreiheit (axe-core 4.10, WCAG 2.1 A/AA + Best Practices)

Keine Verstöße in 25 Zuständen, darunter laufende Spiele: Blitzbild (Anzeige, Formen ablegen), Pause-Dialog,
Detailblick (Frage, Antwort), Zahlenspur (Eingabe), Tempo-Duell (laufend), Wissensrunde (Frage, Erklärung),
Wegmarken (Anzeige, Eingabe), Rechenwaage (laufend, Auflösung), Zeitleiste (Ordnen, Auflösung),
Ergebnis sowie Start, Karte, Training, Statistik, Erfolge, Einstellungen und Onboarding.

Weitere Maßnahmen: Tastaturbedienung in allen Modi (Pfeiltasten im Raster, Ziffern/Enter, F/J bzw. ←/→,
1–4), Fokus auf die Seitenüberschrift bei jedem Bildschirmwechsel, sichtbarer Fokusrahmen, Zustände nie nur
über Farbe (Häkchen/Kreuz, „An“/„Aus“, gestrichelt/gesperrt), optionale Farbmuster, `prefers-reduced-motion`
und eigene Einstellung „Animationen reduzieren“, Diagramm zusätzlich als Tabelle.

## Farbpalette und Diagramm

Die Palette ist auf fünf Farben festgelegt (Vorgabe). Kontraste: Tinte auf Papier 15,1:1, Rot 5,2:1,
Blau 6,7:1, Tinte auf Gelb 9,6:1. Gelb wird nie als Textfarbe auf Papier verwendet.

Der Paletten-Validator des Dataviz-Skills bestätigt eine ausreichende Trennung auch bei Farbsehschwäche
(ΔE 21,4), bemängelt aber Gelb auf Papier (1,56:1) und die unbunte Tinte. Ausgleich im Diagramm: Tinten-Einfassung
für Gelb, je Reihe eigene Markerform und Strichart, Direktbeschriftung, Legende als Filter und Tabellenansicht.

## Performance-Protokoll

| Idee                                                 | Ausgangswert → Ergebnis                                      | Entscheidung   | Begründung                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------ |
| Onboarding nicht nachladen, sondern ins Haupt-Bundle | Perf 98/94, LCP 2,30/2,40 s → Perf 99/97/98, LCP 2,26–2,32 s | zurückgenommen | Unterschied innerhalb der Messstreuung; +3 KB gzip für alle Wiederkehrer |

Budgets: Haupt-Bundle 87 KB gzip (Ziel < 200 KB), CSS 9 KB gzip, Schriften 59 KB (3 WOFF2 für lateinische
Zeichen, lokal; Erweiterungen nur bei Bedarf).
Bildschirme, Spielmodi und Fragen werden bei Bedarf nachgeladen.

## Wissensfragen

617 Fragen (Geografie 85, Natur 84, Wissenschaft 84, Geschichte 84, Sprache 84, Mathe 85, Kultur 56, Technik 55)
sowie 81 datierte Ereignisse für die Zeitleiste (eindeutige Jahre; nur ungefähr datierte Ereignisse halten in einer
Runde mindestens 50 Jahre Abstand, damit die Reihenfolge eindeutig bleibt).
Automatisch geprüft (`questions.test.ts`): eindeutige IDs, keine doppelten Fragen, vier verschiedene Antworten,
Erklärung vorhanden, Fragezeichen am Ende, alle drei Schwierigkeitsstufen je Kategorie.

Redaktionell gegengeprüft; strittige oder mehrdeutige Fakten wurden bewusst vermieden (z. B. „längster Fluss der
Erde“, Pluralformen mit mehreren zulässigen Varianten). Zahlenangaben sind als gerundete Werte formuliert.

## Abhängigkeiten

- Produktionsabhängigkeiten (`npm audit --omit=dev`): 0 Schwachstellen.
- Entwicklungsabhängigkeiten: moderate Meldungen in `glob`, `minimatch` und `deepmerge` (über `workbox-build`,
  nur zur Build-Zeit, nicht im ausgelieferten Code). Kein erzwungenes Update (`npm audit fix --force`), da es die
  PWA-Toolchain auf inkompatible Versionen heben würde. Erneut prüfen beim nächsten Update von `vite-plugin-pwa`.

## Bekannte Grenzen

- Automatisiert getestet wurde in Chromium. Safari und Firefox wurden nicht automatisiert geprüft; verwendet werden
  nur breit unterstützte Webstandards (`<dialog>`, `color-mix()`, Web Audio API).
- Vibration funktioniert nur auf Geräten und Browsern, die die Vibration-API unterstützen (nicht unter iOS).
- Der Spielstand liegt pro Gerät und Browser; es gibt bewusst keine Synchronisierung.
