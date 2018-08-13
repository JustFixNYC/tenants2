import React from 'react';
import { mount } from 'enzyme';

import { App, AppProps } from '../app';
import { createTestGraphQlClient } from './util';

test('app issues a SimpleQuery when mounted', () => {
  const { client } = createTestGraphQlClient();
  const props: AppProps = {
    staticURL: '/mystatic/',
    adminIndexURL: '/myadmin/',
    username: 'boop',
    debug: false,
    gqlClient: client
  };

  mount(<App {...props} />);

  const requests = client.getRequestQueue();
  expect(requests.length).toBe(1);
  expect(requests[0].query).toMatch('SimpleQuery');
});
