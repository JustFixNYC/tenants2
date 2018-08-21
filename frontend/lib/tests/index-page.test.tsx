import React from 'react';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router';

import IndexPage, { IndexPageProps  } from '../index-page';
import { FakeServerInfo, FakeSessionInfo } from './util';

test('index page renders', () => {
  const props: IndexPageProps = {
    server: FakeServerInfo,
    session: FakeSessionInfo,
    loginLoading: false,
    logoutLoading: false,
    onLogout: jest.fn(),
    onLoginSubmit: jest.fn()
  };

  const page = mount(
    <MemoryRouter>
      <IndexPage {...props} />
    </MemoryRouter>
  );

  expect(page.html()).toContain('Ahoy');
});
