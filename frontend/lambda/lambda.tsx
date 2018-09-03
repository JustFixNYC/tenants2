require('source-map-support').install();

import fs from 'fs';
import { promisify } from 'util';
import { Console } from 'console';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import Loadable, { LoadableCaptureProps } from 'react-loadable';
import { getBundles } from 'react-loadable/webpack';
import Helmet from 'react-helmet';

import { ErrorDisplay, getErrorString } from '../lib/error-boundary';
import { App, AppProps } from '../lib/app';
import { appStaticContextAsStaticRouterContext, AppStaticContext, RequestForServer, ResponseFromServer } from '../lib/app-static-context';

const readFile = promisify(fs.readFile);

/**
 * This is the structure that our lambda returns to clients.
 */
export interface LambdaResponse {
  /** The HTML of the initial render of the page. */
  html: string;

  /** The <title> tag for the initial render of the page. */
  titleTag: string;

  /** The HTTP status code of the page. */
  status: number;

  /**
   * Names of all JS bundles to include in the HTML output
   * (excluding the main bundle).
   */
  bundleFiles: string[];

  /** The pre-rendered modal to show, if any. */
  modalHtml: string;

  /** The location to redirect to, if the status is 301 or 302. */
  location: string|null;

  /**
   * GraphQL requests we need the server to respond to before we can
   * render a final response.
   */
  requestsForServer: RequestForServer[];
}

/** Our event handler props are a superset of our app props. */
type EventProps = AppProps & {
  /**
   * This isn't particularly, elegant, but it's used during integration testing
   *to ensure that this process' handling of internal server errors works properly.
   */
  testInternalServerError?: boolean;

  /** The HTTP method of the request we're responding to. */
  method: 'GET'|'POST';

  /** The decoded application/x-www-form-urlencoded POST body, if we're responding to a POST. */
  postBody: any;

  /** Responses to any GraphQL queries the server has provided us with in advance. */
  responsesFromServer: ResponseFromServer[];
};

/** Render the HTML for the requested URL and return it. */
function renderAppHtml(
  event: AppProps,
  context: AppStaticContext,
  loadableProps: LoadableCaptureProps
): string {
  return ReactDOMServer.renderToString(
    <Loadable.Capture {...loadableProps}>
      <StaticRouter
      location={event.initialURL}
      context={appStaticContextAsStaticRouterContext(context)}>
        <App {...event} />
      </StaticRouter>
    </Loadable.Capture>
  );
}

/**
 * Generate the response for a given handler request, including the initial
 * HTML for the requested URL.
 * 
 * @param event The request.
 * @param bundleStats Statistics on what modules exist in which JS bundles, for
 *   lazy loading purposes.
 */
function generateResponse(event: EventProps, bundleStats: any): Promise<LambdaResponse> {
  function render(resolve: (result: LambdaResponse) => void, reject: (reason: any) => void, promiseMap: AppStaticContext["promiseMap"] = new Map()) {
    const context: AppStaticContext = {
      statusCode: 200,
      method: event.method,
      postBody: event.postBody,
      promiseMap,
      responsesFromServer: event.responsesFromServer
    };
    const modules: string[] = [];
  
    /* istanbul ignore next */
    const loadableProps: LoadableCaptureProps = {
      report(moduleName) { modules.push(moduleName) }
    };

    const html = renderAppHtml(event, context, loadableProps);

    // TODO: If this was a POST and the POST wasn't handled, we should return
    // some kind of error.

    process.nextTick(() => {
      const queuedRequests = context.getQueuedRequests ? context.getQueuedRequests() : [];
      const requestsForServer: RequestForServer[] = queuedRequests.map(req => ({
        query: req.query,
        variables: req.variables || null      
      }));

      if (requestsForServer.length) {
        resolve({
          html: '',
          titleTag: '',
          status: 0,
          bundleFiles: [],
          modalHtml: '',
          location: null,
          requestsForServer
        });
        return;
      }

      if (context.promiseMap.size) {
        const promises: Promise<any>[] = [];
        for (let mapValue of context.promiseMap.values()) {
          if (mapValue.result === undefined) {
            promises.push(mapValue.promise);
          }
        }
        if (promises.length) {
          // const timeout = setTimeout(() => reject('blah'), 1000);

          // TODO: This assumes that none of the promises will issue
          // any more subsequent requests from the server. If they do,
          // we will hang.
          Promise.all(promises).then(promiseResults => {
            for (let i = 0; i < promises.length; i++) {
              for (let mapValue of context.promiseMap.values()) {
                if (promises[i] === mapValue.promise) {
                  mapValue.result = promiseResults[i];
                  break;
                }
              }
            }
            render(resolve, reject, promiseMap);
          }).catch(reject);
          return;
        }
      }

      const helmet = Helmet.renderStatic();
      const bundleFiles = getBundles(bundleStats, modules).map(bundle => bundle.file);
      let modalHtml = '';
      if (context.modal) {
        modalHtml = ReactDOMServer.renderToStaticMarkup(context.modal);
      }
      let location = null;
      if (context.url) {
        context.statusCode = 302;
        location = context.url;
      }
      resolve({
        html,
        titleTag: helmet.title.toString(),
        status: context.statusCode,
        bundleFiles,
        modalHtml,
        location,
        requestsForServer: []
      });
    });
  }

  return new Promise<LambdaResponse>(render);
}

/**
 * This is a handler for serverless environments that,
 * given initial app properties, returns the initial
 * HTML rendering of the app, along with other response
 * metadata.
 * 
 * @param event The initial properties for our app.
 */
async function baseHandler(event: EventProps): Promise<LambdaResponse> {
  await Loadable.preloadAll();

  const stats = JSON.parse(await readFile('react-loadable.json', { encoding: 'utf-8' }));

  if (event.testInternalServerError) {
    throw new Error('Testing internal server error');
  }

  return generateResponse(event, stats);
}

/**
 * This just wraps our base handler in logic that wraps any errors in
 * a response that shows an error page with a 500 response.
 */
export function errorCatchingHandler(event: EventProps): Promise<LambdaResponse> {
  return baseHandler(event).catch(error => {
    console.error(error);

    const html = ReactDOMServer.renderToStaticMarkup(
      <ErrorDisplay
        debug={event.server.debug}
        error={getErrorString(error)}
        isServerSide={true}
      />
    );
    const titleTag = Helmet.renderStatic().title.toString();
    return {
      html,
      titleTag,
      status: 500,
      bundleFiles: [],
      modalHtml: '',
      location: null,
      requestsForServer: []
    };
  });
}

exports.handler = errorCatchingHandler;

/** Return whether the argument is a plain ol' JS object (not an array). */
export function isPlainJsObject(obj: any): boolean {
  return (typeof(obj) === "object" && obj !== null && !Array.isArray(obj));
}

/**
 * This takes an input stream, decodes it as JSON, passes it
 * to the serverless handler, and returns the handler's response
 * encoded as UTF-8.
 * 
 * @param input An input stream with UTF-8 encoded JSON content.
 */
export function handleFromJSONStream(input: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];

    input.on('data', data => {
      buffers.push(data);
    });

    input.on('end', () => {
      const buffer = Buffer.concat(buffers);
      let obj: any;
      try {
        obj = JSON.parse(buffer.toString('utf-8'));
        /* istanbul ignore next: we are covering this but istanbul is weird. */
        if (!isPlainJsObject(obj)) {
          throw new Error("Expected input to be a JS object!");
        }
      } catch (e) {
        /* istanbul ignore next: we are covering this but istanbul is weird. */
        return reject(e);
      }
      errorCatchingHandler(obj as EventProps).then(response => {
        resolve(Buffer.from(JSON.stringify(response), 'utf-8'));
      }).catch(reject);
    });
  });
}

/* istanbul ignore next: this is tested by integration tests. */
if (!module.parent) {
  // We're outputting our result to stdout, so we want all
  // console.log() statements to go to stderr, so they don't
  // corrupt our output.
  Object.defineProperty(global, 'console', {
    value: new Console(process.stderr)
  });

  handleFromJSONStream(process.stdin).then(buf => {
    process.stdout.write(buf);
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
