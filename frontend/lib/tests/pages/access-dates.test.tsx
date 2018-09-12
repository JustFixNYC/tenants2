import React from 'react';

import { getInitialState } from '../../pages/access-dates';
import { MemoryRouter } from 'react-router';
import ReactTestingLibraryPal from '../rtl-pal';
import { createTestGraphQlClient, FakeAppContext } from '../util';
import { AppContextType, AppContext } from '../../app-context';
import Routes from '../../routes';
import LetterOfComplaintRoutes from '../../letter-of-complaint';


function createAccessDates(props: Partial<AppContextType> = {}): JSX.Element {
  const ctx: AppContextType = {
    ...FakeAppContext,
    ...props
  };
  return (
    <MemoryRouter initialEntries={[Routes.loc.accessDates]}>
      <AppContext.Provider value={ctx}>
        <LetterOfComplaintRoutes/>
      </AppContext.Provider>
    </MemoryRouter>
  );
}

describe('access dates page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('redirects to next step after successful submission', async () => {
    const { client } = createTestGraphQlClient();
    const updateSession = jest.fn();
    const pal = ReactTestingLibraryPal.render(createAccessDates({
      fetch: client.fetch,
      updateSession
    }));

    pal.fillFormFields([
      [/First access date/i, "2018-01-02"]
    ]);
    pal.clickButtonOrLink('Next');
    client.getRequestQueue()[0].resolve({ output: {
      errors: [],
      session: { accessDates: ['2018-01-02'] } }
    });

    await pal.rt.waitForElement(() => pal.rr.getByText(/Your landlord/i));
    expect(updateSession.mock.calls).toHaveLength(1);
    expect(updateSession.mock.calls[0][0]).toEqual({ accessDates: ['2018-01-02'] });
  });
});

test('getInitialState() works', () => {
  const BLANK = { date1: '', date2: '', date3: '' };
  const date1 = '2018-01-02';
  const date2 = '2019-01-02';

  expect(getInitialState([])).toEqual(BLANK);
  expect(getInitialState([date1])).toEqual({ ...BLANK, date1 });
  expect(getInitialState([date1, date2])).toEqual({ ...BLANK, date1, date2 });
});
