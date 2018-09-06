import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { defaultContext } from '../app-context';
import { FakeAppContext } from './util';
import chalk from 'chalk';

configure({ adapter: new Adapter() });

Object.keys(FakeAppContext).forEach(prop => {
  Object.defineProperty(defaultContext, prop, {
    value: (FakeAppContext as any)[prop]
  });
});

if (typeof(window) !== 'undefined') {
  // react-aria-modal seems to call this, but jsdom
  // doesn't support it, and throws an exception when
  // it's called. So we'll just stub it out.
  window.scroll = jest.fn();
}

const originalLog = console.log;

/** 
 * Apparently jest sometimes doesn't log stuff to the console, which is
 * AWESOME. So here we'll force some newlines and things to hopefully
 * increase the chance that Jest will actually output something to the
 * console in time for the user to see it.
 */
console.log = function() {
  originalLog.apply(this, arguments);
  originalLog.call(this, chalk.green('\n ^^^ SOMETHING GOT LOGGED! ^^^\n'));
};
