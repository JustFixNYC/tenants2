import React from 'react';
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient from "../graphql-client";
import { createTestGraphQlClient, FakeAppContext } from "./util";
import { MemoryRouter } from "react-router";
import { AppContext } from "../app-context";

/** Options for rtlPalWithContexts(). */
interface RtlPalWithContextsOptions {
  /** The URL to initially set the router context to. */
  url: string;
};

/** The return value of rtlPalWithContexts(). */
interface RtlPalWithContextsResult {
  /**
   * The ReactTestingLibraryPal that encapsulates your passed-in JSX, wrapped
   * in common contexts.
   */
  pal: ReactTestingLibraryPal,

  /**
   * A mock GraphQL client with which you can respond to any requests.
   */
  client: GraphQlClient
}

export declare namespace rtlPalWithContexts {
  /**
   * Cleanup the ReactTestingLibraryPal. This should always be called
   * via afterEach() for any tests that call rtlPalWithContexts().
   */
  export let cleanup: () => void;
}

/**
 * This creates a ReactTestingLibraryPal along with a number of common
 * React contexts.
 * 
 * When using it, be sure to add the following to your test suite:
 * 
 *   afterEach(rtlPalWithContexts.cleanup);
 */
export function rtlPalWithContexts(el: JSX.Element, options?: Partial<RtlPalWithContextsOptions>): RtlPalWithContextsResult {
  const o: RtlPalWithContextsOptions = {
    url: '/',
    ...options
  };
  const { client } = createTestGraphQlClient();
  const appContext = {
    ...FakeAppContext,
    fetch: client.fetch
  };

  const pal = ReactTestingLibraryPal.render(
    <MemoryRouter initialEntries={[o.url]} initialIndex={0}>
      <AppContext.Provider value={appContext}>
        {el}
      </AppContext.Provider>
    </MemoryRouter>
  );

  return { pal, client };
}

rtlPalWithContexts.cleanup = ReactTestingLibraryPal.cleanup;
