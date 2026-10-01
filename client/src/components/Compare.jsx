import './compare.css';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatHeight, formatWeight, typesOf, figureBox, rulerScale, scaleToFitWidth } from '../data/measure';
import {
  parseSelection, selectionParams, compareStats, compareSize, matchups,
  compareEvolution, stageLabel, toMeters, toKilograms, formatMeters, formatKilograms,
} from '../data/compare';
import { usePokemon } from '../hooks/usePokemon';
import PokemonPicker from './PokemonPicker';
import TypePill from './TypePill';
import StatusMessage, { ErrorMessage } from './StatusMessage';

const pct = (n) => `${n * 100}%`;
const entryLink = (p) => `/?no=${p.national_number}`;

function Face({ pokemon, side }) {
  return (
    <div className={`face face-${side}`}>
      <img className="face-art" src={pokemon.photo} alt="" />
      <div className="face-text">
        <p className="face-no">No. {pokemon.national_number}</p>
        <h2 className="face-name">
          <Link to={entryLink(pokemon)}>{pokemon.name}</Link>
        </h2>
        <div className="face-types">
          {typesOf(pokemon).map(t => <TypePill key={t} type={t} />)}
        </div>
      </div>
    </div>
  );
}

function StatRow({ row, a, b }) {
  const leaderName = row.leader === 'a' ? a.name : b.name;
  const side = (who, value) => (
    <span className={row.leader === who ? `stat-side stat-${who} is-leader` : `stat-side stat-${who}`}>
      <span className="stat-diff">{row.leader === who ? `+${row.diff}` : ''}</span>
      <span className="stat-num">{value}</span>
      <span className="stat-bar" style={{ '--v': Math.min(1, value / row.scale) }} />
    </span>
  );

  return (
    <li className={row.key === 'total' ? 'stat-row is-total' : 'stat-row'}>
      <span className="visually-hidden">
        {row.label}: {a.name} {row.a}, {b.name} {row.b}.{' '}
        {row.leader ? `${leaderName} is higher by ${row.diff}.` : 'Even.'}
      </span>
      <span className="stat-cells" aria-hidden="true">
        {side('a', row.a)}
        <span className="stat-label">
          {row.label}
          {!row.leader && <span className="stat-even">Even</span>}
        </span>
        {side('b', row.b)}
      </span>
    </li>
  );
}

function SizeChart({ a, b }) {
  // Each figure gets half the stage, which on phones is a little wider than
  // the chart is tall.
  const fit = Math.max(scaleToFitWidth(a, 0.6), scaleToFitWidth(b, 0.6));
  const { scaleInches, ticks } = rulerScale(Math.max(a.height_in, b.height_in), fit);

  return (
    <div className="size-chart">
      <div className="size-ruler" aria-hidden="true">
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
      <div className="size-stage">
        {[a, b].map(p => {
          const fraction = p.height_in / scaleInches;
          const box = figureBox(p, fraction);
          return (
            <div className="size-slot" key={p.id}>
              <img
                src={p.photo}
                alt={`${p.name}, drawn to scale`}
                style={{ height: pct(box.imgHeight), bottom: pct(-box.sink) }}
              />
              <div className="size-mark" style={{ bottom: pct(fraction) }} aria-hidden="true">
                <span>{formatHeight(p.height_in)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvolutionChain({ pokemon, family }) {
  return (
    <ol className="evo-chain" aria-label={`${pokemon.evolution_family} family`}>
      {family.map((m, i) => (
        // An arrow only where the stage goes up; baby Pokemon share a stage.
        <li key={m.id} className={i > 0 && m.evolution_stage > family[i - 1].evolution_stage ? 'evolves' : undefined}>
          <Link to={entryLink(m)} aria-current={m.id === pokemon.id ? 'true' : undefined}>
            <img src={m.photo} alt="" />
            <span>{m.name}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function CompareSkeleton() {
  return (
    <div className="compare-faces" aria-hidden="true">
      {['a', 'b'].map(side => (
        <div key={side} className={`face face-${side}`}>
          <span className="face-art skeleton" />
          <div className="face-text">
            <span className="skeleton skeleton-line" style={{ width: '4rem' }} />
            <span className="skeleton skeleton-line" style={{ width: '9rem', height: '2.5rem', margin: '0.5rem 0' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompareBody({ a, b, familyA, familyB }) {
  const stats = compareStats(a, b);
  const size = compareSize(a, b);

  return (
    <>
      <div className="compare-faces">
        <Face pokemon={a} side="a" />
        <Face pokemon={b} side="b" />
      </div>

      <section className="compare-section" aria-labelledby="cmp-stats">
        <h2 id="cmp-stats">Base stats</h2>
        <ul className="stat-list">
          {stats.rows.map(row => <StatRow key={row.key} row={row} a={a} b={b} />)}
          <StatRow row={stats.total} a={a} b={b} />
        </ul>
      </section>

      <section className="compare-section" aria-labelledby="cmp-size">
        <h2 id="cmp-size">Size</h2>
        <p className="compare-note">Both drawn to the same scale.</p>
        <SizeChart a={a} b={b} />
        <dl className="size-facts">
          {[a, b].map(p => (
            <div key={p.id} className="size-fact">
              <dt>{p.name}</dt>
              <dd>{formatHeight(p.height_in)} ({formatMeters(toMeters(p.height_in))})</dd>
              <dd>{formatWeight(p.weight_lb)} ({formatKilograms(toKilograms(p.weight_lb))})</dd>
            </div>
          ))}
        </dl>
        <p className="compare-summary">{size.height} {size.weight}</p>
      </section>

      <section className="compare-section" aria-labelledby="cmp-types">
        <h2 id="cmp-types">Type matchups</h2>
        <div className="compare-columns">
          {[[a, b], [b, a]].map(([attacker, defender]) => (
            <div key={attacker.id}>
              <h3>{attacker.name} attacking</h3>
              <ul className="matchup-list">
                {matchups(attacker, defender).map(m => (
                  <li key={m.type} className={`matchup is-${m.strength}`}>
                    <span className="matchup-mult">{m.multiplierText}</span>
                    <span>{m.sentence}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="compare-section" aria-labelledby="cmp-evo">
        <h2 id="cmp-evo">Evolution</h2>
        <div className="compare-columns">
          {[[a, familyA], [b, familyB]].map(([p, family]) => (
            <div key={p.id}>
              <h3>{p.name}</h3>
              <p className="evo-stage">{stageLabel(p)}, {p.evolution_family} family</p>
              <EvolutionChain pokemon={p} family={family} />
            </div>
          ))}
        </div>
        <p className="compare-summary">{compareEvolution(a, b, familyA)}</p>
      </section>
    </>
  );
}

function Compare() {
  const [params, setParams] = useSearchParams();
  const ids = parseSelection(params);
  const slotA = usePokemon(ids.a);
  const slotB = usePokemon(ids.b);

  // The previous pair stays on screen while a new choice loads.
  const a = slotA.data?.pokemon ?? null;
  const b = slotB.data?.pokemon ?? null;

  // Bars glide between values only after the first render, so they move
  // when the selection changes but not on page load.
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const select = (aId, bId) => setParams(selectionParams(aId, bId));
  const error = slotA.error ?? slotB.error;

  let body;
  if (error?.kind === 'not-found') {
    body = (
      <StatusMessage title="That Pokémon isn't in the Pokédex">
        <p>{error.message} Pick another above; numbers run from 1 to 1025.</p>
      </StatusMessage>
    );
  } else if (error) {
    body = <ErrorMessage error={error} onRetry={() => { slotA.retry(); slotB.retry(); }} />;
  } else if (!a || !b) {
    body = <CompareSkeleton />;
  } else {
    body = <CompareBody a={a} b={b} familyA={slotA.data.family} familyB={slotB.data.family} />;
  }

  return (
    <section
      className={animate ? 'compare is-animated' : 'compare'}
      aria-busy={slotA.loading || slotB.loading}
    >
      <h1>Compare</h1>

      <div className="compare-pickers">
        <PokemonPicker
          label="First Pokémon"
          value={a}
          unavailableId={ids.b}
          onChange={(p) => select(p.id, ids.b)}
        />
        <button className="outline-button compare-swap" onClick={() => select(ids.b, ids.a)} aria-label="Swap the two Pokémon">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M3 7h13m-4-4l4 4-4 4M17 13H4m4-4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="compare-swap-text">Swap</span>
        </button>
        <PokemonPicker
          label="Second Pokémon"
          value={b}
          unavailableId={ids.a}
          onChange={(p) => select(ids.a, p.id)}
        />
      </div>

      {body}
    </section>
  );
}

export default Compare;
