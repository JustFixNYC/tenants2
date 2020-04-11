import React from 'react';

import { AllSessionInfo } from './queries/AllSessionInfo';
import { GraphQLFetch } from './networking/graphql-client';
import { buildContextHocFactory } from './context-util';
import { SiteChoice } from '../../common-data/site-choices';

/** Metadata about forms submitted via legacy POST. */
export interface AppLegacyFormSubmission<FormInput = any, FormOutput = any> {
  /** The original form input. */
  input: FormInput;

  /**
   * The result of the GraphQL mutation for the form. It may be `null` if
   * the server didn't actually validate and process the form, e.g.
   * if the user clicked "add another" on a formset.
   */
  result: FormOutput|null;

  /**
   * The raw POST data. If more than one value was supplied for a key,
   * the last value is present here.
   */
  POST: Partial<{ [key: string]: string }>;
}

/**
 * Since the app server info doesn't change through the app's lifetime,
 * we're just going to make it a global so we don't have to constantly
 * access it via a potentially cumbersome React Context.
 */
let globalAppServerInfo: AppServerInfo|null = null;

/**
 * This sets the global app server info. It should only be called once
 * on the client side; on the server side, it should be called before
 * each render.
 */
export function setGlobalAppServerInfo(info: AppServerInfo) {
  globalAppServerInfo = info;
}

/**
 * Retrieves the global app server info. This will be the exact same
 * server info that is part of the AppContext, it's just accessible
 * via a function, which can be useful if obtaining the AppContext is
 * cumbersome.
 */
export function getGlobalAppServerInfo(): AppServerInfo {
  if (!globalAppServerInfo) {
    throw new Error('Assertion failure, global app server info should be set!');
  }
  return globalAppServerInfo;
}

/** Details about the server that don't change through the app's lifetime. */
export interface AppServerInfo {
  /** The server's origin URL, e.g. "http://boop.com". */
  originURL: string;

  /**
   * The human-readable name of the website.
   */
  siteName: string;

  /**
   * The type of website to render.
   */
  siteType: SiteChoice;

  /**
   * The URL of the server's static files, e.g. "/static/".
   */
  staticURL: string;

  /**
   * The URL to generated webpack bundles for lazy-loading, e.g. "/static/frontend/".
   */
  webpackPublicPathURL: string;

  /**
   * The URL of the server's Django admin, e.g. "/admin/".
   */
  adminIndexURL: string;

  /** The batch GraphQL endpoint; required if a GraphQL client is not provided. */
  batchGraphQLURL: string;

  /** The letter of complaint URL (HTML format). */
  locHtmlURL: string;

  /** The letter of complaint URL (PDF format). */
  locPdfURL: string;

  /** The POST endpoint to enable compatibility mode (aka "safe mode"). */
  enableSafeModeURL: string;

  /**
   * The URL that automatically logs-in the current user to the legacy tenant
   * app and redirects them there.
   */
  redirectToLegacyAppURL: string;

  /**
   * An optional label to show the site's navbar.
   */
  navbarLabel?: string;

  /**
   * The base url for outbound links to Who Owns What. 
   */
  wowOrigin: string;

  /**
   * The base url for outbound links to Eviction Free NYC. 
   */
  efnycOrigin: string;

  /**
   * Whether the site is in development mode (corresponds to settings.DEBUG in
   * the Django app).
   */
  debug: boolean;

  /**
   * If the page contains a GraphQL query whose result has been pre-fetched
   * by the server, this will contain its value.
   */
  prefetchedGraphQLQueryResponse?: {
    graphQL: string,
    input: any,
    output: any
  };

  /** Whether to enable emergency HP Action functionality. */
  enableEmergencyHPAction?: boolean;
}

/**
 * Basic information about the app that components
 * should have relatively easy access to.
 */
export interface AppContextType {
  /**
   * Information about the server that stays constant through the app's
   * lifetime.
   */
  server: AppServerInfo;

  /**
   * Information about the current user that may change if they
   * log in/out, etc.
   */
  session: AllSessionInfo;

  /**
   * A reference to the app's GraphQL interface, for network requests.
   * 
   * Includes automatic error handling that advises the user to try
   * again later.
   */
  fetch: GraphQLFetch;

  /**
   * A reference to the app's GraphQL interface, for network requests.
   * 
   * It does not include any error handing by default, so the caller
   * is responsible for informing the user about any errors that occur.
   */
  fetchWithoutErrorHandling: GraphQLFetch;

  /**
   * Currently, we often update the app's state by having network
   * APIs return a new session state. This makes it easy for
   * components to just pass the session data back to the app.
   */
  updateSession: (session: Partial<AllSessionInfo>) => void;

  /** If a form was submitted via a non-JS browser, data will be here. */
  legacyFormSubmission?: AppLegacyFormSubmission;
}

/* istanbul ignore next: this will never be executed in practice. */
class UnimplementedError extends Error {
  constructor() {
    super("This is unimplemented!");
  }
}

/* istanbul ignore next: this will never be executed in practice. */
/**
 * The default AppContext will raise an exception when any of its
 * properties are accessed; because this information is very
 * important to the user experience, we really need it to be
 * provided by the app!
 * 
 * However, we're also exporting the symbol, so test suites
 * can use Object.defineProperty() to override the properties
 * and provide defaults for testing. This will ensure that
 * tests don't need to wrap everything in an AppContext.Provider.
 */
export const defaultContext: AppContextType = {
  get server(): AppServerInfo {
    throw new UnimplementedError();
  },
  get session(): AllSessionInfo {
    throw new UnimplementedError();
  },
  fetch(query: string, variables?: any): Promise<any> {
    throw new UnimplementedError();
  },
  fetchWithoutErrorHandling(query: string, variables?: any): Promise<any> {
    throw new UnimplementedError();
  },
  updateSession(session: Partial<AllSessionInfo>) {
    throw new UnimplementedError();
  }
};

/**
 * A React Context that provides basic information about
 * the app that we don't want to have to pass down through
 * our whole component heirarchy.
 * 
 * For more details, see:
 * 
 *   https://reactjs.org/docs/context.html
 */
export const AppContext = React.createContext<AppContextType>(defaultContext);

export const withAppContext = buildContextHocFactory(AppContext);
