import React from 'react';
import { MemoryRouter, Route } from 'react-router';

import { LoadingOverlayManager, friendlyLoad, IMPERCEPTIBLE_MS, LoadingPage, LoadingPageWithRetry } from "../loading-page";
import { AppTesterPal } from './app-tester-pal';
import { assertNotNull } from '../util';
import { Link } from 'react-router-dom';
import loadable from '@loadable/component';
import { HelmetProvider } from 'react-helmet-async';
import ReactTestingLibraryPal from './rtl-pal';
import { nextTick } from './util';

type ImportPromiseFunc<Props> = () => Promise<{ default: React.ComponentType<Props>}>;

function createLoadablePage<Props>(
  loader: ImportPromiseFunc<Props>
) {
  return loadable(loader, {fallback: <LoadingPage/>});
}

const fakeForeverImportFn = () => new Promise(() => {});

describe('LoadingPageWithRetry', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('renders error page', async () => {
    const pal = new ReactTestingLibraryPal(
      <HelmetProvider>
        <MemoryRouter>
          <LoadingPageWithRetry error={true} retry={() => {}} />
        </MemoryRouter>
      </HelmetProvider>
    );
    await nextTick();
    expect(pal.rr.container.innerHTML).toContain('network error');
  });
});

describe('LoadingPage', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('renders loading screen', () => {
    const LoadablePage = createLoadablePage(fakeForeverImportFn as any);
    const pal = new ReactTestingLibraryPal(
      <HelmetProvider>
        <MemoryRouter>
          <LoadablePage />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(pal.rr.container.innerHTML).toContain('Loading');
  });
});

describe('LoadingOverlayManager', () => {
  const getOverlayDiv = (pal: AppTesterPal) =>
    pal.rr.container.querySelector('.jf-loading-overlay-wrapper');

  afterEach(AppTesterPal.cleanup);

  it('renders children and does not render overlay by default', () => {
    const pal = new AppTesterPal(<LoadingOverlayManager children={<p>boop</p>} />);
    pal.rr.getByText('boop');
    expect(getOverlayDiv(pal)).toBeNull();
  });

  it('renders overlay when loading, transitions it out when finished', async () => {
    let resolve: any = null;
    const fakeImportFn = () => new Promise((newResolve) => { resolve = newResolve; });
    const LoadablePage = createLoadablePage(fakeImportFn as any);
    const pal = new AppTesterPal(
      <LoadingOverlayManager>
        <LoadablePage/>
      </LoadingOverlayManager>
    );
    const overlayDiv = assertNotNull(getOverlayDiv(pal));
    expect(overlayDiv.className).toMatch('jf-loading-enter-active');
    resolve(() => <p>hallo</p>);

    await nextTick();

    pal.rr.getByText('hallo');
    expect(overlayDiv.className).toMatch('jf-loading-exit-active');
  });

  it('saves DOM snapshot when location changes, renders it inertly during load', () => {
    const LoadablePage = createLoadablePage(fakeForeverImportFn as any);
    const pal = new AppTesterPal(
      <LoadingOverlayManager>
        <Route path="/" exact render={() => {
          return <>
            <Link to="/boop">go to boop</Link>
            <Link to="/bap">go to bap</Link>
          </>;
        }} />
        <Route path="/boop" component={LoadablePage} />
        <Route path="/bap" render={() => { throw new Error("This should never be visited!") }} />
      </LoadingOverlayManager>
    );
    expect(getOverlayDiv(pal)).toBeNull();
    pal.clickButtonOrLink('go to boop');
    expect(getOverlayDiv(pal)).not.toBeNull();

    // We should be able to *see* this link, but clicking it shouldn't do anything,
    // because it's an inert clone of what used to be on the previous page.
    pal.clickButtonOrLink('go to bap');
  });
});

describe("friendlyLoad()", () => {
  let originalNow: any;
  let now = 0;

  beforeAll(() => {
    originalNow = Date.now;
    Date.now = () => now;
    jest.useFakeTimers();
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  it("resolves promise immediately when time elapsed is imperceptible", async () => {
    let value = null;
    friendlyLoad(Promise.resolve("boop")).then(v => { value = v });
    now = 1;
    await nextTick();
    expect(value).toBe("boop");
  });

  it("rejects promise immediately when time elapsed is imperceptible", async () => {
    let value = null;
    friendlyLoad(Promise.reject(new Error("alas oof"))).catch(e => { value = e });
    now = 1;
    await nextTick();
    expect((value as any).message).toBe("alas oof");
  });

  it("resolves promise after friendly amount of time otherwise", async () => {
    let value = null;
    friendlyLoad(Promise.resolve("boop")).then(v => { value = v; });
    now = IMPERCEPTIBLE_MS + 1;
    await nextTick();
    expect(value).toBeNull();
    jest.runAllTimers();
    await nextTick();
    expect(value).toBe("boop");
  });
});
