import { Console } from 'console';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

import { App, AppProps } from '../lib/app';
import { appStaticContextAsStaticRouterContext, AppStaticContext } from '../lib/app-static-context';

/**
 * This is the structure that our lambda returns to clients.
 */
interface LambdaResponse {
  /** The HTML of the initial render of the page. */
  html: string;

  /** The HTTP status code of the page. */
  status: number;
}

/**
 * This is a handler for serverless environments that,
 * given initial app properties, returns the initial
 * HTML rendering of the app, along with other response
 * metadata.
 * 
 * @param event The initial properties for our app.
 */
function handler(event: AppProps): Promise<LambdaResponse> {
  return new Promise<LambdaResponse>(resolve => {
    const context: AppStaticContext = {
      statusCode: 200,
    };
    const el = React.createElement(StaticRouter, {
      location: event.initialURL,
      context: appStaticContextAsStaticRouterContext(context)
    }, React.createElement(App, event));
    const html = ReactDOMServer.renderToString(el);
    resolve({
      html,
      status: context.statusCode
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
