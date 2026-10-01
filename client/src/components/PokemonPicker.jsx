import { useEffect, useId, useRef, useState } from 'react';
import { usePokemonSearch } from '../hooks/usePokemon';

// Searchable picker (ARIA combobox pattern). Searches the API by name or
// number as you type; the Pokemon held by the other slot is listed but can't
// be chosen. `value` may be null while the current choice loads.
function PokemonPicker({ label, value, unavailableId, onChange }) {
  const id = useId();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(null);

  const search = usePokemonSearch(open ? query : null, { limit: 12 });
  const options = search.pending ? [] : search.items;
  const isAvailable = (p) => p.id !== unavailableId;

  // The highlighted option follows its id as results arrive; otherwise the
  // current choice (when browsing) or the first choosable result.
  const fallbackIndex = Math.max(0, options.findIndex(p => (query ? isAvailable(p) : p.id === value?.id)));
  const found = options.findIndex(p => p.id === activeId);
  const active = found >= 0 ? found : fallbackIndex;

  const openWith = (q) => {
    setQuery(q);
    setActiveId(null);
    setOpen(true);
  };

  const close = () => { setOpen(false); setQuery(''); };

  const choose = (p) => {
    if (!isAvailable(p)) return;
    onChange(p);
    close();
  };

  // Once a pick lands, select the new name so typing again starts a fresh
  // search instead of appending to it.
  useEffect(() => {
    if (document.activeElement === inputRef.current) inputRef.current.select();
  }, [value?.id]);

  // Move to the next choosable option, wrapping, skipping the taken one.
  const step = (dir) => {
    if (!options.length) return;
    let i = active;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (isAvailable(options[i])) break;
    }
    setActiveId(options[i].id);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openWith('');
      else step(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      close();
    }
  };

  const listId = `${id}-list`;
  const optionId = (p) => `${id}-opt-${p.id}`;

  return (
    <div className="picker">
      <label className="picker-label" htmlFor={`${id}-input`}>{label}</label>
      <div className="picker-field">
        {!open && value && <img className="picker-current" src={value.photo} alt="" />}
        <input
          ref={inputRef}
          id={`${id}-input`}
          className={open ? 'picker-input is-open' : 'picker-input'}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? optionId(options[active]) : undefined}
          autoComplete="off"
          placeholder={value ? 'Name or number' : 'Loading…'}
          value={open ? query : value?.name ?? ''}
          onFocus={(e) => e.target.select()}
          onClick={() => !open && openWith('')}
          onChange={(e) => openWith(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={close}
        />
        <svg className="picker-caret" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {open && (
        <ul className="picker-list" id={listId} role="listbox" aria-label={label}>
          {options.map((p, i) => {
            const available = isAvailable(p);
            return (
              <li
                key={p.id}
                id={optionId(p)}
                role="option"
                aria-selected={i === active}
                aria-disabled={!available}
                className="picker-option"
                onMouseDown={(e) => { e.preventDefault(); choose(p); }}
                onMouseEnter={() => available && setActiveId(p.id)}
              >
                <img src={p.photo} alt="" loading="lazy" />
                <span className="picker-no">{p.national_number}</span>
                <span className="picker-name">{p.name}</span>
                {!available && <span className="picker-note">In the other slot</span>}
              </li>
            );
          })}
          {search.pending && <li className="picker-empty">Searching…</li>}
          {search.error && <li className="picker-empty">{search.error.message}</li>}
          {!search.pending && !search.error && options.length === 0 && (
            <li className="picker-empty">No match. Try a name like “Pikachu” or a number from 1 to 1025.</li>
          )}
          {!search.pending && !query.trim() && search.data?.total > options.length && (
            <li className="picker-empty">Type a name or number to search all {search.data.total.toLocaleString('en-US')}.</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default PokemonPicker;
