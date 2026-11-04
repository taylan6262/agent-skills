# Merkwerk – Denkspiele für Gedächtnis, Tempo und Wissen

Merkwerk ist eine mobile-first Lern- und Denkspiel-App (PWA) auf Deutsch. Fünf kurze Spielmodi trainieren
**visuelles Gedächtnis**, **Tempo**, **Lernen durch Wiederholung** und **Allgemeinwissen**. Die App läuft
vollständig im Browser, ist installierbar und offline spielbar – ohne Konto, ohne Server, ohne Tracking.

> Ehrliches Versprechen: Merkwerk trainiert die geübten Fähigkeiten. Es verspricht kein „fotografisches
> Gedächtnis“ und keine IQ-Steigerung.

## Inhalt

- 5 Spielmodi: **Blitzbild**, **Detailblick**, **Zahlenspur**, **Tempo-Duell**, **Wissensrunde**
- 6 Welten × 12 Level = **72 Level**, 1–3 Sterne pro Level, Welten öffnen über Sterne
- Adaptive Schwierigkeit pro Modus, XP und Spielerlevel, Tagesaufgabe, Serie (Tage in Folge)
- **326 Wissensfragen** in 6 Kategorien mit Erklärung, Wiederholung nach dem Leitner-System (5 Fächer)
- **27 Erfolge**, Statistik mit Verlauf pro Fähigkeit, Bestwerten und Lernstand
- Freies Training, Onboarding mit Einstufungstest, Einstellungen (Ton, Haptik, Animationen, Farbmuster)

Gestaltung: Bauhaus-Formenlehre auf Papier – fünf Farben, lokale Schriften (League Spartan, Atkinson
Hyperlegible), eigene SVG-Icons, per Web Audio API erzeugte Klänge. Konzept: [docs/KONZEPT.md](docs/KONZEPT.md),
Qualitätsnachweise (Tests, Lighthouse, Barrierefreiheit): [docs/QUALITAET.md](docs/QUALITAET.md).

## Schnellstart

Voraussetzung: Node.js 20.19 oder neuer (empfohlen: 22, siehe `.nvmrc`).

```bash
npm install
npm run dev
```

Danach <http://localhost:5173> öffnen.

## Testen

```bash
npm run check
```

`check` führt nacheinander Typprüfung, ESLint (ohne Warnungen), Prettier-Prüfung und die Unit-Tests (Vitest) aus.

```bash
npx playwright install chromium
```

Das ist nur einmal nötig. Danach laufen die End-to-End-Tests:

```bash
npm run test:e2e
```

Die E2E-Tests bauen die App, starten `vite preview` mit denselben Sicherheits-Headern wie beim Hosting und prüfen
unter anderem: Onboarding → Level 1 → Ergebnis → Fortschritt nach Neuladen, Offline-Start, alle fünf Modi bis zum
Ergebnis ohne Konsolenfehler, Zurück-Navigation, kein horizontales Scrollen bei 360 px und defekte Spielstände.

## Bauen

```bash
npm run build
```

Das Ergebnis liegt in `dist/` (inklusive Service Worker und Manifest). Lokal ansehen:

```bash
npm run preview
```

## Deployen in 3 Schritten

Beide Konfigurationen enthalten SPA-Fallback (alle Routen → `index.html`), lange Cache-Zeiten für gehashte Dateien,
keinen Cache für Service Worker/HTML und Sicherheits-Header (CSP ohne externe Quellen).

**Vercel** (`vercel.json`)

1. Repository bei Vercel importieren.
2. Als **Root Directory** den Ordner `merkwerk` wählen (Framework „Vite“ wird erkannt, Build-Befehl und `dist` sind vorkonfiguriert).
3. Deploy klicken.

**Netlify** (`netlify.toml`)

1. Repository bei Netlify verbinden.
2. Als **Base directory** `merkwerk` eintragen – Build-Befehl, Publish-Ordner und Node-Version kommen aus `netlify.toml`.
3. Deploy starten.

Ohne Git geht es auch: `npm run build` und den Ordner `dist/` per Drag-and-drop bei Netlify hochladen.

## Vorschau als Einzeldatei (claude.ai-Artifact)

```bash
npm run build:artifact
```

Erzeugt `dist-artifact/merkwerk.html`: JS, CSS und Schriften eingebettet, Verlauf im Speicher statt in der
Adresszeile, ohne Service Worker. Gedacht zum Ausprobieren in eingebetteten Vorschauen; für den echten Betrieb
(installierbar, offline) gilt der normale Build oben.

## Vor dem Livegang ausfüllen

Die Rechtstexte sind **Vorlagen** in [`src/screens/Legal.tsx`](src/screens/Legal.tsx). Platzhalter stehen in eckigen
Klammern und sind in der App gelb markiert:

| Platzhalter                     | Wo                                              |
| ------------------------------- | ----------------------------------------------- |
| `[NAME]`                        | Impressum (2×), Datenschutz                     |
| `[ADRESSE]`                     | Impressum (2×), Datenschutz                     |
| `[E-MAIL]`                      | Impressum, Datenschutz                          |
| `[HOSTING-ANBIETER, …]`         | Datenschutz, Abschnitt „Bereitstellung der App“ |
| `[SPEICHERDAUER LAUT ANBIETER]` | Datenschutz, Abschnitt „Bereitstellung der App“ |
| `[DATUM]`                       | Datenschutz, „Stand“                            |

Nach dem Ausfüllen den Hinweis „Vorlage: …“ (`legal-note`) entfernen. Die Texte ersetzen keine Rechtsberatung.

## Fragen ergänzen

Fragen liegen als Datendateien je Kategorie in [`src/data/questions/`](src/data/questions):
`geografie.ts`, `natur.ts`, `wissenschaft.ts`, `geschichte.ts`, `sprache.ts`, `mathe.ts`.

```ts
q(56, 2, 'Wie heißt die Hauptstadt von Portugal?', ['Lissabon', 'Porto', 'Faro', 'Coimbra'], 'Lissabon liegt an der Mündung des Tejo.'),
```

- 1. Wert: fortlaufende Nummer. **Nummern nie ändern oder wiederverwenden** – der Lernstand hängt an der ID.
- 2. Wert: Schwierigkeit 1 (leicht), 2 (mittel) oder 3 (schwer).
- Antworten: **die richtige zuerst**, dann drei falsche – die Reihenfolge wird im Spiel gemischt.
- Erklärung: ein bis zwei Sätze.

`npm test` prüft automatisch: mindestens 300 Fragen, je Kategorie mindestens 50, eindeutige IDs, keine doppelten
Fragen, vier verschiedene Antworten, Fragezeichen am Ende und eine Erklärung.

## Projektstruktur

```text
src/
  game/            Spiellogik ohne React: Wertung, Sterne, adaptive Schwierigkeit, Leitner, Level, Erfolge, Modi
  data/questions/  Wissensfragen je Kategorie
  state/           Spielstand: Schema, Versionsnummer, Migration, Speichern/Laden, Ergebnisverrechnung
  games/           Oberflächen der fünf Spielmodi
  screens/         Bildschirme (Start, Karte, Level-Intro, Spiel, Ergebnis, Statistik, …)
  ui/              Designsystem-Komponenten, eigene Icons, Diagramm
  lib/             Router, Zufall, Datum, Ton/Haptik
  styles/          Tokens, Basis, Komponenten, Bildschirme, Spiele, Bewegung
e2e/               Playwright-Tests
public/            Schriften (OFL), Icons, Favicon
scripts/           Icon-Generator (npm run icons)
docs/              Konzept und Qualitätsprotokoll
```

## Spielstand, Version und Migration

Der Spielstand liegt unter `merkwerk.spielstand` im `localStorage` und trägt eine Versionsnummer
(`SAVE_VERSION` in `src/state/schema.ts`). Bei Schemaänderungen:

1. `SAVE_VERSION` erhöhen.
2. In `src/state/migrations.ts` eine Funktion von der alten auf die neue Version ergänzen.
3. In `src/state/storage.test.ts` einen Test mit einem Spielstand der alten Version hinzufügen.

Defekte oder unbekannte Daten werden feldweise geprüft und repariert; nicht lesbare Rohdaten werden unter
`merkwerk.spielstand.sicherung` gesichert. Die App stürzt dadurch nicht ab.

## Datenschutz und Technik

- Keine Accounts, keine API-Keys, keine Umgebungsvariablen, kein Backend.
- Keine Cookies, kein Tracking, keine externen Requests zur Laufzeit (Content-Security-Policy `default-src 'self'`).
- React + TypeScript (strict) + Vite, PWA über `vite-plugin-pwa` (Workbox).

## Lizenzen

Schriften: League Spartan und Atkinson Hyperlegible unter der SIL Open Font License 1.1 (Lizenztexte in `public/fonts/`).
Alle Icons, Illustrationen, Klänge und Fragen sind eigens für Merkwerk erstellt.
