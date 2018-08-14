import { Console } from 'console';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

import { App, AppProps } from '../lib/app';

/**
 * This is a handler for serverless environments that,
 * given initial app properties, returns the initial
 * HTML rendering of the app.
 * 
 * @param event The initial properties for our app.
 */
function handler(event: AppProps): Promise<string> {
  return new Promise<string>(resolve => {
    const el = React.createElement(StaticRouter, {
      location: event.initialURL,
      context: {}
    }, React.createElement(App, event));
    resolve(ReactDOMServer.renderToString(el));
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
      handler(obj as AppProps).then(html => {
        resolve(Buffer.from(html, 'utf-8'));
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
