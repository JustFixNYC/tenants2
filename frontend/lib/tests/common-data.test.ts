import { getDjangoChoiceLabel, validateDjangoChoices, allCapsToSlug, slugToAllCaps } from "../common-data";

test('getDjangoChoiceLabel() works', () => {
  expect(getDjangoChoiceLabel([['BLAH', 'boop']], 'BLAH')).toBe('boop');
  expect(() => getDjangoChoiceLabel([['BLAH', 'boop']], 'NOPE'))
    .toThrow('Unable to find label for value NOPE');
});

test("validateDjangoChoices() works", () => {
  expect(validateDjangoChoices([['BLAH', 'boop']], ['BLAH'])).toBeUndefined();
  expect(() => validateDjangoChoices([['BLAH', 'boop']], ['NOPE']))
    .toThrow('Unable to find label for value NOPE');
});

test("allCapsToSlug() works", () => {
  expect(allCapsToSlug('BOOP_BLAP_BONK')).toBe('boop-blap-bonk');
});

test("slugToAllCaps() works", () => {
  expect(slugToAllCaps('boop-blap-bonk')).toBe('BOOP_BLAP_BONK');
});
