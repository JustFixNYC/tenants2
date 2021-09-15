import React from "react";
import GraphQlClient from "../networking/graphql-client";
import {
  AppServerInfo,
  AppContextType,
  setGlobalAppServerInfo,
} from "../app-context";
import { AllSessionInfo, BlankAllSessionInfo } from "../queries/AllSessionInfo";
import { FormError, strToFormError } from "../forms/form-errors";
import JustfixRoutes from "../justfix-route-info";
import { Route } from "react-router-dom";

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
export function createTestGraphQlClient(
  enableTimeout: boolean = false
): TestClient {
  const timeoutMs = enableTimeout ? undefined : null;
  const mockFetch = jest
    .fn()
    .mockName("fetch")
    .mockReturnValue(new Promise(() => {}));
  const client = new GraphQlClient(
    "/mygraphql",
    "mycsrf",
    timeoutMs,
    mockFetch
  );
  return { client, mockFetch };
}

// https://stackoverflow.com/a/6969486
export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/** Wait for the given number of milliseconds. */
export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** This is a promisified version of `process.nextTick()`. */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => process.nextTick(resolve));
}

export const FakeServerInfo: Readonly<AppServerInfo> = {
  originURL: "https://myserver.com",
  staticURL: "/mystatic/",
  webpackPublicPathURL: "/mystatic/myfrontend/",
  adminIndexURL: "/myadmin/",
  siteName: "ExampleJustFix.nyc",
  siteType: "JUSTFIX",
  debug: false,
  batchGraphQLURL: "/mygarphql",
  isDemoDeployment: true,
  isEfnySuspended: false,
  finishedLocPdfURL: "/my-finished-letter.pdf",
  wowOrigin: "https://wow.test",
  efnycOrigin: "https://efnyc.test",
  enableSafeModeURL: "/mysafemode/enable",
  previewHardshipDeclarationURL: "/preview-declaration.pdf",
  submittedHardshipDeclarationURL: "/submitted-declaration.pdf",
  mapboxAccessToken: "",
  enabledLocales: ["en", "es"],
  enableWipLocales: false,
  facebookAppId: "",
  nycGeoSearchOrigin: "https://myfunky.geosearch.nyc",
  contentfulCommonStrings: null,
  extraDevLinks: [],
};

export const FakeSessionInfo: Readonly<AllSessionInfo> = BlankAllSessionInfo;

export const FakeAppContext: AppContextType = {
  server: FakeServerInfo,
  session: FakeSessionInfo,
  siteRoutes: JustfixRoutes,
  fetch: jest.fn(),
  fetchWithoutErrorHandling: jest.fn(),
  updateSession: jest.fn(),
};

export const FakeDebugAppContext: AppContextType = {
  ...FakeAppContext,
  server: {
    ...FakeAppContext.server,
    debug: true,
  },
};

export const FakeGeoResults: any = {
  features: [
    {
      properties: {
        borough_gid: "whosonfirst:borough:1",
        name: "150 COURT STREET",
      },
    },
  ],
};

export function simpleFormErrors(...errors: string[]): FormError[] {
  return errors.map(strToFormError);
}

/**
 * A helper that allows some or all of the given default object's
 * properties to be overridden.
 *
 * The return type is the same as the default object, which is what
 * makes this function useful over simply merging the two objects
 * using spread syntax.
 */
export function override<T>(defaults: T, overrides: Partial<T>): T {
  return {
    ...defaults,
    ...overrides,
  };
}

export function overrideGlobalAppServerInfo(
  overrides: Partial<AppServerInfo> = {}
): AppServerInfo {
  const newInfo: AppServerInfo = {
    ...FakeServerInfo,
    ...overrides,
  };
  setGlobalAppServerInfo(newInfo);
  return newInfo;
}

/**
 * Create a fake login route; useful for testing pages that
 * might redirect the user to login.
 */
export const createFakeLoginRoute = () => (
  <Route
    path="/en/login"
    exact
    render={(p) => <p>at login, search is {p.location.search}</p>}
  />
);

/**
 * Mock out `console.log` and call the given function with the mock
 * as its argument. When the function returns, the original
 * `console.log` will be restored.
 */
export function withMockConsoleLog<T>(fn: (mock: jest.Mock) => T): T {
  const originalLog = console.log;
  const mockLog = jest.fn();
  console.log = mockLog;
  try {
    return fn(mockLog);
  } finally {
    console.log = originalLog;
  }
}
