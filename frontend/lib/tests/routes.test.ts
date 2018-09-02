import { isModalRoute, RouteMap } from "../routes";

test('isModalRoute() works', () => {
  expect(isModalRoute('/blah')).toBe(false);
  expect(isModalRoute('/blah', '/oof/flarg-modal')).toBe(true);
});

test('RouteMap works', () => {
  const map = new RouteMap({ blah: '/blah', thing: { a: '/a', b: '/b' } });
  expect(map.exists('/blah')).toBe(true);
  expect(map.exists('/a')).toBe(true);
  expect(map.exists('/b')).toBe(true);
  expect(map.exists('/c')).toBe(false);
});
