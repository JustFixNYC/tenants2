import React from 'react';
import Loadable, { LoadableComponent } from 'react-loadable';
import { MemoryRouter, Route } from 'react-router';

import { LoadingPage, LoadingOverlayManager, friendlyLoad, IMPERCEPTIBLE_MS } from "../loading-page";
import { shallow, mount } from 'enzyme';
import { AppTesterPal } from './app-tester-pal';
import { assertNotNull } from '../util';
import { Link } from 'react-router-dom';

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

const fakeForeverImportFn = () => new Promise(() => {});
const nextTick = () => new Promise((resolve) => process.nextTick(resolve));

describe('LoadingPage', () => {
  it('renders loading screen', () => {
    const LoadablePage = createLoadablePage(fakeForeverImportFn as any);
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
    await nextTick();
    expect(page.update().html()).toContain('network error');
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
    friendlyLoad(Promise.reject(new Error("alas"))).catch(e => { value = e });
    now = 1;
    await nextTick();
    expect((value as any).message).toBe("alas");
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
