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
import { appStaticContextAsStaticRouterContext, AppStaticContext } from '../lib/app-static-context';

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
}

/** Our event handler props are a superset of our app props. */
type EventProps = AppProps & {
  /**
   * This isn't particularly, elegant, but it's used during integration testing
   *to ensure that this process' handling of internal server errors works properly.
   */
  testInternalServerError?: boolean
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
function generateResponse(event: AppProps, bundleStats: any): Promise<LambdaResponse> {
  return new Promise<LambdaResponse>(resolve => {
    const context: AppStaticContext = {
      statusCode: 200,
    };
    const modules: string[] = [];
    const loadableProps: LoadableCaptureProps = {
      report(moduleName) { modules.push(moduleName) }
    };
    const html = renderAppHtml(event, context, loadableProps);
    const helmet = Helmet.renderStatic();
    const bundleFiles = getBundles(bundleStats, modules).map(bundle => bundle.file);
    resolve({
      html,
      titleTag: helmet.title.toString(),
      status: context.statusCode,
      bundleFiles
    });
  });
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
      bundleFiles: []
    };
  });
}

exports.handler = errorCatchingHandler;

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
        if (typeof(obj) !== "object" ||
            obj === null ||
            Array.isArray(obj)) {
          throw new Error("Expected input to be a JS object!");
        }
      } catch (e) {
        return reject(e);
      }
      errorCatchingHandler(obj as EventProps).then(response => {
        resolve(Buffer.from(JSON.stringify(response), 'utf-8'));
      }).catch(reject);
    });
  });
}

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
