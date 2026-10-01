// Seeds the "pokemon" collection from pokemon.data.js.
// Upserts by id, so running it again is safe. Run with `npm run seed`.
import "../config/env.js";
import mongoose from "mongoose";
import { connectDB, redact } from "../config/db.js";
import Pokemon, { slugFromPhoto } from "../models/Pokemon.js";
import pokedex from "./pokemon.data.js";

async function seed() {
  if (!(await connectDB())) return 1;

  const docs = pokedex.map((p) => ({ ...p, slug: slugFromPhoto(p.photo) }));

  // Check every entry against the schema before writing anything.
  const invalid = docs
    .map((d) => [d, new Pokemon(d).validateSync()])
    .filter(([, error]) => error);
  if (invalid.length) {
    for (const [d, error] of invalid.slice(0, 10)) console.error(`#${d.id} ${d.name}: ${error.message}`);
    console.error(`${invalid.length} entries failed validation. Nothing was written.`);
    return 1;
  }

  await Pokemon.syncIndexes();

  // Compare with what's stored and write only new or changed entries.
  // (This cluster reports every replace as a modification, even when the
  // document is identical, so its own counts can't tell the difference.)
  const stable = (value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`
      : JSON.stringify(value);
  const stored = new Map(
    (await Pokemon.collection.find({}, { projection: { _id: 0 } }).toArray()).map((d) => [d.id, stable(d)])
  );
  const changed = docs.filter((d) => stored.get(d.id) !== stable(d));

  // replaceOne (not updateOne) so fields removed from the data, such as a
  // dropped second type, are removed from the document too. Entries were
  // validated above, so the plain documents go straight to the driver.
  if (changed.length) {
    await Pokemon.collection.bulkWrite(
      changed.map((d) => ({ replaceOne: { filter: { id: d.id }, replacement: d, upsert: true } })),
      { ordered: false }
    );
  }

  const inserted = changed.filter((d) => !stored.has(d.id)).length;
  const updated = changed.length - inserted;
  const unchanged = docs.length - changed.length;
  const total = await Pokemon.countDocuments();
  console.log(`Seeded "pokemon": ${inserted} inserted, ${updated} updated, ${unchanged} unchanged. Collection now holds ${total} documents.`);
  return 0;
}

seed()
  .then((code) => { process.exitCode = code; })
  .catch((err) => {
    console.error("Seed failed:", redact(err.message));
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
