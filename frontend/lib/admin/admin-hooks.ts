import { useState, useEffect, useContext, useRef } from "react";
import { QueryLoaderQuery } from "../query-loader-prefetcher";
import { AppContext } from "../app-context";

/**
 * A React Hook to repeatedly call the given promise, waiting the
 * given number of milliseconds once it has returned to call
 * it again.
 */
export function useRepeatedPromise<T>(factory: () => Promise<T>, msInterval: number): T|undefined {
  const [value, setValue] = useState<T|undefined>(undefined);

  useEffect(() => {
    let isActive = true;
    let refreshTimeout: number|null = null;

    const refreshValue = async () => {
      refreshTimeout = null;
      try {
        const result = await factory();
        isActive && setValue(result);
      } finally {
        if (isActive) {
          refreshTimeout = window.setTimeout(refreshValue, msInterval);
        }
      }
    };

    // TODO: Do something if this throws?
    refreshValue();

    return () => {
      isActive = false;
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
    };
  }, [factory, msInterval]);

  return value;
}

type AdminFetchState<Output> = 
  {type: 'idle'} |
  {type: 'loading'} |
  {type: 'loaded', output: Output} |
  {type: 'errored', error: Error};

const FETCH_STATE_IDLE: AdminFetchState<any> = {type: 'idle'};

/**
 * Fetch the given GraphQL query, returning its current state.
 * 
 * Requests are re-initiated whenever the input or refresh token changes. If
 * the input is null or the refresh token is falsy, no request is performed.
 * 
 * This is intented to be used by admin code only; it doesn't support progressive
 * enhancement or server-side rendering in any way.
 */
export function useAdminFetch<Input, Output>(
  query: QueryLoaderQuery<Input, Output>,
  input: Input|null,
  refreshToken: any,
): AdminFetchState<Output> {
  const [state, setState] = useState<AdminFetchState<Output>>(FETCH_STATE_IDLE);
  const { fetch } = useContext(AppContext);

  useEffect(() => {
    if (input === null || !refreshToken) {
      setState(FETCH_STATE_IDLE);
      return;
    }
    let isActive = true;

    setState({type: 'loading'});
    query.fetch(fetch, input).then(output => {
      isActive && setState({type: 'loaded', output});
    }).catch(error => {
      isActive && setState({type: 'errored', error});
    });
    return () => {
      isActive = false;
    };
  }, [fetch, query, input, refreshToken]);

  return state;
};

/**
 * A React Hook to debounce the given value by the given number of milliseconds.
 * 
 * In other words, if the given value changes, the new value won't actually be
 * returned by this function until it has been "stable" for the given number
 * of milliseconds.
 */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    let timeout: number|null = null;

    if (value !== debouncedValue) {
      timeout = window.setTimeout(() => {
        timeout = null;
        setDebouncedValue(value);
      }, ms);
    }

    return () => {
      timeout !== null && clearTimeout(timeout);
    };
  }, [debouncedValue, ms, value]);

  return debouncedValue;
}

/**
 * A React Hook that returns what a value was the last time the
 * current functional component was called.
 * 
 * For more details, see:
 * 
 *   https://blog.logrocket.com/how-to-get-previous-props-state-with-react-hooks/
 */
export function usePrevious<T>(value: T): T|undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
