import React from 'react';
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient from "../graphql-client";
import { createTestGraphQlClient, FakeAppContext } from "./util";
import { MemoryRouter } from "react-router";
import { AppContext } from "../app-context";

/** Options for AppTester. */
interface AppTesterOptions {
  /** The URL to initially set the router context to. */
  url: string;
};

/**
 * This encapsulates a ReactTestingLibraryPal along with a number of common
 * React contexts.
 * 
 * When using it, be sure to add the following to your test suite:
 *
 *   afterEach(AppTester.cleanup);
 */
export class AppTester {
  /**
   * The ReactTestingLibraryPal that encapsulates your passed-in JSX, wrapped
   * in common contexts.
   */
  readonly pal: ReactTestingLibraryPal;

  /**
   * A mock GraphQL client with which you can respond to any requests.
   */
  readonly client: GraphQlClient;

  constructor(el: JSX.Element, options?: Partial<AppTesterOptions>) {
    const o: AppTesterOptions = {
      url: '/',
      ...options
    };
    const { client } = createTestGraphQlClient();
    const appContext = {
      ...FakeAppContext,
      fetch: client.fetch
    };
  
    this.client = client;
    this.pal = ReactTestingLibraryPal.render(
      <MemoryRouter initialEntries={[o.url]} initialIndex={0}>
        <AppContext.Provider value={appContext}>
          {el}
        </AppContext.Provider>
      </MemoryRouter>
    );  
  }

  /**
   * Cleanup any used resources. This should always be called
   * via afterEach() for any tests that use this class.
   */
  static cleanup() {
    ReactTestingLibraryPal.cleanup();
  }
}
