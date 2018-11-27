import { isModalRoute, RouteMap, getSignupIntentRouteInfo } from "../routes";
import { SignupIntentChoice } from "../signup-intent";

test('isModalRoute() works', () => {
  expect(isModalRoute('/blah')).toBe(false);
  expect(isModalRoute('/blah', '/oof/flarg-modal')).toBe(true);
});

describe('getSignupIntentRouteInfo', () => {
  it('returns an object for all choices', () => {
    for (let choice in SignupIntentChoice) {
      expect(getSignupIntentRouteInfo(choice as SignupIntentChoice))
        .not.toBeUndefined();
    }
  });
});

describe('RouteMap', () => {
  it('supports non-parameterized routes', () => {
    const map = new RouteMap({ blah: '/blah', thing: { a: '/a', b: '/b' } });
    expect(map.size).toEqual(3);
    expect(map.exists('/blah')).toBe(true);
    expect(map.exists('/a')).toBe(true);
    expect(map.exists('/b')).toBe(true);
    expect(map.exists('/c')).toBe(false);
  });

  it('ignores route prefixes', () => {
    const map = new RouteMap({ prefix: '/blah' });
    expect(map.size).toEqual(0);
    expect(map.exists('/blah')).toBe(false);
  });

  it('does not double-count the same route', () => {
    const map = new RouteMap({ thing: { prefix: '/thing', home: '/thing' } });
    expect(map.size).toEqual(1);
  });

  it('ignores functions', () => {
    const map = new RouteMap({ blah: '/blah', thing: () => {} });
    expect(map.size).toEqual(1);
  });

  it('supports parameterized routes', () => {
    const map = new RouteMap({ blah: '/blah/:id([0-9]+)' });
    expect(map.size).toEqual(1);
    expect(map.exists('/blah/7')).toBe(true);
    expect(map.exists('/blah/9/zorp')).toBe(false);
  });
});
