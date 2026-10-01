import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listPokemon } from '../api/pokemonApi';
import {
  parseFilters, toSearchParams, toApiParams, activeChips, removeChip,
  clearFilters, relaxations, groupConsecutive,
} from '../data/filters';
import useApi from './useApi';
import useDebouncedValue from './useDebouncedValue';
import { usePokemonList, usePokemonMeta } from './usePokemon';

// Gallery filter state lives in the URL, so views can be bookmarked and Back
// steps through changes. This hook only reads and writes that state.
export function useGalleryState() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseFilters(params), [params]);

  // Any change other than paging returns to page 1. Typing in search
  // replaces the history entry; other changes push one.
  const update = (patch, { replace = false } = {}) =>
    setParams(toSearchParams({ ...state, page: 1, ...patch }), { replace });

  return {
    state,
    update,
    apply: (next) => setParams(toSearchParams(next)),
    remove: (chip) => setParams(toSearchParams(removeChip(state, chip))),
    clearAll: () => setParams(toSearchParams(clearFilters(state))),
  };
}

// The Gallery page: URL state plus the server's results for it.
export default function useGalleryFilters() {
  const gallery = useGalleryState();
  const meta = usePokemonMeta();

  // Types and generations from a hand-edited URL that the data doesn't have
  // are dropped, so they never reach the server as a bad request.
  const known = meta.data;
  const state = known
    ? {
        ...gallery.state,
        types: gallery.state.types.filter(t => known.types.some(k => k.toLowerCase() === t)),
        generations: gallery.state.generations.filter(g => known.generations.includes(g)),
      }
    : gallery.state;

  // Searches wait until typing pauses; other filters apply at once. The list
  // waits for the filter options (cached after the first visit).
  const settledQ = useDebouncedValue(state.q, 300);
  const apiParams = toApiParams({ ...state, q: settledQ });
  const list = usePokemonList(apiParams, { enabled: !!known || !!meta.error });

  const chips = activeChips(state, meta.data);
  const isEmpty = list.data?.total === 0 && !list.loading && chips.length > 0;

  // When nothing matches, ask the server what each single change would give.
  const fixes = relaxations({ ...state, q: settledQ }, chips);
  const suggestions = useApi(
    signal => Promise.all(fixes.map(fix =>
      listPokemon({ ...toApiParams(fix.state), limit: 1 }, { signal })
        .then(r => ({ ...fix, count: r.total })),
    )).then(all => all.filter(f => f.count > 0).sort((a, b) => b.count - a.count)),
    JSON.stringify(apiParams),
    { enabled: isEmpty },
  );

  return {
    ...gallery,
    state,
    meta,
    list,
    chips,
    searching: state.q !== settledQ,
    groups: state.group && list.data ? groupConsecutive(list.data.items) : null,
    suggestions,
  };
}
