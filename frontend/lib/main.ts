import { startApp, AppProps } from './app';
import { getElement } from './util';


window.addEventListener('load', () => {
  const div = getElement('div', '#main');
  const initialPropsEl = getElement('script', '#initial-props');
  if (!initialPropsEl.textContent) {
    throw new Error('Assertion failure, #initial-props must contain text');
  }
  const initialProps = JSON.parse(initialPropsEl.textContent) as AppProps;
  startApp(div, initialProps);
});
