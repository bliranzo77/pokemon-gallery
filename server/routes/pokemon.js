import express from "express";
import Pokemon, { PUBLIC_FIELDS } from "../models/Pokemon.js";
import {
  parseListQuery, buildFilter, buildSort, familyPipeline, COLLATION,
  BadRequest, TYPES, STAGES,
} from "../lib/pokemonQuery.js";

const router = express.Router();

// Passes errors from async handlers to the error middleware.
const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/pokemon — filtered, sorted, paged list for the Gallery
router.get("/", handle(async (req, res) => {
  const p = parseListQuery(req.query);
  const filter = buildFilter(p);
  const total = await Pokemon.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / p.limit));
  const page = Math.min(p.page, pages);
  const skip = (page - 1) * p.limit;

  const items = p.group
    ? await Pokemon.aggregate(familyPipeline(p, filter, skip)).collation(COLLATION)
    : await Pokemon.find(filter, PUBLIC_FIELDS).sort(buildSort(p)).collation(COLLATION)
        .skip(skip).limit(p.limit).lean();

  res.json({ items, total, page, pages });
}));

// GET /api/pokemon/meta — option lists for the filter UI
let metaCache = null;
router.get("/meta", handle(async (req, res) => {
  if (!metaCache) {
    const [primary, secondary, regionRows, [ranges], total] = await Promise.all([
      Pokemon.distinct("type"),
      Pokemon.distinct("type_2"),
      Pokemon.aggregate([
        { $group: { _id: "$region", generation: { $min: "$generation" }, count: { $sum: 1 } } },
        { $sort: { generation: 1 } },
      ]),
      Pokemon.aggregate([{
        $group: {
          _id: null,
          height_min: { $min: "$height_in" }, height_max: { $max: "$height_in" },
          weight_min: { $min: "$weight_lb" }, weight_max: { $max: "$weight_lb" },
        },
      }]),
      Pokemon.countDocuments(),
    ]);
    const present = new Set([...primary, ...secondary]);
    metaCache = {
      total,
      // Canonical game order, limited to types present in the data
      types: TYPES.filter((t) => present.has(t)),
      regions: regionRows.map((r) => ({ name: r._id, generation: r.generation, count: r.count })),
      generations: [...new Set(regionRows.map((r) => r.generation))].sort((a, b) => a - b),
      stages: STAGES,
      ranges: ranges
        ? {
            height_in: { min: ranges.height_min, max: ranges.height_max },
            weight_lb: { min: ranges.weight_min, max: ranges.weight_max },
          }
        : null,
    };
    // An empty collection isn't cached, so seeding later shows up at once.
    if (!total) {
      const empty = metaCache;
      metaCache = null;
      return res.json(empty);
    }
  }
  res.json(metaCache);
}));

// GET /api/pokemon/:idOrSlug — one Pokemon, its neighbours and its family
router.get("/:idOrSlug", handle(async (req, res) => {
  const key = req.params.idOrSlug.toLowerCase();
  let query;
  if (/^\d+$/.test(key)) query = { id: Number(key) };
  else if (/^[a-z0-9-]{1,60}$/.test(key)) query = { slug: key };
  else throw new BadRequest("idOrSlug", "Use a Pokédex number (like 25) or a name slug (like pikachu).");

  const pokemon = await Pokemon.findOne(query, PUBLIC_FIELDS).lean();
  if (!pokemon) {
    return res.status(404).json({ error: `No Pokémon found for "${req.params.idOrSlug}".` });
  }

  const neighbour = (filter, sort) =>
    Pokemon.findOne(filter, { _id: 0, id: 1, national_number: 1, name: 1, slug: 1, photo: 1 }).sort(sort).lean();
  const [prev, next, family] = await Promise.all([
    neighbour({ id: { $lt: pokemon.id } }, { id: -1 }),
    neighbour({ id: { $gt: pokemon.id } }, { id: 1 }),
    Pokemon.find({ evolution_family: pokemon.evolution_family }, PUBLIC_FIELDS)
      .sort({ evolution_stage: 1, id: 1 }).lean(),
  ]);

  res.json({ pokemon, prev, next, family });
}));

export default router;
