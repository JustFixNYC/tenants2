// Register source map support ASAP so any exceptions thrown
// at the top level of imported modules have source-mapped
// stack traces.
import "source-map-support/register";

// We're outputting our result to stdout, so we want all
// console.log() statements to go to stderr, so they don't
// corrupt our output.
//
// It's also important that we do this as early as possible,
// so that even logging statements at the top level of modules
// we import are sent to stderr.
import "./redirect-console-to-stderr";

import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { HelmetData } from "react-helmet";
import { ChunkExtractor, ChunkExtractorManager } from "@loadable/server";
import juice from "juice";

import { ErrorDisplay, getErrorString } from "../lib/error-boundary";
import { App, AppProps } from "../lib/app";
import {
  appStaticContextAsStaticRouterContext,
  AppStaticContext,
} from "../lib/app-static-context";
import i18n from "../lib/i18n";
import { assertNotUndefined } from "@justfixnyc/util";
import { serveLambdaOverHttp, serveLambdaOverStdio } from "./lambda-io";
import { setGlobalAppServerInfo } from "../lib/app-context";
import { LambdaResponseHttpHeaders } from "./lambda-response-http-headers";

/**
 * This is the structure that our lambda returns to clients.
 */
export interface LambdaResponse {
  /** The HTML of the initial render of the page. */
  html: string;

  /**
   * Whether or not the response represents an entire self-contained, static
   * web page: one doesn't need to be put in a template and/or progressively
   * enhanced in any way.
   */
  isStaticContent: boolean;

  /**
   * Extra HTTP headers to add to the HTTP response for this page. Only
   * applies when `isStaticContent` is true.
   */
  httpHeaders: LambdaResponseHttpHeaders;

  /** The <title> tag for the initial render of the page. */
  titleTag: string;

  /** Additional <meta> tags for the initial render of the page. */
  metaTags: string;

  /**
   * Script tags for all JS bundles to include in the HTML output
   * (including the main bundle).
   */
  scriptTags: string;

  /** The HTTP status code of the page. */
  status: number;

  /** The pre-rendered modal to show, if any. */
  modalHtml: string;

  /** The location to redirect to, if the status is 301 or 302. */
  location: string | null;

  /** The error traceback, if the status is 500. */
  traceback: string | null;

  /**
   * If the page contains a GraphQL query whose results should be
   * pre-fetched, this will contain its value.
   */
  graphQLQueryToPrefetch: {
    graphQL: string;
    input: any;
  } | null;
}

type HelmetContext = {
  helmet?: HelmetData;
};

/** Our event handler props are a superset of our app props. */
type EventProps = AppProps & {
  /**
   * This isn't particularly, elegant, but it's used during integration testing
   *to ensure that this process' handling of internal server errors works properly.
   */
  testInternalServerError?: boolean;
};

function ServerRouter(props: {
  event: AppProps;
  context: AppStaticContext;
  children: any;
}): JSX.Element {
  return (
    <StaticRouter
      location={props.event.initialURL}
      context={appStaticContextAsStaticRouterContext(props.context)}
      children={props.children}
    />
  );
}

/** Render the HTML for the requested URL and return it. */
function renderAppHtml(
  event: AppProps,
  context: AppStaticContext,
  extractor: ChunkExtractor,
  helmetContext: any
): string {
  return ReactDOMServer.renderToString(
    <HelmetProvider context={helmetContext}>
      <ChunkExtractorManager extractor={extractor}>
        <ServerRouter event={event} context={context}>
          <App {...event} />
        </ServerRouter>
      </ChunkExtractorManager>
    </HelmetProvider>
  );
}

export function postProcessStaticMarkup(
  html: string,
  options: Pick<AppStaticContext, "shouldInlineCss">
) {
  if (options.shouldInlineCss) {
    html = juice(html);
  }
  return html;
}

function renderStaticMarkup(
  event: AppProps,
  context: AppStaticContext,
  jsx: JSX.Element
): string {
  return ReactDOMServer.renderToStaticMarkup(
    <ServerRouter event={event} context={context}>
      <App {...event} children={jsx} />
    </ServerRouter>
  );
}

/**
 * Generate the response for a given handler request, including the initial
 * HTML for the requested URL.
 *
 * @param event The request.
 */
export function generateLambdaResponse(
  event: AppProps,
  renderer = renderAppHtml,
  staticRenderer = renderStaticMarkup
): LambdaResponse {
  i18n.initialize(event.locale);
  setGlobalAppServerInfo(event.server);

  const context: AppStaticContext = {
    statusCode: 200,
    httpHeaders: {},
  };
  const extractor = new ChunkExtractor({
    statsFile: path.join(
      process.cwd(),
      "frontend",
      "static",
      "frontend",
      "loadable-stats.json"
    ),
    publicPath: event.server.webpackPublicPathURL,
  });
  const helmetContext: HelmetContext = {};
  let html = renderer(event, context, extractor, helmetContext);
  const helmet = assertNotUndefined(helmetContext.helmet);
  let isStaticContent = false;
  if (context.staticContent) {
    html = postProcessStaticMarkup(
      staticRenderer(event, context, context.staticContent),
      context
    );
    isStaticContent = true;
  }
  const modalHtml = context.modal
    ? staticRenderer(event, context, context.modal)
    : "";
  let location = null;
  if (context.url) {
    context.statusCode = 302;
    location = context.url;
  }
  return {
    html,
    isStaticContent,
    httpHeaders: context.httpHeaders,
    titleTag: helmet.title.toString(),
    metaTags: helmet.meta.toString(),
    scriptTags: extractor.getScriptTags(),
    status: context.statusCode,
    modalHtml,
    location,
    traceback: null,
    graphQLQueryToPrefetch: context.graphQLQueryToPrefetch || null,
  };
}

/**
 * This is a handler for serverless environments that,
 * given initial app properties, returns the initial
 * HTML rendering of the app, along with other response
 * metadata.
 *
 * @param event The initial properties for our app.
 */
function baseHandler(event: EventProps): LambdaResponse {
  if (event.testInternalServerError) {
    throw new Error("Testing internal server error");
  }

  return generateLambdaResponse(event);
}

/**
 * This just wraps our base handler in logic that wraps any errors in
 * a response that shows an error page with a 500 response.
 */
export function errorCatchingHandler(event: EventProps): LambdaResponse {
  try {
    return baseHandler(event);
  } catch (error) {
    const helmetContext: HelmetContext = {};
    const html = ReactDOMServer.renderToStaticMarkup(
      <HelmetProvider context={helmetContext}>
        <ErrorDisplay
          debug={event.server.debug}
          error={getErrorString(error)}
          isServerSide={true}
        />
      </HelmetProvider>
    );
    const helmet = assertNotUndefined(helmetContext.helmet);
    return {
      html,
      isStaticContent: false,
      httpHeaders: {},
      titleTag: helmet.title.toString(),
      metaTags: helmet.meta.toString(),
      scriptTags: "",
      status: 500,
      modalHtml: "",
      location: null,
      traceback: error.stack,
      graphQLQueryToPrefetch: null,
    };
  }
}

exports.handler = errorCatchingHandler;

/* istanbul ignore next: this is tested by integration tests. */
if (!module.parent) {
  if (process.argv.includes("--serve-http")) {
    serveLambdaOverHttp(errorCatchingHandler);
  } else {
    serveLambdaOverStdio(errorCatchingHandler);
  }
}
