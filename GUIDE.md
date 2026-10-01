# Pokemon Gallery — Project Guide

A React-based Pokedex app featuring the first 15 Gen 1 Pokemon. Browse individual Pokemon stats on the Home page or view all of them in the Gallery.

---

## Project Structure

```
pokemon-gallery/
├── client/                     # React frontend (Vite)
│   ├── index.html              # Vite entry HTML
│   ├── vite.config.js          # Dev server on :3000, proxies /api to :5001
│   ├── package.json
│   ├── public/
│   │   └── pokemon_assets/     # Pokemon PNG images (served statically)
│   └── src/
│       ├── main.jsx            # React DOM entry point
│       ├── App.jsx             # Root router
│       ├── App.css             # Global container styles
│       ├── components/
│       │   ├── Nav.jsx         # Navigation bar
│       │   ├── PokeScroll.jsx  # Single-Pokemon carousel viewer
│       │   ├── SearchBar.jsx   # Search dropdown
│       │   ├── Grid.jsx        # Full gallery grid
│       │   └── *.css
│       ├── data/
│       │   └── data.js         # Hardcoded Pokemon dataset (15 entries)
│       └── pages/
│           ├── home.jsx        # Home page (PokeScroll)
│           └── gallery.jsx     # Gallery page (Grid)
├── server/                     # Express API
│   ├── server.js               # Entry point
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── routes/
│   │   └── notesRoutes.js
│   ├── .env                    # Environment variables (not committed)
│   ├── .env.example            # Template for required env vars
│   └── package.json
└── package.json                # Root scripts (runs client + server together)
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
npm run install:all
```

Installs dependencies for the root, `client/`, and `server/`.

### 2. Set Up Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your values:

```bash
cp server/.env.example server/.env
```

```.env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
PORT=5001
```

> The frontend runs entirely on local data, so the `.env` is only required if you plan to run the backend server.

### 3. Run the App

```bash
npm run dev
```

Starts both the Vite client at [http://localhost:3000](http://localhost:3000) and the Express server at [http://localhost:5001](http://localhost:5001). In development, requests from the client to `/api/*` are proxied to the server.

To run only one side:

```bash
npm run dev --prefix client   # frontend only (no database needed)
npm run dev --prefix server   # backend only (nodemon)
```

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
Run from the project root:

| Command | Description |
|---|---|
| `npm run install:all` | Install root, client, and server dependencies |
| `npm run dev` | Start client (port 3000) and server (port 5001) together |
| `npm run build` | Build the client for production (`client/dist/`) |
| `npm start` | Start the Express server with plain `node` |

---

## Adding More Pokemon

Edit [client/src/data/data.js](client/src/data/data.js) and add a new entry following the existing format:

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

Then place the corresponding PNG in `client/public/pokemon_assets/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite |
| Backend | Express 4, Mongoose 7 |
| Database | MongoDB |
| Styling | Plain CSS |
