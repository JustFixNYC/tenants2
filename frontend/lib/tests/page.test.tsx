import React from 'react';
import { shallow, mount } from 'enzyme';
import Page, { createLoadablePage } from '../page';
import { MemoryRouter } from 'react-router';


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

describe('createLoadablePage()', () => {
  it('renders loading screen', () => {
    const fakeImportFn = () => new Promise(() => {});
    const LoadablePage = createLoadablePage(fakeImportFn as any);
    const page = shallow(
      <MemoryRouter>
        <LoadablePage />
      </MemoryRouter>
    );
    expect(page.html()).toContain('Loading');
  });

  it('renders error page', async () => {
    const fakeImportFn = () => Promise.reject(new Error('blah'));
    const LoadablePage = createLoadablePage(fakeImportFn as any);
    const page = mount(
      <MemoryRouter>
        <LoadablePage />
      </MemoryRouter>
    );
    await new Promise((resolve) => process.nextTick(resolve));
    expect(page.update().html()).toContain('network error');
  });
});
