import fs from 'fs';
import { promisify } from 'util';
import { Console } from 'console';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import Loadable, { LoadableCaptureProps } from 'react-loadable';
import { getBundles } from 'react-loadable/webpack';
import Helmet from 'react-helmet';

import { App, AppProps } from '../lib/app';
import { appStaticContextAsStaticRouterContext, AppStaticContext } from '../lib/app-static-context';

const readFile = promisify(fs.readFile);

/**
 * This is the structure that our lambda returns to clients.
 */
interface LambdaResponse {
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

/**
 * This is a handler for serverless environments that,
 * given initial app properties, returns the initial
 * HTML rendering of the app, along with other response
 * metadata.
 * 
 * @param event The initial properties for our app.
 */
async function handler(event: AppProps): Promise<LambdaResponse> {
  await Loadable.preloadAll();

  const stats = JSON.parse(await readFile('react-loadable.json', { encoding: 'utf-8' }));

  return new Promise<LambdaResponse>(resolve => {
    const context: AppStaticContext = {
      statusCode: 200,
    };
    const modules: string[] = [];
    const loadableProps: LoadableCaptureProps = {
      report(moduleName) { modules.push(moduleName) }
    };
    const html = ReactDOMServer.renderToString(
      <Loadable.Capture {...loadableProps}>
        <StaticRouter
         location={event.initialURL}
         context={appStaticContextAsStaticRouterContext(context)}>
          <App {...event} />
        </StaticRouter>
      </Loadable.Capture>
    );
    const helmet = Helmet.renderStatic();
    const bundleFiles = getBundles(stats, modules).map(bundle => bundle.file);
    resolve({
      html,
      titleTag: helmet.title.toString(),
      status: context.statusCode,
      bundleFiles
    });
  });
}

exports.handler = handler;

/**
 * This takes an input stream, decodes it as JSON, passes it
 * to the serverless handler, and returns the handler's response
 * encoded as UTF-8.
 * 
 * @param input An input stream with UTF-8 encoded JSON content.
 */
function handleFromJSONStream(input: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];

    process.stdin.on('data', data => {
      buffers.push(data);
    });

    process.stdin.on('end', () => {
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
      handler(obj as AppProps).then(response => {
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
