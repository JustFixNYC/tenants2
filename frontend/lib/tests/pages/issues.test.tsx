import fs from 'fs';
import path from 'path';
import React from 'react';

import { IssuesRoutes, customIssueForArea, areaIssueCount, getIssueLabel, ISSUE_AREA_CHOICES, getIssueAreaImagePath, groupByTwo, IssueAutocomplete } from '../../pages/issues';
import Routes from '../../routes';
import { AppTesterPal } from '../app-tester-pal';
import { IssueAreaInput } from '../../queries/globalTypes';
import { IssueAreaMutation_output } from '../../queries/IssueAreaMutation';
import ReactTestingLibraryPal from '../rtl-pal';


const routes = Routes.loc.issues;


describe('issues checklist', () => {
  afterEach(AppTesterPal.cleanup);

  it('returns 404 for invalid area routes', () => {
    const pal = new AppTesterPal(<IssuesRoutes />, {
      url: routes.area.create('LOL')
    });
    pal.rr.getByText('Alas.');
  });

  it('works on valid area routes', async () => {
    const pal = new AppTesterPal(<IssuesRoutes />, {
      url: routes.area.create('HOME'),
      session: {
        issues: ['BEDROOMS__PAINT']
      }
    });
    pal.click(/Mice/i, 'label');
    pal.clickButtonOrLink('Save');

    pal.expectFormInput<IssueAreaInput>({
      area: 'HOME', issues: ['HOME__MICE'], other: ''
    });
    pal.respondWithFormOutput<IssueAreaMutation_output>({
      errors: [],
      session: { issues: ['HOME__MICE'], customIssues: [] }
    });
    await pal.rt.waitForElement(() => pal.rr.getByText('Issue checklist'));
  });
});

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

test('getIssueLabel() works', () => {
  expect(getIssueLabel(0)).toBe('No issues reported');
  expect(getIssueLabel(1)).toBe('One issue reported');
  expect(getIssueLabel(2)).toBe('2 issues reported');
  expect(getIssueLabel(99)).toBe('99 issues reported');
});

test('issue area images exist', () => {
  const STATIC_ROOT = path.join(__dirname, '..', '..', '..', 'static');

  ISSUE_AREA_CHOICES.forEach(([area, _]) => {
    const imgPath = path.resolve(path.join(STATIC_ROOT, getIssueAreaImagePath(area)));
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Expected ${imgPath} to exist for issue area ${area}`);
    }
  });
});

test('groupByTwo() works', () => {
  expect(groupByTwo([1])).toEqual([[1, null]]);
  expect(groupByTwo([1, 2])).toEqual([[1, 2]]);
  expect(groupByTwo([1, 2, 3])).toEqual([[1, 2], [3, null]]);
});

test('IssueAutocomplete works', () => {
  const mockChange = jest.fn();
  const pal = new ReactTestingLibraryPal(
    <IssueAutocomplete
      inputValue="zzzzz"
      onInputValueChange={mockChange}
    />
  );
  pal.rr.getByLabelText(/search/i);
});
