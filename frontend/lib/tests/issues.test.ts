import { customIssueForArea, areaIssueCount } from "../issues";

test('customIssueForArea() works', () => {
  const ci = [{area: 'HOME', description: 'blah'}];
  expect(customIssueForArea('HOME', ci)).toBe('blah');
  expect(customIssueForArea('BEDROOMS', ci)).toBe('');
});

test('areaIssueCount() works', () => {
  expect(areaIssueCount('HOME', ['HOME__MICE'], [{
    area: 'HOME', description: 'boop'
  }])).toBe(2);
  expect(areaIssueCount('HOME', ['BEDROOMS_PAINT'], [])).toBe(0);
  expect(areaIssueCount('HOME', [], [{
    area: 'BEDROOMS', description: 'boop'
  }])).toBe(0);
});
