import React from 'react';
import { shallow } from 'enzyme';

import { App, AppProps } from '../app';
import { createTestGraphQlClient, FakeSessionInfo, FakeServerInfo } from './util';

test('app issues a LogoutMutation in handleLogout', () => {
  const { client } = createTestGraphQlClient();
  const props: AppProps = {
    initialURL: '/',
    initialSession: FakeSessionInfo,
    server: FakeServerInfo,
  };

  const wrapper = shallow(<App {...props} />);
  const app = wrapper.instance() as App;

  app.gqlClient = client;
  app.handleLogout();
  const requests = client.getRequestQueue();
  expect(requests.length).toBe(1);
  expect(requests[0].query).toMatch('LogoutMutation');
});
