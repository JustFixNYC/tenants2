import { startApp, AppProps } from './app';
import { getElement } from './util';

/**
 * This global allows us to tell Webpack where to lazy-load JS
 * bundles from. For more details, see:
 * 
 * https://webpack.js.org/guides/public-path/#on-the-fly
 */
declare let __webpack_public_path__: string;

window.addEventListener('load', () => {
  const div = getElement('div', '#main');
  const initialPropsEl = getElement('script', '#initial-props');
  const prerenderedModalEl = getElement('div', '#prerendered-modal');
  if (!initialPropsEl.textContent) {
    throw new Error('Assertion failure, #initial-props must contain text');
  }
  const initialProps = JSON.parse(initialPropsEl.textContent) as AppProps;
  __webpack_public_path__  = initialProps.server.webpackPublicPathURL;
  if (!prerenderedModalEl.parentNode) {
    throw new Error('Assertion failure, pre-rendered modal must have a parent');
  }
  div.removeAttribute('hidden');
  prerenderedModalEl.parentNode.removeChild(prerenderedModalEl);
  startApp(div, initialProps);
});
