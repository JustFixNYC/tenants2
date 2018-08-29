import { isModalRoute } from "../routes";

test('isModalRoute() works', () => {
  expect(isModalRoute('/blah')).toBe(false);
  expect(isModalRoute('/blah', '/oof/flarg-modal')).toBe(true);
});
