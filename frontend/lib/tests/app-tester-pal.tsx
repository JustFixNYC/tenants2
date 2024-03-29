import React from "react";
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient, { queuedRequest } from "../networking/graphql-client";
import {
  createTestGraphQlClient,
  FakeAppContext,
  FakeSessionInfo,
  overrideGlobalAppServerInfo,
  override,
} from "./util";
import {
  MemoryRouter,
  Route,
  MemoryRouterProps,
  RouteComponentProps,
} from "react-router";
import { AppContext, AppContextType, AppServerInfo } from "../app-context";
import { WithServerFormFieldErrors } from "../forms/form-errors";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { History } from "history";
import { assertNotNull } from "@justfixnyc/util";
import { HelmetProvider } from "react-helmet-async";
import { FetchMutationInfo } from "../forms/forms-graphql";
import { QueryLoaderQuery } from "../networking/query-loader-prefetcher";
import { waitFor } from "@testing-library/react";
import autobind from "autobind-decorator";
import { newSb } from "./session-builder";
import { PreloadedLinguiI18nProvider } from "./lingui-preloader";

/** Options for AppTester. */
export interface AppTesterPalOptions {
  /** The URL to initially set the router context to. */
  url: string;

  /** Any updates to the app session. */
  session: Partial<AllSessionInfo>;

  /** Any updates to the server info. */
  server: Partial<AppServerInfo>;

  /** Any updates to the memory router. */
  router: Partial<MemoryRouterProps>;

  /**
   * Whether or not we actually update the session whenever
   * a component calls AppContext.updateSession().  By default,
   * we mock out the function but don't actually do anything
   * when it's called.
   */
  updateSession?: boolean;
}

/**
 * A specialized version of the AppContext, enhanced to allow for
 * some properties to be mocked.
 */
interface AppTesterAppContext extends AppContextType {
  updateSession: AppContextType["updateSession"] & jest.MockInstance<any, any>;
}

/**
 * This extends ReactTestingLibraryPal by wrapping your JSX in a
 * number of common React contexts and providing some
 * extra app-specific utilities.
 */
export class AppTesterPal extends ReactTestingLibraryPal {
  /**
   * A mock GraphQL client with which you can respond to any requests.
   */
  readonly client: GraphQlClient;

  /**
   * A reference to the AppContext provided to the wrapped component.
   */
  appContext: AppTesterAppContext;

  /**
   * A reference to the router's browsing history.
   */
  readonly history: History;

  /**
   * The final computed options for this instance, including defaults.
   */
  readonly options: AppTesterPalOptions;

  /**
   * Used internally to remember the last JSX we rendered.
   */
  private latestEl: JSX.Element;

  constructor(el: JSX.Element, options?: Partial<AppTesterPalOptions>) {
    const o: AppTesterPalOptions = {
      url: "/",
      session: {},
      server: {},
      router: {},
      ...options,
    };
    const { client } = createTestGraphQlClient();
    const appContext: AppTesterAppContext = {
      ...FakeAppContext,
      session: { ...FakeSessionInfo, ...o.session },
      server: overrideGlobalAppServerInfo(o.server),
      fetch: client.fetch,
      fetchWithoutErrorHandling: client.fetch,
      updateSession: jest.fn(),
    };
    let history: History | null = null;
    super(
      AppTesterPal.generateJsx(
        el,
        o,
        appContext,
        (ctx) => (history = ctx.history)
      )
    );

    if (o.updateSession) {
      appContext.updateSession = jest.fn(this.handleSessionChange);
    }

    this.history = assertNotNull(history as History | null);
    this.appContext = appContext;
    this.client = client;
    this.options = o;
    this.latestEl = el;
  }

  @autobind
  handleSessionChange(updates: Partial<AllSessionInfo>) {
    this.appContext = {
      ...this.appContext,
      session: override(this.appContext.session, updates),
    };
    this.rerender(this.latestEl);
  }

  private static generateJsx(
    el: JSX.Element,
    options: AppTesterPalOptions,
    appContext: AppContextType,
    onRouteComponentProps: (ctx: RouteComponentProps<any>) => void = () => {}
  ): JSX.Element {
    return (
      <HelmetProvider>
        <MemoryRouter
          initialEntries={[options.url]}
          initialIndex={0}
          {...options.router}
        >
          <AppContext.Provider value={appContext}>
            <PreloadedLinguiI18nProvider>
              <Route
                render={(ctx) => {
                  onRouteComponentProps(ctx);
                  return null;
                }}
              />
              {el}
            </PreloadedLinguiI18nProvider>
          </AppContext.Provider>
        </MemoryRouter>
      </HelmetProvider>
    );
  }

  /**
   * Returns a `SessionBuilder` pre-filled with the current session state.
   */
  get sessionBuilder() {
    return newSb(this.appContext.session);
  }

  /**
   * Get the most recent network request made by any component in the
   * heirarchy, throwing an error if no request has been made.
   */
  getLatestRequest(): queuedRequest {
    const queue = this.client.getRequestQueue();
    expect(queue.length).toBeGreaterThan(0);
    return queue[queue.length - 1];
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
    this.latestEl = el;
    this.rr.rerender(
      AppTesterPal.generateJsx(el, this.options, this.appContext)
    );
  }

  /**
   * Returns a helper for testing the given GraphQL query.
   */
  withQuery<Input, Output>(
    query: QueryLoaderQuery<Input, Output>
  ): GraphQLQueryHelper<Input, Output> {
    return new GraphQLQueryHelper(query, this);
  }

  /**
   * Returns a helper for testing the given GraphQL form mutation.
   */
  withFormMutation<FormInput, FormOutput extends WithServerFormFieldErrors>(
    mutation: FetchMutationInfo<FormInput, FormOutput>
  ): GraphQLFormMutationHelper<FormInput, FormOutput> {
    return new GraphQLFormMutationHelper(mutation, this);
  }

  /** Asserts that the current location is the expected value. */
  ensureLocation(pathname: string) {
    expect(this.history.location.pathname).toBe(pathname);
  }

  /**
   * Returns a promise that resolves once the current location has changed
   * to the expected value.
   */
  waitForLocation(pathname: string): Promise<void> {
    return waitFor(() => this.ensureLocation(pathname));
  }
}

/** A base class for testing GraphQL queries/mutations. */
class BaseGraphQLHelper {
  constructor(
    private readonly graphQL: string,
    readonly appPal: AppTesterPal
  ) {}

  /**
   * Assert that the latest request is for our GraphQL query/mutation.
   */
  ensure() {
    expect(this.appPal.getLatestRequest().query).toEqual(this.graphQL);
  }

  /**
   * Wait until the latest request is for our GraphQL query/mutation.
   */
  async wait() {
    await waitFor(() => this.ensure());
    return this;
  }
}

/**
 * A helper class for testing GraphQL queries.
 */
class GraphQLQueryHelper<Input, Output> extends BaseGraphQLHelper {
  constructor(
    readonly query: QueryLoaderQuery<Input, Output>,
    readonly appPal: AppTesterPal
  ) {
    super(query.graphQL, appPal);
  }

  /**
   * Expect the given input for this query, and ensure that
   * GraphQL for our query was sent over the network.
   */
  expect(expected: Input) {
    this.ensure();
    const actual = this.appPal.getLatestRequest().variables;
    expect(actual).toEqual(expected);
    return this;
  }

  /**
   * Respond with the given output for our query.
   */
  respondWith(output: Output) {
    this.ensure();
    this.appPal.getLatestRequest().resolve(output);
    return this;
  }
}

/**
 * A helper class for testing GraphQL form mutations.
 */
class GraphQLFormMutationHelper<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> extends BaseGraphQLHelper {
  constructor(
    readonly mutation: FetchMutationInfo<FormInput, FormOutput>,
    readonly appPal: AppTesterPal
  ) {
    super(mutation.graphQL, appPal);
  }

  /**
   * Expect the given form input for this mutation, and ensure that
   * GraphQL for our mutation was sent over the network.
   */
  expect(expected: FormInput) {
    this.ensure();
    const actual = this.appPal.getLatestRequest().variables["input"];
    expect(actual).toEqual(expected);
    return this;
  }

  /**
   * Respond with the given form output for our mutation.
   */
  respondWith(output: FormOutput) {
    this.ensure();
    this.appPal.getLatestRequest().resolve({ output });
    return this;
  }

  /**
   * Respond with the given successful form output for our mutation.
   *
   * This is like `respondWith()`, but automatically uses an empty
   * array for the `errors` field to indicate a successful submission.
   */
  respondWithSuccess(output: Omit<FormOutput, "errors">) {
    output = { ...output, errors: [] };
    this.ensure();
    this.appPal.getLatestRequest().resolve({ output });
    return this;
  }
}
