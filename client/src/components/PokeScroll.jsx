import './pokeScroll.css';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatHeight, formatWeight, typesOf, figureBox, rulerScale, scaleToFitWidth } from "../data/measure";
import TypePill from './TypePill';

const pct = (n) => `${n * 100}%`;

// One entry: { pokemon, prev, next } from GET /api/pokemon/:id.
// `onNavigate` receives a neighbour; `loading` is true while the next one loads.
function PokeScroll({ detail, onNavigate, loading = false }) {
  const { pokemon, prev, next } = detail;

  // The ruler re-scales to each Pokemon, with headroom above, and enough
  // for wide ones to fit the stage (roughly as wide as it is tall).
  const inches = pokemon.height_in;
  const { scaleInches, ticks } = rulerScale(inches, scaleToFitWidth(pokemon, 0.95));
  const fraction = inches / scaleInches;
  const box = figureBox(pokemon, fraction);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev);
      if (e.key === 'ArrowRight' && next) onNavigate(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onNavigate]);

  return (
    <article className={loading ? 'entry is-loading' : 'entry'} aria-busy={loading}>
      <div className="entry-info">
        <p className="entry-no">No. {pokemon.national_number}</p>
        <h1 className="entry-name">{pokemon.name}</h1>
        <ul className="entry-types" aria-label="Type">
          {typesOf(pokemon).map(t => <li key={t}><TypePill type={t} /></li>)}
        </ul>
        <dl className="entry-stats">
          <div>
            <dt>Height</dt>
            <dd>{formatHeight(pokemon.height_in)}</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{formatWeight(pokemon.weight_lb)}</dd>
          </div>
        </dl>
        <Link className="outline-button entry-compare" to={`/compare?a=${pokemon.id}`}>
          Compare {pokemon.name} with another Pokémon
        </Link>
      </div>

      <div className="entry-chart">
        <div className="entry-ruler" aria-hidden="true">
          {ticks.map(t => (
            <div
              key={t.at}
              className={t.major ? 'tick tick-foot' : 'tick'}
              style={{ bottom: pct(t.at / scaleInches) }}
            >
              {t.label && <span>{t.label}</span>}
            </div>
          ))}
        </div>

        <div className="entry-stage">
          <img
            key={pokemon.id}
            className="entry-figure"
            src={pokemon.photo}
            alt={`${pokemon.name}, drawn to scale`}
            style={{ height: pct(box.imgHeight), bottom: pct(-box.sink) }}
          />
          <div className="entry-mark" style={{ bottom: pct(fraction) }} aria-hidden="true">
            <span>{formatHeight(pokemon.height_in)}</span>
          </div>
        </div>
      </div>

      <nav className="entry-steps" aria-label="Neighbouring entries">
        <button onClick={() => onNavigate(prev)} disabled={!prev}>
          <span className="step-dir">Previous</span>
          <span className="step-name">{prev ? prev.name : 'Start of list'}</span>
        </button>
        <button onClick={() => onNavigate(next)} disabled={!next}>
          <span className="step-dir">Next</span>
          <span className="step-name">{next ? next.name : 'End of list'}</span>
        </button>
      </nav>
    </article>
  );
}

export default PokeScroll;
