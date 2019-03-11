import React from 'react';
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient, { queuedRequest } from "../graphql-client";
import { createTestGraphQlClient, FakeAppContext, FakeSessionInfo, FakeServerInfo } from "./util";
import { MemoryRouter, Route, MemoryRouterProps, RouteComponentProps } from "react-router";
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

  /** Any updates to the memory router. */
  router: Partial<MemoryRouterProps>;
};

/**
 * A specialized version of the AppContext, enhanced to allow for
 * some properties to be mocked.
 */
interface AppTesterAppContext extends AppContextType {
  updateSession: AppContextType["updateSession"] & jest.MockInstance<any, any>;
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

  /**
   * The final computed options for this instance, including defaults.
   */
  readonly options: AppTesterPalOptions;

  constructor(el: JSX.Element, options?: Partial<AppTesterPalOptions>) {
    const o: AppTesterPalOptions = {
      url: '/',
      session: {},
      server: {},
      router: {},
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
      AppTesterPal.generateJsx(el, o, appContext, (ctx) => history = ctx.history)
    );

    this.history = assertNotNull(history as History|null);
    this.appContext = appContext;
    this.client = client;
    this.options = o;
  }

  private static generateJsx(
    el: JSX.Element,
    options: AppTesterPalOptions,
    appContext: AppContextType,
    onRouteComponentProps: (ctx: RouteComponentProps<any>) => void = () => {},
  ): JSX.Element {
    return (
      <MemoryRouter initialEntries={[options.url]} initialIndex={0} {...options.router}>
        <AppContext.Provider value={appContext}>
          <Route render={(ctx) => { onRouteComponentProps(ctx); return null; }} />
          {el}
        </AppContext.Provider>
      </MemoryRouter>
    );
  }

  /**
   * Get the first network request made by any component in the
   * heirarchy, throwing an error if no request has been made.
   */
  getFirstRequest(): queuedRequest {
    const queue = this.client.getRequestQueue();
    expect(queue.length).toBeGreaterThan(0);
    return queue[0];
  }

  /**
   * Re-render with the given JSX. This will cause
   * React to do its diffing and unmount any components that aren't
   * present in the given JSX anymore, and so on.
   * 
   * For more details, see:
   * https://github.com/kentcdodds/react-testing-library#rerender
   */
  rerender(el: JSX.Element) {
    this.rr.rerender(AppTesterPal.generateJsx(el, this.options, this.appContext));
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

  /**
   * Spin the event loop so any promises that have been
   * resolved will be processed, etc.
   */
  nextTick(): Promise<any> {
    return new Promise(resolve => process.nextTick(resolve));
  }
}
