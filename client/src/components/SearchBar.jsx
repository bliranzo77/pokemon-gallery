import './SearchBar.css';
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGalleryState } from "../hooks/useGalleryFilters";
import { usePokemonSearch } from "../hooks/usePokemon";

// On the Gallery, search narrows the grid alongside the other filters.
function GallerySearch() {
  const { state, update } = useGalleryState();
  return (
    <div className="searchbar">
      <label htmlFor="pokemon-search" className="visually-hidden">Filter the gallery by name or number</label>
      <input
        id="pokemon-search"
        className="searchbar_input"
        type="search"
        placeholder="Filter by name or number"
        autoComplete="off"
        value={state.q}
        onChange={(e) => update({ q: e.target.value }, { replace: true })}
      />
    </div>
  );
}

// Elsewhere, search jumps straight to an entry.
function EntrySearch({ onDone }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const open = query.trim().length > 0;
  const search = usePokemonSearch(open ? query : null, { limit: 8 });
  const results = search.pending ? [] : search.items;

  const handleSelect = (pokemon) => {
    navigate(`/?no=${pokemon.national_number}`);
    setQuery("");
    onDone?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setActive(i => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActive(i => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[active]) {
      handleSelect(results[active]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="searchbar">
      <label htmlFor="pokemon-search" className="visually-hidden">Find a Pokémon</label>
      <input
        id="pokemon-search"
        className="searchbar_input"
        type="search"
        placeholder="Find by name or number"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="pokemon-search-results"
        aria-activedescendant={results[active] ? `result-${results[active].id}` : undefined}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setQuery(""), 150)}
      />
      {open && (
        <ul className="searchbar_dropdown" id="pokemon-search-results" role="listbox">
          {results.map((pokemon, i) => (
            <li
              key={pokemon.id}
              id={`result-${pokemon.id}`}
              role="option"
              aria-selected={i === active}
              className="searchbar_result"
              onMouseDown={() => handleSelect(pokemon)}
              onMouseEnter={() => setActive(i)}
            >
              <img src={pokemon.photo} alt="" className="searchbar_result_img" />
              <span className="searchbar_result_no">{pokemon.national_number}</span>
              <span className="searchbar_result_name">{pokemon.name}</span>
            </li>
          ))}
          {search.pending && <li className="searchbar_empty">Searching…</li>}
          {search.error && <li className="searchbar_empty">{search.error.message}</li>}
          {!search.pending && !search.error && results.length === 0 && (
            <li className="searchbar_empty">
              No match. Try a name like “Pikachu” or a number from 1 to 1025.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function SearchBar({ onDone }) {
  const { pathname } = useLocation();
  return pathname === "/gallery" ? <GallerySearch /> : <EntrySearch onDone={onDone} />;
}

export default SearchBar;
