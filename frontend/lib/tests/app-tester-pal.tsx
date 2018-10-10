import React from 'react';
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient, { queuedRequest } from "../graphql-client";
import { createTestGraphQlClient, FakeAppContext, FakeSessionInfo, FakeServerInfo } from "./util";
import { MemoryRouter, Route } from "react-router";
import { AppContext, AppContextType, AppServerInfo } from "../app-context";
import { WithServerFormFieldErrors } from '../form-errors';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { History } from 'history';
import { assertNotNull } from '../util';

/** Options for AppTester. */
interface AppTesterPalOptions {
  /** The URL to initially set the router context to. */
  url: string;

  /** Any updates to the app session. */
  session: Partial<AllSessionInfo>;

  /** Any updates to the server info. */
  server: Partial<AppServerInfo>;
};

/**
 * A specialized version of the AppContext, enhanced to allow for
 * some properties to be mocked.
 */
interface AppTesterAppContext extends AppContextType {
  updateSession: AppContextType["updateSession"] & jest.MockInstance<void>;
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

  /**
   * A reference to the AppContext provided to the wrapped component.
   */
  readonly appContext: AppTesterAppContext;

  /**
   * A reference to the router's browsing history.
   */
  readonly history: History;

  constructor(el: JSX.Element, options?: Partial<AppTesterPalOptions>) {
    const o: AppTesterPalOptions = {
      url: '/',
      session: {},
      server: {},
      ...options
    };
    const { client } = createTestGraphQlClient();
    const appContext: AppTesterAppContext = {
      ...FakeAppContext,
      session: { ...FakeSessionInfo, ...o.session },
      server: { ...FakeServerInfo, ...o.server },
      fetch: client.fetch,
      updateSession: jest.fn()
    };
    let history: History|null = null;
    super(
      <MemoryRouter initialEntries={[o.url]} initialIndex={0}>
        <AppContext.Provider value={appContext}>
          <Route render={(ctx) => { history = ctx.history; return null; }} />
          {el}
        </AppContext.Provider>
      </MemoryRouter>
    );

    this.history = assertNotNull(history as History|null);
    this.appContext = appContext;
    this.client = client;
  }

  private getFirstRequest(): queuedRequest {
    return this.client.getRequestQueue()[0];
  }

  /**
   * Assuming that our GraphQL client has been issued a
   * form request, responds with the given mock output.
   */
  respondWithFormOutput<FormOutput extends WithServerFormFieldErrors>(output: FormOutput) {
    this.getFirstRequest().resolve({ output });
  }

  /**
   * Assuming that our GraphQL client has been issued a
   * form request, asserts the request's GraphQL query
   * matches the given pattern.
   */
  expectGraphQL(match: RegExp) {
    expect(this.getFirstRequest().query).toMatch(match);
  }

  /**
   * Assuming that our GraphQL client has been issued
   * a form request, asserts that the request's input
   * equals the given value.
   */
  expectFormInput<FormInput>(expected: FormInput) {
    const actual = this.getFirstRequest().variables['input'];
    expect(actual).toEqual(expected);
  }
}
