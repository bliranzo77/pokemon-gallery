import '../App.css';
import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Nav from '../components/Nav';
import PokeScroll from '../components/PokeScroll';
import StatusMessage, { ErrorMessage } from '../components/StatusMessage';
import { usePokemon } from '../hooks/usePokemon';

function EntrySkeleton() {
  return (
    <div className="entry entry-skeleton" aria-hidden="true">
      <div className="entry-info">
        <span className="skeleton skeleton-line" style={{ width: '6rem' }} />
        <span className="skeleton entry-skeleton-name" />
        <span className="skeleton skeleton-line" style={{ width: '10rem' }} />
      </div>
      <div className="entry-chart skeleton" />
    </div>
  );
}

function Home() {
  const [params, setParams] = useSearchParams();

  // The open entry lives in the URL (?no=006) so it can be linked to.
  const raw = params.get('no');
  const number = raw && /^\d+$/.test(raw) ? Number(raw) : 1;
  const entry = usePokemon(number);

  const handleNavigate = useCallback((neighbour) => {
    setParams({ no: neighbour.national_number }, { replace: true });
  }, [setParams]);

  // Keep showing the current entry while its neighbour loads.
  const detail = entry.data;
  let content;
  if (entry.error?.kind === 'not-found') {
    content = (
      <StatusMessage title={`No Pokémon #${raw}`} action={<Link className="outline-button" to="/gallery">Browse the Gallery</Link>}>
        <p>Pokédex numbers run from 1 to 1025.</p>
      </StatusMessage>
    );
  } else if (entry.error) {
    content = <ErrorMessage error={entry.error} onRetry={entry.retry} />;
  } else if (!detail) {
    content = <EntrySkeleton />;
  } else {
    content = <PokeScroll detail={detail} onNavigate={handleNavigate} loading={entry.loading} />;
  }

  return (
    <section className='app_container'>
      <Nav />
      <main>
        {entry.error ? <div className="page-message">{content}</div> : content}
      </main>
    </section>
  );
}

export default Home;
