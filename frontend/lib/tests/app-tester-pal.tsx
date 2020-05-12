import React from "react";
import ReactTestingLibraryPal from "./rtl-pal";
import GraphQlClient, { queuedRequest } from "../networking/graphql-client";
import {
  createTestGraphQlClient,
  FakeAppContext,
  FakeSessionInfo,
  overrideGlobalAppServerInfo,
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
import { assertNotNull } from "../util/util";
import { HelmetProvider } from "react-helmet-async";
import { FetchMutationInfo } from "../forms/forms-graphql";
import { QueryLoaderQuery } from "../networking/query-loader-prefetcher";
import { wait } from "@testing-library/react";

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

    this.history = assertNotNull(history as History | null);
    this.appContext = appContext;
    this.client = client;
    this.options = o;
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
            <Route
              render={(ctx) => {
                onRouteComponentProps(ctx);
                return null;
              }}
            />
            {el}
          </AppContext.Provider>
        </MemoryRouter>
      </HelmetProvider>
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
    await wait(() => this.ensure());
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
}
