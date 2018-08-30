import React from 'react';
import IndexPage from '../../pages/index-page';
import { shallowWithRouter } from '../util';

describe('index page', () => {
  it('renders when logged in', () => {
    const { wrapper } = shallowWithRouter(<IndexPage isLoggedIn={true} />);
    expect(wrapper.html()).toContain('Hello authenticated user');
  });

  it('renders when logged out', () => {
    const { wrapper } = shallowWithRouter(<IndexPage isLoggedIn={false} />);
    expect(wrapper.html()).toContain('Get started');
  });
});
