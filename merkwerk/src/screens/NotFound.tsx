import { Link, PageTitle } from '../ui/components';
import { Shape } from '../ui/Shape';
import { useTitle } from '../ui/useTitle';

export function NotFound() {
  useTitle('Nicht gefunden');
  return (
    <section className="page narrow not-found">
      <div className="not-found-shapes" aria-hidden="true">
        <Shape shape="kreis" color="rot" size={64} />
        <Shape shape="quadrat" color="blau" size={64} />
        <Shape shape="dreieck" color="gelb" size={64} />
      </div>
      <PageTitle>Diese Seite gibt es nicht.</PageTitle>
      <p className="lead">Vielleicht hat sich ein Buchstabe verirrt. Auf der Startseite geht es weiter.</p>
      <Link to="/" className="btn btn-primary">
        <span>Zur Startseite</span>
      </Link>
    </section>
  );
}
