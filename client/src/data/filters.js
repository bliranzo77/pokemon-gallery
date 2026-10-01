// Gallery filter state: what the URL holds (#/gallery?type=fire&sort=height),
// how it maps to GET /api/pokemon parameters, and how it reads as chips.
// Filtering itself happens on the server.

export const PAGE_SIZE = 36;

export const STAGES = [
  { key: 'basic', label: 'Basic', value: 0 },
  { key: 'stage-1', label: 'Stage 1', value: 1 },
  { key: 'stage-2', label: 'Stage 2', value: 2 },
];

// Single-choice presets; each maps to a min/max range in the API.
export const HEIGHT_RANGES = [
  { key: 'under-2ft', label: 'Under 2 ft', max: 23 },
  { key: '2-4ft', label: '2–4 ft', min: 24, max: 48 },
  { key: '4-7ft', label: '4–7 ft', min: 49, max: 84 },
  { key: 'over-7ft', label: 'Over 7 ft', min: 85 },
];

export const WEIGHT_RANGES = [
  { key: 'under-20lb', label: 'Under 20 lb', max: 19.9 },
  { key: '20-100lb', label: '20–100 lb', min: 20, max: 100 },
  { key: '100-500lb', label: '100–500 lb', min: 100.1, max: 500 },
  { key: 'over-500lb', label: 'Over 500 lb', min: 500.1 },
];

export const SORTS = [
  { key: 'number', label: 'Number', directions: ['First to last', 'Last to first'] },
  { key: 'name', label: 'Name', directions: ['A to Z', 'Z to A'] },
  { key: 'height', label: 'Height', directions: ['Shortest first', 'Tallest first'] },
  { key: 'weight', label: 'Weight', directions: ['Lightest first', 'Heaviest first'] },
];

export const DEFAULT_STATE = {
  q: '',
  types: [],
  match: 'any',
  generations: [],
  stages: [],
  height: '',
  weight: '',
  sort: 'number',
  dir: 'asc',
  group: false,
  page: 1,
};

const listOf = (params, name) =>
  [...new Set(params.getAll(name).flatMap(v => v.split(',')).map(v => v.trim().toLowerCase()).filter(Boolean))];

// Values that can't be valid are dropped rather than sent to the server.
export function parseFilters(params) {
  const page = Number(params.get('page'));
  return {
    ...DEFAULT_STATE,
    q: params.get('q') ?? '',
    types: listOf(params, 'type').filter(t => /^[a-z]+$/.test(t)),
    match: params.get('match') === 'all' ? 'all' : 'any',
    generations: listOf(params, 'generation').filter(g => /^\d{1,2}$/.test(g)).map(Number),
    stages: listOf(params, 'stage').filter(s => STAGES.some(st => st.key === s)),
    height: HEIGHT_RANGES.some(r => r.key === params.get('height')) ? params.get('height') : '',
    weight: WEIGHT_RANGES.some(r => r.key === params.get('weight')) ? params.get('weight') : '',
    sort: SORTS.some(s => s.key === params.get('sort')) ? params.get('sort') : 'number',
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
    group: params.get('group') === 'family',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

// Only non-default values are written, so the plain page keeps a clean URL.
export function toSearchParams(state) {
  const params = {};
  if (state.q.trim()) params.q = state.q;
  if (state.types.length) params.type = state.types;
  if (state.match === 'all' && state.types.length) params.match = 'all';
  if (state.generations.length) params.generation = state.generations.map(String);
  if (state.stages.length) params.stage = state.stages;
  if (state.height) params.height = state.height;
  if (state.weight) params.weight = state.weight;
  if (state.sort !== 'number') params.sort = state.sort;
  if (state.dir !== 'asc') params.dir = state.dir;
  if (state.group) params.group = 'family';
  if (state.page > 1) params.page = String(state.page);
  return params;
}

export function toApiParams(state, { limit = PAGE_SIZE } = {}) {
  const height = HEIGHT_RANGES.find(r => r.key === state.height);
  const weight = WEIGHT_RANGES.find(r => r.key === state.weight);
  return {
    q: state.q.trim() || undefined,
    type: state.types,
    match: state.types.length > 1 ? state.match : undefined,
    generation: state.generations,
    stage: state.stages,
    height_min: height?.min,
    height_max: height?.max,
    weight_min: weight?.min,
    weight_max: weight?.max,
    sort: state.sort,
    order: state.dir,
    group: state.group ? 'family' : undefined,
    page: state.page,
    limit,
  };
}

// Active filters as removable chips

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const labelOf = (options, key) => options.find(o => o.key === key)?.label ?? key;

export function activeChips(state, meta) {
  const regionOf = (g) => meta?.regions.find(r => r.generation === g)?.name;
  const chips = [];
  if (state.q.trim()) chips.push({ field: 'q', value: state.q, label: `Name or number contains “${state.q.trim()}”` });
  for (const t of state.types) chips.push({ field: 'types', value: t, label: `Type: ${capitalise(t)}` });
  for (const g of state.generations) {
    chips.push({ field: 'generations', value: g, label: regionOf(g) ? `Gen ${g}: ${regionOf(g)}` : `Gen ${g}` });
  }
  for (const s of state.stages) chips.push({ field: 'stages', value: s, label: `Evolution: ${labelOf(STAGES, s)}` });
  if (state.height) chips.push({ field: 'height', value: state.height, label: `Height ${labelOf(HEIGHT_RANGES, state.height).toLowerCase()}` });
  if (state.weight) chips.push({ field: 'weight', value: state.weight, label: `Weight ${labelOf(WEIGHT_RANGES, state.weight).toLowerCase()}` });
  return chips;
}

export function removeChip(state, chip) {
  const next = { ...state, page: 1 };
  if (Array.isArray(state[chip.field])) next[chip.field] = state[chip.field].filter(v => v !== chip.value);
  else next[chip.field] = '';
  return next;
}

export function clearFilters(state) {
  const { sort, dir, group } = state;
  return { ...DEFAULT_STATE, sort, dir, group };
}

// For an empty result: single changes worth trying. The caller asks the
// server how many results each would give.
export function relaxations(state, chips) {
  const fixes = chips.map(chip => ({ label: `Remove ${chip.label}`, state: removeChip(state, chip) }));
  if (state.match === 'all' && state.types.length > 1) {
    fixes.unshift({ label: 'Match any selected type instead of all', state: { ...state, match: 'any', page: 1 } });
  }
  return fixes;
}

// Splits a page of results into runs of the same evolution family. The
// server keeps families together when grouping is on.
export function groupConsecutive(items) {
  const groups = [];
  for (const p of items) {
    const last = groups.at(-1);
    if (last && last.family === p.evolution_family) last.members.push(p);
    else groups.push({ family: p.evolution_family, members: [p] });
  }
  return groups;
}
