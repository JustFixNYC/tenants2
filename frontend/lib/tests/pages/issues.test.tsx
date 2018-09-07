import React from 'react';

import { MemoryRouter } from 'react-router';
import { FakeSessionInfo, createTestGraphQlClient, FakeAppContext } from '../util';
import { AllSessionInfo } from '../../queries/AllSessionInfo';
import ReactTestingLibraryPal from '../rtl-pal';
import { AppContextType, AppContext } from '../../app-context';
import { IssuesRoutes, customIssueForArea } from '../../pages/issues';
import Routes from '../../routes';


const routes = Routes.loc.issues;

function createIssuesPage(url: string, appContextProps: Partial<AppContextType> = {}): JSX.Element {
  const appContext = {
    ...FakeAppContext,
    ...appContextProps
  };
  return (
    <MemoryRouter initialEntries={[url]} initialIndex={0}>
      <AppContext.Provider value={appContext}>
        <IssuesRoutes />
      </AppContext.Provider>
    </MemoryRouter>
  );
}

describe('issues checklist', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('returns 404 for invalid area routes', () => {
    const pal = ReactTestingLibraryPal.render(createIssuesPage(routes.area.create('LOL')));
    pal.rr.getByText('Alas.');
  });

  it('works on valid area routes', async () => {
    const { client } = createTestGraphQlClient();
    let session: AllSessionInfo = { ...FakeSessionInfo, issues: ['BEDROOMS_PAINT'] };
    const pal = ReactTestingLibraryPal.render(createIssuesPage(routes.area.create('HOME'), {
      fetch: client.fetch,
      session
    }));
    pal.click(/Mice/i, 'label');
    pal.clickButtonOrLink('Save');

    const req = client.getRequestQueue()[0];
    expect(req.variables['input']).toEqual({ area: 'HOME', issues: ['HOME__MICE'], other: '' });
    session = {...session, issues: [...session.issues, 'HOME__MICE'] };
    req.resolve({ issueArea: { errors: [], session } });
    await pal.rt.waitForElement(() => pal.rr.getByText('Issue checklist'));
  });
});

test('customIssueForArea() works', () => {
  const ci = [{area: 'HOME', description: 'blah'}];
  expect(customIssueForArea('HOME', ci)).toBe('blah');
  expect(customIssueForArea('BEDROOMS', ci)).toBe('');
});
