import React from 'react';

import { IssuesRoutes, customIssueForArea, areaIssueCount } from '../../pages/issues';
import Routes from '../../routes';
import { AppTesterPal } from '../app-tester-pal';
import { IssueAreaInput } from '../../queries/globalTypes';
import { IssueAreaMutation_output } from '../../queries/IssueAreaMutation';


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
