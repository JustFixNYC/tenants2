import React from 'react';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router';

import IndexPage, { IndexPageProps  } from '../index-page';
import { createTestGraphQlClient, FakeServerInfo, FakeSessionInfo } from './util';

test('index page issues a SimpleQuery when mounted', () => {
  const { client } = createTestGraphQlClient();
  const props: IndexPageProps = {
    server: FakeServerInfo,
    session: FakeSessionInfo,
    loginLoading: false,
    logoutLoading: false,
    gqlClient: client,
    onFetchError: jest.fn(),
    onLogout: jest.fn(),
    onLoginSubmit: jest.fn()
  };

  mount(
    <MemoryRouter>
      <IndexPage {...props} />
    </MemoryRouter>
  );

  const requests = client.getRequestQueue();
  expect(requests.length).toBe(1);
  expect(requests[0].query).toMatch('SimpleQuery');
});
