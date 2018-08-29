import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { defaultContext } from '../app-context';
import { FakeAppContext } from './util';

configure({ adapter: new Adapter() });

Object.keys(FakeAppContext).forEach(prop => {
  Object.defineProperty(defaultContext, prop, {
    value: (FakeAppContext as any)[prop]
  });
});

// react-aria-modal seems to call this, but jsdom
// doesn't support it, and throws an exception when
// it's called. So we'll just stub it out.
window.scroll = jest.fn();
