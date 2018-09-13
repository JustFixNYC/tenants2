import React from 'react';

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
    <MemoryRouter initialEntries={[Routes.loc.yourLandlord]}>
      <AppContext.Provider value={ctx}>
        <LetterOfComplaintRoutes/>
      </AppContext.Provider>
    </MemoryRouter>
  );
}

describe('landlord details page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('redirects to next step after successful submission', async () => {
    const { client } = createTestGraphQlClient();
    const updateSession = jest.fn();
    const pal = ReactTestingLibraryPal.render(createAccessDates({
      fetch: client.fetch,
      updateSession
    }));
    const name = "Boop Jones";
    const address = "123 Boop Way\nBoopville, NY 11299";

    pal.fillFormFields([
      [/name/i, name],
      [/address/i, address]
    ]);
    pal.clickButtonOrLink('Preview letter');
    client.getRequestQueue()[0].resolve({ output: {
      errors: [],
      session: { landlordDetails: { name, address } } }
    });

    await pal.rt.waitForElement(() => pal.rr.getByText(/Review the letter of complaint/i));
    expect(updateSession.mock.calls).toHaveLength(1);
    expect(updateSession.mock.calls[0][0]).toEqual({ landlordDetails: { name, address } });
  });
});
