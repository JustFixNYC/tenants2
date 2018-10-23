import React from 'react';
import GraphQlClient from "../graphql-client";
import { AppServerInfo, AppContextType } from "../app-context";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { shallow, ShallowWrapper, mount, ReactWrapper } from "enzyme";
import { MemoryRouter, Route, RouteComponentProps } from "react-router";

interface TestClient {
  mockFetch: jest.Mock;
  client: GraphQlClient;
}

/**
 * Creates a GraphQL client useful for testing. It will never hit the network
 * because the fetch implementation it uses is a Jest mock.
 *
 * @param enableTimeout Whether to enable the client's timeout-based fetch logic.
 *   If disabled (the default), your tests will need to manually tell the client
 *   to fetch queued requests.
 */
export function createTestGraphQlClient(enableTimeout: boolean = false): TestClient {
  const timeoutMs = enableTimeout ? undefined : null;
  const mockFetch = jest.fn()
    .mockName('fetch')
    .mockReturnValue(new Promise(() => {}));
  const client = new GraphQlClient('/mygraphql', 'mycsrf', timeoutMs, mockFetch);
  return { client, mockFetch };
}

const childWithRouterCtx = (child: JSX.Element) => {
  let routerContext: RouteComponentProps<any> = {} as any;
  const route = (
    <Route render={(ctx) => {
      routerContext.history = ctx.history;
      routerContext.location = ctx.location;
      routerContext.match = ctx.match;
      return child;
    }} />
  );
  return { routerContext, route };
};

// https://stackoverflow.com/a/6969486
export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function shallowWithRouter(child: JSX.Element): { wrapper: ShallowWrapper, routerContext: RouteComponentProps<any> } {
  const { routerContext, route } = childWithRouterCtx(child);
  const wrapper = shallow(<MemoryRouter>{route}</MemoryRouter>);
  return { wrapper, routerContext };
}

export function mountWithRouter(child: JSX.Element): { wrapper: ReactWrapper, routerContext: RouteComponentProps<any> } {
  const { routerContext, route } = childWithRouterCtx(child);
  const wrapper = mount(<MemoryRouter>{route}</MemoryRouter>);
  return { wrapper, routerContext };
}

export function ensureRedirect(child: JSX.Element, pathname: string) {
  const consoleErr = jest.fn();
  jest.spyOn(console, 'error').mockImplementationOnce(consoleErr);
  const { routerContext, wrapper } = mountWithRouter(child);
  wrapper.update();
  expect(routerContext.location.pathname).toBe(pathname);
  expect(consoleErr.mock.calls).toHaveLength(1);
  expect(consoleErr.mock.calls[0][0]).toMatch(
    /You tried to redirect to the same route you're currently on/i);
}

export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const FakeServerInfo: Readonly<AppServerInfo> = {
  originURL: 'https://myserver.com',
  staticURL: '/mystatic/',
  webpackPublicPathURL: '/mystatic/myfrontend/',
  adminIndexURL: '/myadmin/',
  debug: false,
  batchGraphQLURL: '/mygarphql',
  locHtmlURL: '/myletter.html',
  locPdfURL: '/myletter.pdf',
  redirectToLegacyAppURL: '/myredirect-to-legacy-app'
};

export const FakeSessionInfo: Readonly<AllSessionInfo> = {
  firstName: null,
  lastName: null,
  phoneNumber: null,
  csrfToken: 'mycsrf',
  prefersLegacyApp: false,
  isStaff: false,
  onboardingStep1: null,
  onboardingStep2: null,
  onboardingStep3: null,
  issues: [],
  customIssues: [],
  accessDates: [],
  landlordDetails: null,
  letterRequest: null,
  isSafeModeEnabled: false
};

export const FakeAppContext: AppContextType = {
  server: FakeServerInfo,
  session: FakeSessionInfo,
  fetch: jest.fn(),
  updateSession: jest.fn()
};

export const FakeDebugAppContext: AppContextType = {
  ...FakeAppContext,
  server: {
    ...FakeAppContext.server,
    debug: true
  }
};

export const FakeGeoResults: any = {
  features: [{
    properties: {
      borough_gid: 'whosonfirst:borough:1',
      name: '150 COURT STREET'
    }
  }]
};
