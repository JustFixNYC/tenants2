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
