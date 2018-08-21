import { appStaticContextAsStaticRouterContext, getAppStaticContext } from "../app-static-context";

test('appStaticContextAsStaticRouterContext() returns its argument', () => {
  const arg = {};
  expect(appStaticContextAsStaticRouterContext(arg as any))
    .toBe(arg);
});

describe('getAppStaticContext()', () => {
  it('returns null if arg has no staticContext prop', () => {
    expect(getAppStaticContext({} as any)).toBeNull();
    expect(getAppStaticContext(null as any)).toBeNull();
  });

  it('returns staticContext prop if it exists', () => {
    const staticContext = {};
    expect(getAppStaticContext({ staticContext } as any))
      .toBe(staticContext);
  });
});
