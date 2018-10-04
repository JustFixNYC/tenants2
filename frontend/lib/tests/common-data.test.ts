import { getDjangoChoiceLabel, validateDjangoChoices, allCapsToSlug, slugToAllCaps, filterDjangoChoices, DjangoChoices } from "../common-data";

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

test("filterDjangoChoices() works", () => {
  const choices: DjangoChoices = [["FOO", "Foo"], ["BAR", "Bar"]];
  expect(filterDjangoChoices(choices, ["FOO"])).toEqual([["BAR", "Bar"]]);
  expect(filterDjangoChoices(choices, /^BA/)).toEqual([["FOO", "Foo"]]);
});
