import { customIssuesForArea, areaIssueCount } from "../issues";
import { CustomIssueArea } from "../queries/globalTypes";
import { AllSessionInfo_customIssuesV2 } from "../queries/AllSessionInfo";

test('customIssuesForArea() works', () => {
  const item: AllSessionInfo_customIssuesV2 = {
    area: CustomIssueArea.HOME,
    description: 'blah',
    id: '5'
  };
  expect(customIssuesForArea('HOME', [item])).toEqual([item]);
  expect(customIssuesForArea('BEDROOMS', [item])).toEqual([]);
});

test('areaIssueCount() works', () => {
  expect(areaIssueCount('HOME', ['HOME__MICE'], [{
    area: CustomIssueArea.HOME, description: 'boop', id: '5'
  }])).toBe(2);
  expect(areaIssueCount('HOME', ['BEDROOMS__PAINT'], [])).toBe(0);
  expect(areaIssueCount('HOME', [], [{
    area: CustomIssueArea.BEDROOMS, description: 'boop', id: '5'
  }])).toBe(0);
});
