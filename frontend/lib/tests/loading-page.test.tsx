import React from 'react';
import Loadable, { LoadableComponent } from 'react-loadable';
import { MemoryRouter } from 'react-router';

import { LoadingPage } from "../loading-page";
import { shallow, mount } from 'enzyme';

describe('LoadingPage', () => {
  type ImportPromiseFunc<Props> = () => Promise<{ default: React.ComponentType<Props>}>;

  // This used to be actual library code, but it seems react-loadable has some kind of
  // static analysis to determine bundle pre-loading which breaks when we abstract
  // things out like this, so we'll just make it part of the test suite I guess.
  function createLoadablePage<Props>(
    loader: ImportPromiseFunc<Props>
  ): React.ComponentType<Props> & LoadableComponent {
    return Loadable({
      loader,
      loading: LoadingPage
    });
  }

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
