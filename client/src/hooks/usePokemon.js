import useApi from './useApi';
import { getPokemon, getMeta, listPokemon } from '../api/pokemonApi';
import useDebouncedValue from './useDebouncedValue';

// One Pokemon by number or slug: { pokemon, prev, next, family }.
export function usePokemon(idOrSlug) {
  return useApi(
    signal => getPokemon(idOrSlug, { signal }),
    String(idOrSlug),
    { enabled: idOrSlug !== null && idOrSlug !== undefined },
  );
}

// A filtered page of the list: { items, total, page, pages }.
export function usePokemonList(params, { enabled = true } = {}) {
  return useApi(signal => listPokemon(params, { signal }), JSON.stringify(params), { enabled });
}

// Option lists for filters. Fetched once and shared; a failure is retried
// the next time it's needed.
let metaRequest = null;
export function usePokemonMeta() {
  return useApi(() => {
    metaRequest ??= getMeta().catch(err => { metaRequest = null; throw err; });
    return metaRequest;
  }, 'meta');
}

// Search-as-you-type for pickers and the header search. Pass null to pause.
// An empty query returns the first Pokemon by number.
export function usePokemonSearch(query, { limit = 10 } = {}) {
  const text = query?.trim() ?? null;
  const settled = useDebouncedValue(text, 250);
  const result = useApi(
    signal => listPokemon({ q: settled, limit }, { signal }),
    `${settled}|${limit}`,
    { enabled: settled !== null },
  );
  return { ...result, items: result.data?.items ?? [], pending: result.loading || settled !== text };
}
