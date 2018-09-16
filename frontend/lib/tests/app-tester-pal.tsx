import React from 'react';
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient from "../graphql-client";
import { createTestGraphQlClient, FakeAppContext, FakeSessionInfo } from "./util";
import { MemoryRouter } from "react-router";
import { AppContext, AppContextType } from "../app-context";
import { WithServerFormFieldErrors } from '../form-errors';
import { AllSessionInfo } from '../queries/AllSessionInfo';

/** Options for AppTester. */
interface AppTesterPalOptions {
  /** The URL to initially set the router context to. */
  url: string;

  /** Any updates to the app session. */
  session: Partial<AllSessionInfo>;
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

  constructor(el: JSX.Element, options?: Partial<AppTesterPalOptions>) {
    const o: AppTesterPalOptions = {
      url: '/',
      session: {},
      ...options
    };
    const { client } = createTestGraphQlClient();
    const appContext: AppTesterAppContext = {
      ...FakeAppContext,
      session: {
        ...FakeSessionInfo,
        ...o.session
      },
      fetch: client.fetch,
      updateSession: jest.fn()
    };
    super(
      <MemoryRouter initialEntries={[o.url]} initialIndex={0}>
        <AppContext.Provider value={appContext}>
          {el}
        </AppContext.Provider>
      </MemoryRouter>
    );

    this.appContext = appContext;
    this.client = client;
  }

  /**
   * Assuming that our GraphQL client has been issued a
   * form request, responds with the given mock output.
   */
  respondWithFormOutput<FormOutput extends WithServerFormFieldErrors>(output: FormOutput) {
    this.client.getRequestQueue()[0].resolve({ output });
  }

  /**
   * Assuming that our GraphQL client has been issued
   * a form request, asserts that the request's input
   * equals the given value.
   */
  expectFormInput<FormInput>(expected: FormInput) {
    const req = this.client.getRequestQueue()[0];
    const actual = req.variables['input'];
    expect(actual).toEqual(expected);
  }
}
