# Pokemon Gallery — Project Guide

A React-based Pokedex app featuring the first 15 Gen 1 Pokemon. Browse individual Pokemon stats on the Home page or view all of them in the Gallery.

---

## Project Structure

```
pokemon-gallery/
├── public/
│   └── pokemon_assets/     # Pokemon PNG images (served statically)
├── server/
│   ├── server.js           # Express API server
│   └── db.js               # MongoDB connection
├── src/
│   ├── App.jsx             # Root router
│   ├── App.css             # Global container styles
│   ├── index.js            # React DOM entry point
│   ├── components/
│   │   ├── Nav.jsx         # Navigation bar
│   │   ├── Nav.css
│   │   ├── PokeScroll.jsx  # Single-Pokemon carousel viewer
│   │   ├── pokeScroll.css
│   │   ├── Grid.jsx        # Full gallery grid
│   │   └── grid.css
│   ├── data/
│   │   └── data.js         # Hardcoded Pokemon dataset (15 entries)
│   └── pages/
│       ├── home.jsx        # Home page (PokeScroll)
│       └── gallery.jsx     # Gallery page (Grid)
├── .env                    # Environment variables (not committed)
├── .env.example            # Template for required env vars
└── package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)
- A MongoDB instance (only needed if running the backend server)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```.env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
PORT=5001
```

> The frontend runs entirely on local data, so the `.env` is only required if you plan to run the backend server.

### 3. Run the Frontend (React)

```bash
npm start
```

Opens the app at [http://localhost:3000](http://localhost:3000).

### 4. Run the Backend Server (optional)

```bash
npm run dev
```

Starts the Express server at [http://localhost:5001](http://localhost:5001).

**Available endpoint:**
- `GET /api/health` — Returns `{ "status": "API running" }`

---

## Pages

### Home (`/`)
- Browse Pokemon one at a time using the **Back** and **Next** buttons
- Each card displays: Pokedex number, name, type(s), height, and weight
- Smooth fade transition between Pokemon

### Gallery (`/gallery`)
- Responsive grid showing all 15 Pokemon
- Hover over a card to see a lift effect

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the React dev server (port 3000) |
| `npm run build` | Build the React app for production |
| `npm run dev` | Start the Express backend (port 5001) |
| `npm test` | Run the test suite |

---

## Adding More Pokemon

Edit [src/data/data.js](src/data/data.js) and add a new entry following the existing format:

```js
{
  id: 16,
  national_number: "016",
  name: "Pidgey",
  type: "Normal",
  type_2: "Flying",       // omit this field if the Pokemon has only one type
  height: "1'00",
  weight: "4.0 lbs",
  photo: "/pokemon_assets/pidgey.png"
}
```

Then place the corresponding PNG in `public/pokemon_assets/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7 |
| Backend | Express 4, Mongoose 7 |
| Database | MongoDB |
| Styling | Plain CSS |
