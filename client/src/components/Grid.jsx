import './grid.css';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useGalleryFilters from '../hooks/useGalleryFilters';
import { SORTS, PAGE_SIZE } from '../data/filters';
import { formatHeight, typesOf } from '../data/measure';
import FilterPanel from './FilterPanel';
import TypePill from './TypePill';
import StatusMessage, { ErrorMessage } from './StatusMessage';

// Height bars on cards share one scale, floor to 7 ft; taller ones fill it.
const SCALE_INCHES = 84;

// Matches the breakpoint in grid.css where the sidebar replaces the sheet.
const SIDEBAR_QUERY = '(min-width: 52.0625rem)';

const formatCount = (n) => n.toLocaleString('en-US');

function Card({ pokemon }) {
  return (
    <li>
      <Link className="card" to={`/?no=${pokemon.national_number}`}>
        <span className="card-art">
          <img src={pokemon.photo} alt="" loading="lazy" />
        </span>
        <span className="card-no">No. {pokemon.national_number}</span>
        <span className="card-name">{pokemon.name}</span>
        <span className="card-types">
          {typesOf(pokemon).map(t => <TypePill key={t} type={t} />)}
        </span>
        <span className="card-height">
          <span className="card-height-bar" style={{ '--h': Math.min(1, pokemon.height_in / SCALE_INCHES) }} aria-hidden="true" />
          {formatHeight(pokemon.height_in)}
        </span>
      </Link>
    </li>
  );
}

function CardList({ list }) {
  return (
    <ul className="card-grid">
      {list.map(p => <Card key={p.id} pokemon={p} />)}
    </ul>
  );
}

function SkeletonGrid({ count = 12 }) {
  return (
    <ul className="card-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card card-skeleton">
          <span className="card-art skeleton" />
          <span className="skeleton skeleton-line" style={{ width: '35%' }} />
          <span className="skeleton skeleton-line skeleton-name" style={{ width: '70%' }} />
          <span className="skeleton skeleton-line" style={{ width: '50%' }} />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ filters }) {
  const { chips, suggestions, apply, clearAll } = filters;
  if (!chips.length) {
    return (
      <StatusMessage title="No Pokémon in the database yet">
        <p>Seed it with <code>npm run seed</code> from the project folder, then reload.</p>
      </StatusMessage>
    );
  }
  return (
    <StatusMessage
      title="No Pokémon match these filters"
      action={<button className="outline-button" onClick={clearAll}>Clear all filters</button>}
    >
      <p>Together, {chips.map(c => c.label).join(' + ')} exclude every Pokémon.</p>
      {suggestions.loading && <p>Checking which change would help…</p>}
      {suggestions.data?.length > 0 && (
        <>
          <p>Change one to bring results back:</p>
          <ul className="gallery-empty-fixes">
            {suggestions.data.map(({ label, state, count }) => (
              <li key={label}>
                <button className="text-button" onClick={() => apply(state)}>
                  {label} ({formatCount(count)} {count === 1 ? 'match' : 'matches'})
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {suggestions.data?.length === 0 && (
        <p>Removing any single filter still leaves nothing, so these filters rule each other out.</p>
      )}
    </StatusMessage>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pages">
      <button className="outline-button" onClick={() => onPage(page - 1)} disabled={page <= 1}>
        Previous page
      </button>
      <span className="pagination-status" aria-current="page">Page {page} of {pages}</span>
      <button className="outline-button" onClick={() => onPage(page + 1)} disabled={page >= pages}>
        Next page
      </button>
    </nav>
  );
}

function Grid() {
  const filters = useGalleryFilters();
  const { state, update, list, meta, groups, chips, remove, clearAll, searching } = filters;
  const sheetRef = useRef(null);
  const resultsRef = useRef(null);
  const sort = SORTS.find(s => s.key === state.sort);
  const data = list.data;
  const loading = list.loading || searching;

  // If the window widens past the breakpoint, the sidebar takes over.
  useEffect(() => {
    const query = window.matchMedia(SIDEBAR_QUERY);
    const onChange = (e) => { if (e.matches) sheetRef.current?.close(); };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const goToPage = (page) => {
    update({ page });
    resultsRef.current?.scrollIntoView({ block: 'start' });
  };

  let results;
  if (list.error) {
    results = <ErrorMessage error={list.error} onRetry={list.retry} />;
  } else if (loading || !data) {
    results = <SkeletonGrid count={Math.min(PAGE_SIZE, 12)} />;
  } else if (data.total === 0) {
    results = <EmptyState filters={filters} />;
  } else {
    results = (
      <>
        {groups ? groups.map(({ family, members }, i) => (
          <section key={`${family}-${i}`} className="family" aria-labelledby={`family-${i}`}>
            <h2 id={`family-${i}`}>{family} family</h2>
            <CardList list={members} />
          </section>
        )) : <CardList list={data.items} />}
        <Pagination page={data.page} pages={data.pages} onPage={goToPage} />
      </>
    );
  }

  const countText = list.error ? null : data && !loading
    ? <><strong>{formatCount(data.total)}</strong> of {formatCount(meta.data?.total ?? data.total)}<span className="visually-hidden"> Pokémon shown</span></>
    : <span className="gallery-count-loading">Loading…</span>;

  return (
    <section className="gallery">
      <div className="gallery-head">
        <h1>Gallery</h1>
        <p className="gallery-count" role="status">{countText}</p>
      </div>

      <div className="gallery-body">
        <aside className="gallery-sidebar" aria-label="Filters">
          <FilterPanel filters={filters} meta={meta.data} idPrefix="side" />
          {meta.error && <ErrorMessage error={meta.error} onRetry={meta.retry} title="Filters didn't load" />}
        </aside>

        <div className="gallery-results" ref={resultsRef}>
          <div className="gallery-toolbar">
            <button
              className="outline-button gallery-filter-open"
              aria-haspopup="dialog"
              onClick={() => sheetRef.current.showModal()}
            >
              Filters{chips.length > 0 && ` (${chips.length})`}
            </button>

            <label className="gallery-select">
              <span>Sort by</span>
              <select value={state.sort} onChange={e => update({ sort: e.target.value })}>
                {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>

            <label className="gallery-select">
              <span className="visually-hidden">Order</span>
              <select value={state.dir} onChange={e => update({ dir: e.target.value })}>
                <option value="asc">{sort.directions[0]}</option>
                <option value="desc">{sort.directions[1]}</option>
              </select>
            </label>

            <label className="gallery-switch">
              <input
                type="checkbox"
                role="switch"
                checked={state.group}
                onChange={e => update({ group: e.target.checked })}
              />
              <span>Group by evolution family</span>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="gallery-active">
              <h2 className="visually-hidden">Active filters</h2>
              <ul>
                {chips.map(chip => (
                  <li key={chip.field + chip.value}>
                    <button className="active-chip" onClick={() => remove(chip)} aria-label={`Remove filter: ${chip.label}`}>
                      {chip.label}
                      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <button className="text-button" onClick={clearAll}>Clear all</button>
            </div>
          )}

          {results}
        </div>
      </div>

      <dialog
        ref={sheetRef}
        className="filter-sheet"
        aria-labelledby="filter-sheet-title"
        onClick={e => { if (e.target === sheetRef.current) sheetRef.current.close(); }}
      >
        <div className="filter-sheet-head">
          <h2 id="filter-sheet-title">Filters</h2>
          <button className="text-button" onClick={() => sheetRef.current.close()}>Close</button>
        </div>
        <FilterPanel filters={filters} meta={meta.data} idPrefix="sheet" />
        <div className="filter-sheet-foot">
          <button className="text-button" onClick={clearAll} disabled={!chips.length}>Clear all</button>
          <button className="solid-button" onClick={() => sheetRef.current.close()}>
            {loading || !data ? 'Show results'
              : data.total ? `Show ${formatCount(data.total)} Pokémon` : 'See why nothing matches'}
          </button>
        </div>
      </dialog>
    </section>
  );
}

export default Grid;
