import { isModalRoute, RouteMap } from "../routes";

test('isModalRoute() works', () => {
  expect(isModalRoute('/blah')).toBe(false);
  expect(isModalRoute('/blah', '/oof/flarg-modal')).toBe(true);
});

describe('RouteMap', () => {
  it('supports non-parameterized routes', () => {
    const map = new RouteMap({ blah: '/blah', thing: { a: '/a', b: '/b' } });
    expect(map.exists('/blah')).toBe(true);
    expect(map.exists('/a')).toBe(true);
    expect(map.exists('/b')).toBe(true);
    expect(map.exists('/c')).toBe(false);
  });

  it('supports parameterized routes', () => {
    const map = new RouteMap({ blah: '/blah/:id([0-9]+)' });
    expect(map.exists('/blah/7')).toBe(true);
    expect(map.exists('/blah/9/zorp')).toBe(false);
  });
});
