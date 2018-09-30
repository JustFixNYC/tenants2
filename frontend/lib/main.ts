/// <reference path="main-globals.d.ts" />

import { startApp, AppProps } from './app';
import { getElement } from './util';


window.addEventListener('load', () => {
  const div = getElement('div', '#main');
  const initialPropsEl = getElement('script', '#initial-props');
  if (!initialPropsEl.textContent) {
    throw new Error('Assertion failure, #initial-props must contain text');
  }
  const initialProps = JSON.parse(initialPropsEl.textContent) as AppProps;

  // See main-globals.d.ts for more details on this.
  __webpack_public_path__  = initialProps.server.webpackPublicPathURL;

  // It's possible that the server-side has made our main div
  // hidden because a pre-rendered modal is intended to contain
  // all keyboard-focusable elements in case JS couldn't be loaded.
  // Since JS is now loaded, let's remove that restriction.
  div.removeAttribute('hidden');

  startApp(div, initialProps);
});

if (process.env.NODE_ENV !== 'production' && DISABLE_DEV_SOURCE_MAPS) {
  console.log(
    'Source maps have been disabled to improve compilation speed. To ' +
    'prevent this, unset the DISABLE_DEV_SOURCE_MAPS ' +
    'environment variable.'
  );
}
