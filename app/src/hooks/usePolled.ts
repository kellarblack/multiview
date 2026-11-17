import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/** Fetch once, then refresh on an interval while the tab is visible. */
export function usePolled<T>(
  load: (signal: AbortSignal) => Promise<T>,
  initial: T,
  intervalMs: number,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: initial, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    const run = async () => {
      try {
        const data = await load(controller.signal);
        setState({ data, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          data: prev.data,
          loading: false,
          error: error instanceof Error ? error.message : 'failed',
        }));
      }
    };

    void run();
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void run();
    }, intervalMs);

    return () => {
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
    // load is a module function in every caller, so it is stable by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return state;
}
