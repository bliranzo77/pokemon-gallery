# Pokemon Gallery — Project Guide

**Pokémon Data Explorer**: all 1,025 Pokémon (Generations 1–9), stored in MongoDB, served by an Express API and browsed in a React client. For first-time setup (Atlas, `.env`, seeding) see the [README](README.md).

---

## Project Structure

```
pokemon-gallery/
├── client/                         # React frontend (Vite, port 3000)
│   ├── vite.config.js              # Proxies /api to the server on :5001
│   ├── scripts/
│   │   └── art_bounds.py           # Measures artwork outlines -> src/data/artBounds.json
│   ├── public/
│   │   └── pokemon_assets/         # 1,025 PNG artworks, served as static files
│   └── src/
│       ├── api/
│       │   └── pokemonApi.js       # The only module that calls the API
│       ├── hooks/
│       │   ├── useApi.js           # Request lifecycle: loading, error, retry, abort
│       │   ├── usePokemon.js       # usePokemon, usePokemonList, usePokemonMeta, usePokemonSearch
│       │   ├── useGalleryFilters.js# Gallery state in the URL, plus its results
│       │   └── useDebouncedValue.js
│       ├── data/
│       │   ├── filters.js          # Gallery URL state <-> API parameters, chip labels
│       │   ├── compare.js          # Comparison rules: stats, size, matchups, evolution
│       │   ├── typeChart.js        # Type effectiveness chart, all 18 types
│       │   ├── measure.js          # Formatting, to-scale sizing, adaptive rulers
│       │   └── artBounds.json      # Visible outline of each artwork (generated)
│       ├── components/
│       │   ├── Nav.jsx             # Site header: brand, links, search
│       │   ├── SearchBar.jsx       # Header search (API search, or Gallery filter)
│       │   ├── PokeScroll.jsx      # One entry drawn against a height ruler
│       │   ├── Grid.jsx            # Gallery: cards, sort, chips, pagination, mobile sheet
│       │   ├── FilterPanel.jsx     # Filter controls (sidebar and mobile sheet)
│       │   ├── Compare.jsx         # Compare page
│       │   ├── PokemonPicker.jsx   # Search-as-you-type combobox used by Compare
│       │   ├── StatusMessage.jsx   # Loading, empty and error messages
│       │   ├── TypePill.jsx        # Type label coloured by type
│       │   └── *.css
│       └── pages/                  # home.jsx (Entries), gallery.jsx, compare.jsx
├── server/                         # Express API (port 5001)
│   ├── server.js                   # Entry point: routes, health check, error handling
│   ├── config/
│   │   ├── env.js                  # Loads server/.env
│   │   └── db.js                   # Connects to the "pokedex" database
│   ├── models/
│   │   └── Pokemon.js              # Mongoose model, bound to the "pokemon" collection
│   ├── lib/
│   │   └── pokemonQuery.js         # Validates list parameters, builds the Mongo query
│   ├── routes/
│   │   └── pokemon.js              # /api/pokemon routes
│   ├── seed/
│   │   ├── pokemon.data.js         # Source data: all 1,025 Pokémon
│   │   └── seed.js                 # npm run seed
│   ├── .env                        # MONGO_URI and PORT (not committed)
│   └── .env.example
└── package.json                    # Root scripts
```

---

## Scripts

Run from the project root:

| Command | Description |
|---|---|
| `npm run install:all` | Install root, client and server dependencies |
| `npm run seed` | Load `server/seed/pokemon.data.js` into the `pokemon` collection (safe to re-run) |
| `npm run dev` | Start the API (port 5001) and the client (port 3000) together |
| `npm run build` | Build the client for production (`client/dist/`) |
| `npm start` | Start the API with plain `node` |

---

## API

All responses are JSON. Documents never include Mongo's `_id` or `__v`.

### `GET /api/health`

`{ "status": "ok", "database": "connected" }`, or `"disconnected"` when the server can't reach MongoDB. While disconnected, the `/api/pokemon` routes answer **503** rather than hanging.

### `GET /api/pokemon`

A filtered, sorted page of Pokémon: `{ items, total, page, pages }`.

| Parameter | Example | Notes |
|---|---|---|
| `q` | `char`, `25` | Name contains (case-insensitive); a number also matches the exact id or the start of the Pokédex number. Max 50 characters |
| `type` | `type=fire&type=flying` | Repeat or comma-separate. Any of the 18 types |
| `match` | `any` (default), `all` | With several types: any of them, or all of them |
| `region` | `kanto` | Repeatable |
| `generation` | `9` | Repeatable, 1–9 |
| `stage` | `basic`, `stage-1`, `stage-2` | Repeatable |
| `height_min`, `height_max` | `85` | Inches |
| `weight_min`, `weight_max` | `19.9` | Pounds |
| `sort` | `number` (default), `name`, `height`, `weight` | |
| `order` | `asc` (default), `desc` | |
| `group` | `family` | Keeps each evolution family together, ordered by its first member under the chosen sort |
| `page` | `2` | Clamped to 1…`pages` |
| `limit` | `36` (default) | Clamped to 1–48 |

Invalid values return **400** with `{ error, param }`, for example `Unknown type "fyre"` or `"height_min" can't be greater than "height_max"`.

### `GET /api/pokemon/:idOrSlug`

One Pokémon by number (`6`) or slug (`charizard`, `mr-mime`):
`{ pokemon, prev, next, family }`. `prev` and `next` are the neighbouring numbers (`null` at either end); `family` is every member of its evolution family. Unknown Pokémon return **404**.

### `GET /api/pokemon/meta`

Option lists for the filter UI: `{ total, types, regions: [{ name, generation, count }], generations, stages, ranges }`. Cached in memory once the collection has data.

---

## Pages

### Entries (`/`)
- One Pokémon at a time, drawn to its real height against a ruler that re-scales to fit it (1 ft ticks for small Pokémon, up to 10 ft ticks for Eternatus)
- Step through with **Previous** / **Next** or the left and right arrow keys; the neighbours come from the API
- The open entry is in the URL, e.g. `#/?no=006`

### Gallery (`/gallery`)
- 36 cards per page, filtered, sorted and searched on the server
- Filters: **Type** (match any or all), **Region**, **Evolution stage**, **Height** and **Weight** presets. Type and region lists come from `/api/pokemon/meta`
- The header search filters the grid once typing pauses (300 ms)
- Filter state and page live in the URL, e.g. `#/gallery?type=fire&type=flying&match=all&sort=weight&dir=desc&page=2`
- When nothing matches, the page asks the server which single change would bring results back

### Compare (`/compare`)
- Pick two Pokémon with search-as-you-type pickers; **Swap** trades sides; the Pokémon in one slot can't be chosen for the other
- The pair lives in the URL, e.g. `#/compare?a=6&b=1007`; with no valid pair it opens on Bulbasaur vs Charmander
- Each entry page has a **Compare** link that opens this page with that Pokémon in the first slot

---

## Adding or Changing Pokémon

1. Edit [server/seed/pokemon.data.js](server/seed/pokemon.data.js). Each entry looks like this:

   ```js
   {
     id: 16,
     national_number: "016",
     name: "Pidgey",
     type: "Normal",
     type_2: "Flying",            // omit for single-type Pokémon
     height_in: 12,               // height in inches (1'00" -> 12)
     weight_lb: 4.0,              // weight in pounds
     region: "Kanto",
     generation: 1,
     evolution_stage: 0,          // 0 = Basic, 1 = Stage 1, 2 = Stage 2 (babies count as Basic)
     evolution_family: "Pidgey",  // name of the family's Basic Pokémon
     base_stats: { hp: 40, attack: 45, defense: 40, sp_attack: 35, sp_defense: 35, speed: 56 },
     photo: "/pokemon_assets/pidgey.png"
   }
   ```

   The server adds `slug` (`"pidgey"`) from the photo filename.

2. Put the artwork in `client/public/pokemon_assets/` (a square PNG with a transparent background).
3. Measure its outline so it stands on the floor line: `python client/scripts/art_bounds.py` (needs Pillow).
4. Run `npm run seed`. Only new or changed entries are written.

Type and region lists update on their own. To add a new region, also add it to `REGIONS` in `server/lib/pokemonQuery.js`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite |
| Backend | Express 4, Mongoose 7 |
| Database | MongoDB Atlas |
| Styling | Plain CSS, Archivo (Google Fonts) |
