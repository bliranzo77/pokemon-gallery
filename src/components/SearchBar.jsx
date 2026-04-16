import './SearchBar.css';
import { useState } from "react";
import pokedex from "../data/data";

function SearchBar({ onSelect }) {
  const [query, setQuery] = useState("");

  const results = query.trim()
    ? pokedex.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (pokemon) => {
    onSelect(pokedex.indexOf(pokemon));
    setQuery("");
  };

  return (
    <div className="searchbar_container">
      <input
        className="searchbar_input"
        type="text"
        placeholder="Search Pokémon..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setQuery(""), 150)}
      />
      {results.length > 0 && (
        <ul className="searchbar_dropdown">
          {results.map((pokemon) => (
            <li
              key={pokemon.id}
              className="searchbar_result"
              onMouseDown={() => handleSelect(pokemon)}
            >
              <img src={pokemon.photo} alt={pokemon.name} className="searchbar_result_img" />
              <span className="searchbar_result_name">{pokemon.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
