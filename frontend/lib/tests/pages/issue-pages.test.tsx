import React from 'react';

import { IssuesRoutes, getIssueLabel, groupByTwo } from '../../pages/issue-pages';
import Routes from '../../routes';
import { AppTesterPal } from '../app-tester-pal';
import { IssueAreaInput } from '../../queries/globalTypes';
import { IssueAreaMutation_output } from '../../queries/IssueAreaMutation';
import { ISSUE_AREA_CHOICES } from '../../issues';
import ISSUE_AREA_SVGS from '../../svg/issues';


const routes = Routes.loc.issues;

const TestIssuesRoutes = () => 
  <IssuesRoutes routes={Routes.loc.issues} toBack="back" toNext="next"/>;

describe('issues checklist', () => {
  afterEach(AppTesterPal.cleanup);

  it('returns 404 for invalid area routes', () => {
    const pal = new AppTesterPal(<TestIssuesRoutes />, {
      url: routes.area.create('LOL')
    });
    pal.rr.getByText('Alas.');
  });

  it('works on valid area routes', async () => {
    const pal = new AppTesterPal(<TestIssuesRoutes />, {
      url: routes.area.create('HOME'),
      session: {
        issues: ['BEDROOMS__PAINT']
      }
    });
    pal.clickRadioOrCheckbox(/Mice/i);
    pal.clickButtonOrLink('Save');

    pal.expectFormInput<IssueAreaInput>({
      area: 'HOME', issues: ['HOME__MICE'], other: ''
    });
    pal.respondWithFormOutput<IssueAreaMutation_output>({
      errors: [],
      session: { issues: ['HOME__MICE'], customIssues: [] }
    });
    await pal.rt.waitForElement(() => pal.rr.getByText('Apartment self-inspection'));
  });

  it('has a functional issue search autocomplete', async () => {
    const pal = new AppTesterPal(<TestIssuesRoutes />, {
      url: routes.home
    });
    pal.fillFormFields([[/search/i, "mice"]]);
    pal.clickListItem(/mice/i);
    const input = pal.rr.getByLabelText(/search/i) as HTMLInputElement;
    expect(input.value).toBe('Entire home and hallways - Mice');
  });
});

test('getIssueLabel() works', () => {
  expect(getIssueLabel(0)).toBe('No issues reported');
  expect(getIssueLabel(1)).toBe('One issue reported');
  expect(getIssueLabel(2)).toBe('2 issues reported');
  expect(getIssueLabel(99)).toBe('99 issues reported');
});

test('issue area images exist', () => {
  ISSUE_AREA_CHOICES.forEach(([area, _]) => {
    const svg = ISSUE_AREA_SVGS[area];
    if (!svg) {
      throw new Error(`Expected ISSUE_AREA_SVGS.${area} to exist`);
    }
  });
});

test('groupByTwo() works', () => {
  expect(groupByTwo([1])).toEqual([[1, null]]);
  expect(groupByTwo([1, 2])).toEqual([[1, 2]]);
  expect(groupByTwo([1, 2, 3])).toEqual([[1, 2], [3, null]]);
});
