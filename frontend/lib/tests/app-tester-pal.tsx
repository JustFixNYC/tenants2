import React from 'react';
import * as rt from 'react-testing-library'
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient from "../graphql-client";
import { createTestGraphQlClient, FakeAppContext } from "./util";
import { MemoryRouter } from "react-router";
import { AppContext } from "../app-context";
import { WithServerFormFieldErrors } from '../form-errors';

/** Options for AppTester. */
interface AppTesterPalOptions {
  /** The URL to initially set the router context to. */
  url: string;
};

/**
 * This extends ReactTestingLibraryPal by wrapping your JSX in a
 * number of common React contexts and providing some
 * extra app-specific utilities.
 * 
 * When using it, be sure to add the following to your test suite:
 *
 *   afterEach(AppTesterPal.cleanup);
 */
export class AppTesterPal extends ReactTestingLibraryPal {
  /**
   * A mock GraphQL client with which you can respond to any requests.
   */
  readonly client: GraphQlClient;

  constructor(el: JSX.Element, options?: Partial<AppTesterPalOptions>) {
    const o: AppTesterPalOptions = {
      url: '/',
      ...options
    };
    const { client } = createTestGraphQlClient();
    const appContext = {
      ...FakeAppContext,
      fetch: client.fetch
    };
    super(rt.render(
      <MemoryRouter initialEntries={[o.url]} initialIndex={0}>
        <AppContext.Provider value={appContext}>
          {el}
        </AppContext.Provider>
      </MemoryRouter>
    ));
  
    this.client = client;
  }

  /**
   * Assuming that our GraphQL client has been issued a
   * form request, responds with the given mock output.
   */
  respondWithFormOutput<FormOutput extends WithServerFormFieldErrors>(output: FormOutput) {
    this.client.getRequestQueue()[0].resolve({ output });
  }
}
