import React from 'react';
import { shallow } from 'enzyme';
import { MemoryRouter } from 'react-router';

import Page from '../page';
import { HelmetProvider } from 'react-helmet-async';

describe('Page', () => {
  it('Renders children', () => {
    const page = shallow(
      <HelmetProvider>
        <MemoryRouter>
          <Page title="boop">hello there</Page>
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(page.html()).toContain('hello there');
  });
});
