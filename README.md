# Pokemon Gallery

**Pokémon Data Explorer**: browse, filter and compare all 1,025 Pokémon (Generations 1–9). The data lives in MongoDB and is served by an Express API; the React client draws every Pokémon to its real height.

---

## Features

- **Entries**: one Pokémon at a time, drawn against a ruler at its real height. Step through with Previous / Next or the arrow keys. Each entry has its own URL (`#/?no=006`)
- **Gallery**: card grid, filtered and sorted on the server. Filter by type (match any or all), region, evolution stage, height and weight; sort by number, name, height or weight; group by evolution family; 36 per page. Filters live in the URL (`#/gallery?type=fire&sort=height`), so views can be bookmarked and Back undoes a change
- **Compare**: pick two Pokémon (`#/compare?a=6&b=12`) to see mirrored base stat bars, both drawn to one scale, type matchups in plain language, and how their evolution families relate
- **Search**: on Entries and Compare, find a Pokémon by name or number as you type; on Gallery, narrow the grid alongside the filters

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite |
| Backend | Express 4, Mongoose 7 |
| Database | MongoDB Atlas |
| Styling | Plain CSS, Archivo (Google Fonts) |

---

## Setup

You need [Node.js](https://nodejs.org/) 18 or newer and a MongoDB Atlas account.

### 1. Create the database

1. In [MongoDB Atlas](https://cloud.mongodb.com/), create a cluster (the free tier is enough).
2. Under **Database Access**, add a database user with a password.
3. Under **Network Access**, allow your current IP address.
4. Click **Connect → Drivers** on the cluster and copy the connection string.

The app uses a database named `pokedex` and a collection named `pokemon`. The seed script creates both; you don't need to make them by hand.

### 2. Add the connection string

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and paste your connection string into `MONGO_URI`, with your user's password in place of `<password>`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
PORT=5001
```

`server/.env` is gitignored. Never commit it or paste the connection string anywhere public.

### 3. Install, seed and run

From the project root:

```bash
npm run install:all   # installs root, client and server dependencies
npm run seed          # loads all 1,025 Pokémon into MongoDB
npm run dev           # starts the API and the client together
```

Open [http://localhost:3000](http://localhost:3000). The client forwards `/api` requests to the Express API on port 5001.

`npm run seed` is safe to re-run: it updates entries by Pokédex number and reports how many were inserted, updated or unchanged.

### Troubleshooting

| You see | Check |
|---|---|
| "Couldn't reach the server. Is it running?" | Start both apps with `npm run dev` from the project root, not from `client/` |
| "The server is running but can't reach the database" | `MONGO_URI` in `server/.env`, and that your IP is allowed under Atlas **Network Access** |
| "No Pokémon in the database yet" | Run `npm run seed` |
| `GET /api/health` | Reports `{ "status": "ok", "database": "connected" }` when everything is up |

For the API reference, project structure and how to add Pokémon, see [GUIDE.md](GUIDE.md).

---

## Screenshots

<!-- Add screenshots here -->
