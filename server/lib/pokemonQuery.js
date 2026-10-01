// Turns GET /api/pokemon query parameters into a validated MongoDB query.
// Invalid input throws BadRequest (400) naming the parameter.

export const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

export const REGIONS = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Paldea"];

export const STAGES = [
  { key: "basic", value: 0, label: "Basic" },
  { key: "stage-1", value: 1, label: "Stage 1" },
  { key: "stage-2", value: 2, label: "Stage 2" },
];

const SORTS = {
  number: { field: "id" },
  name: { field: "name" },
  height: { field: "height_in" },
  weight: { field: "weight_lb" },
};

export const DEFAULT_LIMIT = 36;
export const MAX_LIMIT = 48;
const MAX_QUERY_LENGTH = 50;

export class BadRequest extends Error {
  constructor(param, message) {
    super(message);
    this.status = 400;
    this.param = param;
  }
}

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ?type=fire&type=water and ?type=fire,water both give ["fire", "water"]
function listParam(query, name) {
  const raw = query[name];
  if (raw === undefined) return [];
  const values = (Array.isArray(raw) ? raw : [raw]).flatMap((v) => String(v).split(","));
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function singleParam(query, name) {
  const raw = query[name];
  if (raw === undefined || raw === "") return undefined;
  if (Array.isArray(raw)) throw new BadRequest(name, `"${name}" can only be given once.`);
  return String(raw).trim();
}

function numberParam(query, name, { integer = false } = {}) {
  const raw = singleParam(query, name);
  if (raw === undefined) return undefined;
  const pattern = integer ? /^\d+$/ : /^\d+(\.\d+)?$/;
  if (!pattern.test(raw)) {
    throw new BadRequest(name, `"${name}" must be a ${integer ? "whole" : "non-negative"} number.`);
  }
  return Number(raw);
}

// Matches a value against an allowed list, ignoring case.
function oneOf(name, value, allowed) {
  const match = allowed.find((a) => a.toLowerCase() === value.toLowerCase());
  if (!match) throw new BadRequest(name, `Unknown ${name} "${value}". Use one of: ${allowed.join(", ")}.`);
  return match;
}

function rangeParams(query, prefix) {
  const min = numberParam(query, `${prefix}_min`);
  const max = numberParam(query, `${prefix}_max`);
  if (min !== undefined && max !== undefined && min > max) {
    throw new BadRequest(`${prefix}_min`, `"${prefix}_min" can't be greater than "${prefix}_max".`);
  }
  return { min, max };
}

export function parseListQuery(query) {
  const q = singleParam(query, "q") ?? "";
  if (q.length > MAX_QUERY_LENGTH) throw new BadRequest("q", `"q" can be at most ${MAX_QUERY_LENGTH} characters.`);

  const match = singleParam(query, "match") ?? "any";
  if (!["any", "all"].includes(match)) throw new BadRequest("match", `"match" must be "any" or "all".`);

  const sort = singleParam(query, "sort") ?? "number";
  if (!SORTS[sort]) throw new BadRequest("sort", `"sort" must be one of: ${Object.keys(SORTS).join(", ")}.`);

  const order = singleParam(query, "order") ?? "asc";
  if (!["asc", "desc"].includes(order)) throw new BadRequest("order", `"order" must be "asc" or "desc".`);

  const group = singleParam(query, "group");
  if (group !== undefined && group !== "family") throw new BadRequest("group", `"group" can only be "family".`);

  const generations = listParam(query, "generation").map((g) => {
    if (!/^\d+$/.test(g) || Number(g) < 1 || Number(g) > REGIONS.length) {
      throw new BadRequest("generation", `"generation" must be a number from 1 to ${REGIONS.length}.`);
    }
    return Number(g);
  });

  const stages = listParam(query, "stage").map((s) => {
    const stage = STAGES.find((st) => st.key === s.toLowerCase() || String(st.value) === s);
    if (!stage) throw new BadRequest("stage", `Unknown stage "${s}". Use basic, stage-1 or stage-2.`);
    return stage.value;
  });

  // page and limit are clamped rather than rejected, once they are numbers.
  const page = Math.max(1, numberParam(query, "page", { integer: true }) ?? 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, numberParam(query, "limit", { integer: true }) ?? DEFAULT_LIMIT));

  return {
    q,
    types: listParam(query, "type").map((t) => oneOf("type", t, TYPES)),
    match,
    regions: listParam(query, "region").map((r) => oneOf("region", r, REGIONS)),
    generations,
    stages,
    height: rangeParams(query, "height"),
    weight: rangeParams(query, "weight"),
    sort,
    order,
    group: group === "family",
    page,
    limit,
  };
}

const range = ({ min, max }) => {
  const r = {};
  if (min !== undefined) r.$gte = min;
  if (max !== undefined) r.$lte = max;
  return Object.keys(r).length ? r : undefined;
};

export function buildFilter(p) {
  const and = [];

  if (p.q) {
    const text = escapeRegex(p.q);
    const or = [{ name: { $regex: text, $options: "i" } }];
    // Numbers match the exact id or the start of the Pokedex number,
    // so "25" finds #025 and #250-#259.
    if (/^\d+$/.test(p.q)) or.push({ id: Number(p.q) }, { national_number: { $regex: `^${text}` } });
    and.push({ $or: or });
  }

  if (p.types.length) {
    if (p.match === "all") {
      for (const t of p.types) and.push({ $or: [{ type: t }, { type_2: t }] });
    } else {
      and.push({ $or: [{ type: { $in: p.types } }, { type_2: { $in: p.types } }] });
    }
  }

  if (p.regions.length) and.push({ region: { $in: p.regions } });
  if (p.generations.length) and.push({ generation: { $in: p.generations } });
  if (p.stages.length) and.push({ evolution_stage: { $in: p.stages } });

  const height = range(p.height);
  if (height) and.push({ height_in: height });
  const weight = range(p.weight);
  if (weight) and.push({ weight_lb: weight });

  return and.length ? { $and: and } : {};
}

// Names sort case-insensitively.
export const COLLATION = { locale: "en", strength: 2 };

export function buildSort(p) {
  const dir = p.order === "desc" ? -1 : 1;
  const { field } = SORTS[p.sort];
  return field === "id" ? { id: dir } : { [field]: dir, id: 1 };
}

// Aggregation that keeps each evolution family together. Families are ordered
// by their first member under the chosen sort; members by stage within each.
export function familyPipeline(p, filter, skip) {
  const dir = p.order === "desc" ? -1 : 1;
  const { field } = SORTS[p.sort];
  return [
    { $match: filter },
    {
      $setWindowFields: {
        partitionBy: "$evolution_family",
        output: { _family_key: { [dir === 1 ? "$min" : "$max"]: `$${field}` } },
      },
    },
    { $sort: { _family_key: dir, evolution_family: 1, evolution_stage: 1, id: 1 } },
    { $skip: skip },
    { $limit: p.limit },
    { $project: { _id: 0, _family_key: 0 } },
  ];
}
