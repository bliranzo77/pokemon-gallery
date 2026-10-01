// The only place the client talks to the server. Every failure becomes an
// ApiError with a `kind` the UI can turn into a helpful message.

export class ApiError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind; // 'network' | 'database' | 'not-found' | 'bad-request' | 'server'
    this.status = status;
  }
}

const NETWORK_MESSAGE = "Couldn't reach the server. Is it running? Start both apps with npm run dev, then try again.";

// { type: ['fire', 'water'], q: '' } -> "?type=fire&type=water"
function toQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== undefined && v !== null && v !== '') search.append(key, String(v));
    }
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function request(path, { params, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}${toQuery(params)}`, { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('network', NETWORK_MESSAGE);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON: the dev proxy answers with its own error page when the API is down.
  }

  if (response.ok && body) return body;
  if (!body) throw new ApiError('network', NETWORK_MESSAGE, response.status);
  const message = body.error ?? 'Something went wrong on the server.';
  if (response.status === 503) throw new ApiError('database', message, 503);
  if (response.status === 404) throw new ApiError('not-found', message, 404);
  if (response.status === 400) throw new ApiError('bad-request', message, 400);
  throw new ApiError('server', message, response.status);
}

// GET /api/pokemon -> { items, total, page, pages }
export const listPokemon = (params, options) => request('/pokemon', { ...options, params });

// GET /api/pokemon/:idOrSlug -> { pokemon, prev, next, family }
export const getPokemon = (idOrSlug, options) =>
  request(`/pokemon/${encodeURIComponent(idOrSlug)}`, options);

// GET /api/pokemon/meta -> { total, types, regions, generations, stages, ranges }
export const getMeta = (options) => request('/pokemon/meta', options);
