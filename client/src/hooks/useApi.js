import { useEffect, useState } from 'react';

// Runs `load(signal)` whenever `key` changes and tracks its result.
// The previous data stays available while the next request loads, so views
// can keep showing it instead of flashing empty. `loading` is true from the
// very render in which the key changes, so stale data is never mistaken for
// the new result.
export default function useApi(load, key, { enabled = true } = {}) {
  const [state, setState] = useState({ key: null, data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}#${attempt}`;

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    load(controller.signal).then(
      data => { if (!controller.signal.aborted) setState({ key: requestKey, data, error: null }); },
      error => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          setState(s => ({ key: requestKey, data: s.data, error }));
        }
      },
    );
    return () => controller.abort();
    // `load` is recreated every render; `requestKey` says when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, enabled]);

  if (!enabled) return { data: null, error: null, loading: false, retry: () => {} };
  const current = state.key === requestKey;
  return {
    data: state.data,
    error: current ? state.error : null,
    loading: !current,
    retry: () => setAttempt(n => n + 1),
  };
}
