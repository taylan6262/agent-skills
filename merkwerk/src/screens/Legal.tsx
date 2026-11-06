import { PageTitle, TopBar } from '../ui/components';
import { useTitle } from '../ui/useTitle';

/**
 * VORLAGEN – vor dem Livegang ausfüllen. Alle Platzhalter stehen in eckigen Klammern
 * und sind im Text hervorgehoben (Klasse „placeholder“). Keine Rechtsberatung.
 */
function P({ children }: { children: string }) {
  return <mark className="placeholder">{children}</mark>;
}

export function Impressum() {
  useTitle('Impressum');
  return (
    <>
      <TopBar title="Impressum" back="/einstellungen" />
      <article className="page narrow legal">
        <PageTitle>Impressum</PageTitle>
        <p className="legal-note">
          Vorlage: Die markierten Platzhalter müssen vor der Veröffentlichung ersetzt werden.
        </p>

        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          <P>[NAME]</P>
          <br />
          <P>[ADRESSE]</P>
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail: <P>[E-MAIL]</P>
        </p>

        <h2>
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV (nur bei journalistisch-redaktionellen
          Inhalten)
        </h2>
        <p>
          <P>[NAME]</P>, <P>[ADRESSE]</P>
        </p>

        <h2>Haftung für Inhalte</h2>
        <p>
          Die Inhalte dieser App wurden mit Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit
          und Aktualität der Inhalte – insbesondere der Wissensfragen – kann jedoch keine Gewähr
          übernommen werden. Hinweise auf Fehler nehmen wir unter der oben genannten E-Mail-Adresse
          gerne entgegen.
        </p>

        <h2>Schriften und Gestaltung</h2>
        <p>
          Verwendete Schriften: League Spartan (The League of Moveable Type) und Atkinson
          Hyperlegible (Braille Institute), beide unter der SIL Open Font License 1.1. Die Schriften
          werden lokal ausgeliefert. Alle Grafiken, Icons und Klänge sind eigens für Merkwerk
          erstellt.
        </p>
      </article>
    </>
  );
}

export function Datenschutz() {
  useTitle('Datenschutz');
  return (
    <>
      <TopBar title="Datenschutz" back="/einstellungen" />
      <article className="page narrow legal">
        <PageTitle>Datenschutzerklärung</PageTitle>
        <p className="legal-note">
          Vorlage: Die markierten Platzhalter müssen vor der Veröffentlichung ersetzt werden.
        </p>

        <h2>Kurz gesagt</h2>
        <p>
          Merkwerk erhebt keine personenbezogenen Daten. Es gibt keine Konten, kein Tracking, keine
          Analyse- oder Werbedienste, keine Cookies und keine Verbindungen zu Servern Dritter. Dein
          Spielstand bleibt ausschließlich auf deinem Gerät.
        </p>

        <h2>Verantwortliche Stelle</h2>
        <p>
          <P>[NAME]</P>
          <br />
          <P>[ADRESSE]</P>
          <br />
          E-Mail: <P>[E-MAIL]</P>
        </p>

        <h2>Lokale Speicherung auf deinem Gerät</h2>
        <p>
          Damit dein Fortschritt erhalten bleibt, speichert die App Spielstand, Einstellungen und
          Lernstand im lokalen Speicher deines Browsers (localStorage). Für die Offline-Nutzung legt
          der Service Worker die Programmdateien im Browser-Cache ab. Diese Daten verlassen dein
          Gerät nicht und werden von uns nicht ausgelesen. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2
          TDDDG, da die Speicherung für die von dir gewünschte Funktion unbedingt erforderlich ist.
        </p>
        <p>
          Du kannst die Daten jederzeit löschen: in der App unter Einstellungen → „Fortschritt
          zurücksetzen“ oder vollständig über die Website-Daten-Einstellungen deines Browsers bzw.
          durch Deinstallation der App.
        </p>

        <h2>Bereitstellung der App (Hosting)</h2>
        <p>
          Beim Aufruf der App überträgt dein Browser technisch notwendige Daten (z. B. IP-Adresse,
          Zeitpunkt, angeforderte Datei) an den Server des Hosting-Anbieters{' '}
          <P>[HOSTING-ANBIETER, z. B. Vercel Inc. oder Netlify Inc., mit Anschrift]</P>. Diese
          Verarbeitung erfolgt zur sicheren Auslieferung der App auf Grundlage von Art. 6 Abs. 1
          lit. f DSGVO. Einzelheiten regelt der Auftragsverarbeitungsvertrag mit dem Anbieter;
          Speicherdauer der Server-Logs: <P>[SPEICHERDAUER LAUT ANBIETER]</P>. Nach dem ersten Laden
          funktioniert Merkwerk auch ohne Internetverbindung.
        </p>

        <h2>Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht auf Beschwerde bei
          einer Datenschutz-Aufsichtsbehörde. Da wir selbst keine personenbezogenen Daten speichern,
          betreffen diese Rechte in der Praxis vor allem die Server-Logs des Hosting-Anbieters.
        </p>

        <p className="muted small">
          Stand: <P>[DATUM]</P>
        </p>
      </article>
    </>
  );
}
