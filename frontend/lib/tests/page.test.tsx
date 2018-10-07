import React from 'react';
import { shallow } from 'enzyme';
import { MemoryRouter } from 'react-router';

import Page from '../page';

describe('Page', () => {
  it('Renders children', () => {
    const page = shallow(
      <MemoryRouter>
        <Page title="boop">hello there</Page>
      </MemoryRouter>
    );
    expect(page.html()).toContain('hello there');
  });
});
