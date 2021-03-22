import { useState, useEffect, useContext } from "react";
import { QueryLoaderQuery } from "../networking/query-loader-prefetcher";
import { AppContext } from "../app-context";

/**
 * A React Hook to repeatedly call a function and wait for its returned
 * promise to complete, waiting the given number of milliseconds once
 * it has returned to call the function again. The Hook's return value is
 * the result of the most recent *successful* completion of the promise.
 *
 * NOTE: The promise is expected to succeed, and any exception
 * it throws goes uncaught.
 */
export function useRepeatedPromise<T>(
  factory: () => Promise<T>,
  msInterval: number
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    let isActive = true;
    let refreshTimeout: number | null = null;

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
  | { type: "idle" }
  | { type: "loading" }
  | { type: "loaded"; output: Output }
  | { type: "errored"; error: Error };

const FETCH_STATE_IDLE: AdminFetchState<any> = { type: "idle" };

/**
 * Fetch the given GraphQL query, returning its current state.
 *
 * Requests are re-initiated whenever the input or refresh token changes. If
 * the input is null or the refresh token is falsy, no request is performed.
 *
 * Note that if the input is an object, `useMemo` should be used to ensure
 * that it's the same object that's passed in over multiple renders, or else
 * requests will be re-initiated a lot more often than you expect!
 *
 * This is intented to be used by admin code only; it doesn't support progressive
 * enhancement or server-side rendering in any way.
 */
export function useAdminFetch<Input, Output>(
  query: QueryLoaderQuery<Input, Output>,
  input: Input | null,
  refreshToken: any
): AdminFetchState<Output> {
  const [state, setState] = useState<AdminFetchState<Output>>(FETCH_STATE_IDLE);
  const { fetch } = useContext(AppContext);

  useEffect(() => {
    if (input === null || !refreshToken) {
      setState(FETCH_STATE_IDLE);
      return;
    }
    let isActive = true;

    setState({ type: "loading" });
    query
      .fetch(fetch, input)
      .then((output) => {
        isActive && setState({ type: "loaded", output });
      })
      .catch((error) => {
        isActive && setState({ type: "errored", error });
      });
    return () => {
      isActive = false;
    };
  }, [fetch, query, input, refreshToken]);

  return state;
}
