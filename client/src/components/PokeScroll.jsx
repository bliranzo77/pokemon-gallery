import './pokeScroll.css';
import pokedex from "../data/data";

function PokeScroll({ currentIndex, onNavigate }) {
  const pokemon = pokedex[currentIndex];

  const typeLabel = pokemon.type_2
    ? `${pokemon.type} / ${pokemon.type_2}`
    : pokemon.type;

  return (
    <section className='pokescroll_content_container'>

      <div className="parent" key={currentIndex}>

        <div className="div1">
          <img src={pokemon.photo} alt={pokemon.name} />
        </div>

        <div className="div2">
          <h1>Pokedex Data</h1>

          <div className="field">
            <p className="label">National #:</p>
            <p className="value">{pokemon.national_number}</p>
          </div>

          <div className="field">
            <p className="label">Name:</p>
            <p className="value">{pokemon.name}</p>
          </div>

          <div className="field">
            <p className="label">Type:</p>
            <p className="value">{typeLabel}</p>
          </div>

          <div className="field">
            <p className="label">Height:</p>
            <p className="value">{pokemon.height}</p>
          </div>

          <div className="field">
            <p className="label">Weight:</p>
            <p className="value">{pokemon.weight}</p>
          </div>
        </div>

      </div>

      <div className="description">
        <div className="description_buttons_container">
          <button
            className="description_buttons"
            onClick={() => onNavigate(-1)}
            disabled={currentIndex === 0}
          >
            Back
          </button>
          <button
            className="description_buttons"
            onClick={() => onNavigate(1)}
            disabled={currentIndex === pokedex.length - 1}
          >
            Next
          </button>
        </div>
      </div>

    </section>
  );
}

export default PokeScroll;
