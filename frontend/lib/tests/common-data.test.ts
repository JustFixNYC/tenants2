import { allCapsToSlug, slugToAllCaps, toDjangoChoices } from "../common-data";

test("allCapsToSlug() works", () => {
  expect(allCapsToSlug('BOOP_BLAP_BONK')).toBe('boop-blap-bonk');
});

test("slugToAllCaps() works", () => {
  expect(slugToAllCaps('boop-blap-bonk')).toBe('BOOP_BLAP_BONK');
});

test("toDjangoChoices() works", () => {
  type Blarg = 'foo'|'bar';
  const blargs: Blarg[] = ['foo', 'bar'];
  const blargLabels = {
    foo: 'hi',
    bar: 'there'
  };
  expect(toDjangoChoices(blargs, blargLabels)).toEqual([
    ['foo', 'hi'],
    ['bar', 'there']
  ]);
});
