import "./config/env.js";
import express from "express";
import { connectDB, isDbConnected, redact } from "./config/db.js";
import pokemonRoutes from "./routes/pokemon.js";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: isDbConnected() ? "connected" : "disconnected" });
});

// Data routes answer 503 while the database is unavailable, instead of
// hanging until Mongoose gives up.
app.use("/api/pokemon", (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "The server is running but can't reach the database." });
  }
  next();
}, pokemonRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}.` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status === 400) return res.status(400).json({ error: err.message, param: err.param });
  console.error(redact(err.stack || err.message));
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// The API stays up without a database; /api/health reports the state.
connectDB();
